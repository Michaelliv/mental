/**
 * Tests for storage functions
 */

import { describe, test, expect } from 'bun:test';
import {
  parseNDJSON,
  serializeEvent,
  createEntityCreatedEvent,
  createEntityDeletedEvent,
  createEntityRenamedEvent,
  createEntityUpdatedEvent,
  computeArrayChanges,
  computeScalarChange,
} from './storage';
import { CURRENT_EVENT_VERSION } from './types';
import type { Domain, Capability, Aspect, Decision, ModelEvent } from './types';

describe('computeArrayChanges', () => {
  test('detects pure addition', () => {
    const result = computeArrayChanges(['a'], ['a', 'b']);
    expect(result).toEqual({ op: 'array_add', values: ['b'] });
  });

  test('detects pure removal', () => {
    const result = computeArrayChanges(['a', 'b'], ['a']);
    expect(result).toEqual({ op: 'array_remove', values: ['b'] });
  });

  test('uses set for mixed changes', () => {
    const result = computeArrayChanges(['a', 'b'], ['b', 'c']);
    expect(result).toEqual({ op: 'set', value: ['b', 'c'] });
  });

  test('returns null for no change', () => {
    const result = computeArrayChanges(['a', 'b'], ['a', 'b']);
    expect(result).toBeNull();
  });

  test('handles undefined old array', () => {
    const result = computeArrayChanges(undefined, ['a', 'b']);
    expect(result).toEqual({ op: 'array_add', values: ['a', 'b'] });
  });

  test('handles undefined new array as empty', () => {
    const result = computeArrayChanges(['a', 'b'], undefined);
    expect(result).toEqual({ op: 'array_remove', values: ['a', 'b'] });
  });

  test('handles both undefined', () => {
    const result = computeArrayChanges(undefined, undefined);
    expect(result).toBeNull();
  });
});

describe('computeScalarChange', () => {
  test('returns null for same value', () => {
    const result = computeScalarChange('foo', 'foo');
    expect(result).toBeNull();
  });

  test('returns set for changed value', () => {
    const result = computeScalarChange('foo', 'bar');
    expect(result).toEqual({ op: 'set', value: 'bar' });
  });

  test('returns unset for undefined new value', () => {
    const result = computeScalarChange('foo', undefined);
    expect(result).toEqual({ op: 'unset' });
  });

  test('returns unset for null new value', () => {
    const result = computeScalarChange('foo', null);
    expect(result).toEqual({ op: 'unset' });
  });

  test('returns set for new value from undefined', () => {
    const result = computeScalarChange(undefined, 'bar');
    expect(result).toEqual({ op: 'set', value: 'bar' });
  });
});

describe('createEntityCreatedEvent', () => {
  test('creates event with correct structure for domain', () => {
    const domain: Domain = { name: 'Order', description: 'A purchase order' };
    const event = createEntityCreatedEvent('domain', domain);

    expect(event.eventType).toBe('EntityCreated');
    expect(event.entityType).toBe('domain');
    expect(event.entityId).toBe('Order');
    expect(event.version).toBe(CURRENT_EVENT_VERSION);
    expect(event.payload).toEqual(domain);
    expect(event.timestamp).toBeDefined();
  });

  test('creates event with correct structure for decision', () => {
    const decision: Decision = {
      id: 'dec-123',
      what: 'Use soft deletes',
      why: 'Audit trail',
      when: '2024-01-01T00:00:00.000Z',
      relates_to: {},
    };
    const event = createEntityCreatedEvent('decision', decision);

    expect(event.entityId).toBe('dec-123');
    expect(event.payload).toEqual(decision);
  });
});

describe('createEntityDeletedEvent', () => {
  test('creates delete event with version', () => {
    const event = createEntityDeletedEvent('domain', 'Test');

    expect(event.eventType).toBe('EntityDeleted');
    expect(event.entityType).toBe('domain');
    expect(event.entityId).toBe('Test');
    expect(event.version).toBe(CURRENT_EVENT_VERSION);
    expect(event.payload).toEqual({});
  });
});

describe('createEntityRenamedEvent', () => {
  test('creates rename event with cascade flag', () => {
    const event = createEntityRenamedEvent('domain', 'OldName', 'NewName', true);

    expect(event.eventType).toBe('EntityRenamed');
    expect(event.entityType).toBe('domain');
    expect(event.entityId).toBe('OldName');
    expect(event.version).toBe(CURRENT_EVENT_VERSION);
    expect(event.payload.oldName).toBe('OldName');
    expect(event.payload.newName).toBe('NewName');
    expect(event.payload.cascadeReferences).toBe(true);
  });
});

describe('createEntityUpdatedEvent', () => {
  test('creates update event with field changes', () => {
    const changes = {
      description: { op: 'set' as const, value: 'New description' },
      references: { op: 'array_add' as const, values: ['User'] },
    };
    const event = createEntityUpdatedEvent('domain', 'Test', changes);

    expect(event.eventType).toBe('EntityUpdated');
    expect(event.entityType).toBe('domain');
    expect(event.entityId).toBe('Test');
    expect(event.version).toBe(CURRENT_EVENT_VERSION);
    expect(event.payload.changes).toEqual(changes);
  });
});

describe('serializeEvent', () => {
  test('serializes event to JSON string', () => {
    const event = createEntityCreatedEvent('domain', {
      name: 'Test',
      description: 'Test domain',
    });
    const serialized = serializeEvent(event);

    const parsed = JSON.parse(serialized);
    expect(parsed.eventType).toBe('EntityCreated');
    expect(parsed.entityId).toBe('Test');
  });
});

describe('parseNDJSON', () => {
  test('replays EntityCreated events', () => {
    const event = createEntityCreatedEvent('domain', {
      name: 'Order',
      description: 'A purchase order',
    });
    const content = serializeEvent(event);

    const model = parseNDJSON(content);

    expect(model.domains['Order']).toBeDefined();
    expect(model.domains['Order'].description).toBe('A purchase order');
  });

  test('handles empty content', () => {
    const model = parseNDJSON('');

    expect(Object.keys(model.domains)).toHaveLength(0);
    expect(Object.keys(model.capabilities)).toHaveLength(0);
    expect(Object.keys(model.aspects)).toHaveLength(0);
    expect(Object.keys(model.decisions)).toHaveLength(0);
  });

  test('handles EntityDeleted', () => {
    const createEvent = createEntityCreatedEvent('domain', {
      name: 'Test',
      description: 'Test',
    });
    const deleteEvent = createEntityDeletedEvent('domain', 'Test');
    const content = [createEvent, deleteEvent].map(serializeEvent).join('\n');

    const model = parseNDJSON(content);

    expect(model.domains['Test']).toBeUndefined();
  });

  test('handles EntityUpdated with set operation', () => {
    const createEvent = createEntityCreatedEvent('domain', {
      name: 'Test',
      description: 'Original',
    });
    const updateEvent = createEntityUpdatedEvent('domain', 'Test', {
      description: { op: 'set', value: 'Updated' },
    });
    const content = [createEvent, updateEvent].map(serializeEvent).join('\n');

    const model = parseNDJSON(content);

    expect(model.domains['Test'].description).toBe('Updated');
  });

  test('handles EntityUpdated with array_add operation', () => {
    const createEvent = createEntityCreatedEvent('domain', {
      name: 'Test',
      description: 'Test',
      references: ['User'],
    });
    const updateEvent = createEntityUpdatedEvent('domain', 'Test', {
      references: { op: 'array_add', values: ['Account'] },
    });
    const content = [createEvent, updateEvent].map(serializeEvent).join('\n');

    const model = parseNDJSON(content);

    expect(model.domains['Test'].references).toEqual(['User', 'Account']);
  });

  test('handles EntityUpdated with array_remove operation', () => {
    const createEvent = createEntityCreatedEvent('domain', {
      name: 'Test',
      description: 'Test',
      references: ['User', 'Account'],
    });
    const updateEvent = createEntityUpdatedEvent('domain', 'Test', {
      references: { op: 'array_remove', values: ['User'] },
    });
    const content = [createEvent, updateEvent].map(serializeEvent).join('\n');

    const model = parseNDJSON(content);

    expect(model.domains['Test'].references).toEqual(['Account']);
  });

  test('handles EntityUpdated with unset operation', () => {
    const createEvent = createEntityCreatedEvent('domain', {
      name: 'Test',
      description: 'Test',
      references: ['User'],
    });
    const updateEvent = createEntityUpdatedEvent('domain', 'Test', {
      references: { op: 'unset' },
    });
    const content = [createEvent, updateEvent].map(serializeEvent).join('\n');

    const model = parseNDJSON(content);

    expect(model.domains['Test'].references).toBeUndefined();
  });

  test('handles EntityRenamed without cascade', () => {
    const createEvent = createEntityCreatedEvent('domain', {
      name: 'Order',
      description: 'Order domain',
    });
    const renameEvent = createEntityRenamedEvent('domain', 'Order', 'Purchase', false);
    const content = [createEvent, renameEvent].map(serializeEvent).join('\n');

    const model = parseNDJSON(content);

    expect(model.domains['Purchase']).toBeDefined();
    expect(model.domains['Purchase'].name).toBe('Purchase');
    expect(model.domains['Order']).toBeUndefined();
  });

  test('cascades renames to capability operates_on', () => {
    const domainEvent = createEntityCreatedEvent('domain', {
      name: 'Order',
      description: 'Order domain',
    });
    const capEvent = createEntityCreatedEvent('capability', {
      name: 'Checkout',
      description: 'Checkout capability',
      operates_on: ['Order'],
    });
    const renameEvent = createEntityRenamedEvent('domain', 'Order', 'Purchase', true);
    const content = [domainEvent, capEvent, renameEvent].map(serializeEvent).join('\n');

    const model = parseNDJSON(content);

    expect(model.domains['Purchase']).toBeDefined();
    expect(model.domains['Order']).toBeUndefined();
    expect(model.capabilities['Checkout'].operates_on).toEqual(['Purchase']);
  });

  test('cascades renames to aspect applies_to.domains', () => {
    const domainEvent = createEntityCreatedEvent('domain', {
      name: 'Order',
      description: 'Order domain',
    });
    const aspectEvent = createEntityCreatedEvent('aspect', {
      name: 'Auth',
      description: 'Auth aspect',
      applies_to: { domains: ['Order'] },
    });
    const renameEvent = createEntityRenamedEvent('domain', 'Order', 'Purchase', true);
    const content = [domainEvent, aspectEvent, renameEvent].map(serializeEvent).join('\n');

    const model = parseNDJSON(content);

    expect(model.aspects['Auth'].applies_to?.domains).toEqual(['Purchase']);
  });

  test('cascades renames to decision relates_to', () => {
    const domainEvent = createEntityCreatedEvent('domain', {
      name: 'Order',
      description: 'Order domain',
    });
    const decisionEvent = createEntityCreatedEvent('decision', {
      id: 'dec-1',
      what: 'Soft deletes',
      why: 'Audit trail',
      when: '2024-01-01T00:00:00.000Z',
      relates_to: { domains: ['Order'] },
    });
    const renameEvent = createEntityRenamedEvent('domain', 'Order', 'Purchase', true);
    const content = [domainEvent, decisionEvent, renameEvent].map(serializeEvent).join('\n');

    const model = parseNDJSON(content);

    expect(model.decisions['dec-1'].relates_to.domains).toEqual(['Purchase']);
  });

  test('handles time-travel with asOfTimestamp', () => {
    const t1 = '2024-01-01T00:00:00.000Z';
    const t2 = '2024-01-02T00:00:00.000Z';
    const t3 = '2024-01-03T00:00:00.000Z';

    // Manually create events with specific timestamps
    const event1 = {
      ...createEntityCreatedEvent('domain', { name: 'First', description: 'First' }),
      timestamp: t1,
    };
    const event2 = {
      ...createEntityCreatedEvent('domain', { name: 'Second', description: 'Second' }),
      timestamp: t2,
    };
    const event3 = {
      ...createEntityCreatedEvent('domain', { name: 'Third', description: 'Third' }),
      timestamp: t3,
    };

    const content = [event1, event2, event3].map(serializeEvent).join('\n');

    // Query at t2 - should only see First and Second
    const model = parseNDJSON(content, t2);

    expect(model.domains['First']).toBeDefined();
    expect(model.domains['Second']).toBeDefined();
    expect(model.domains['Third']).toBeUndefined();
  });

  test('handles capabilities', () => {
    const event = createEntityCreatedEvent('capability', {
      name: 'Checkout',
      description: 'Checkout flow',
      operates_on: ['Order', 'User'],
      composes: ['Payment'],
    });
    const content = serializeEvent(event);

    const model = parseNDJSON(content);

    expect(model.capabilities['Checkout']).toBeDefined();
    expect(model.capabilities['Checkout'].operates_on).toEqual(['Order', 'User']);
    expect(model.capabilities['Checkout'].composes).toEqual(['Payment']);
  });

  test('handles aspects', () => {
    const event = createEntityCreatedEvent('aspect', {
      name: 'Auth',
      description: 'Authentication',
      applies_to: { capabilities: ['Checkout', 'Profile'] },
    });
    const content = serializeEvent(event);

    const model = parseNDJSON(content);

    expect(model.aspects['Auth']).toBeDefined();
    expect(model.aspects['Auth'].applies_to?.capabilities).toEqual(['Checkout', 'Profile']);
  });

  test('handles decisions', () => {
    const event = createEntityCreatedEvent('decision', {
      id: 'dec-123',
      what: 'Use event sourcing',
      why: 'Audit trail and time-travel',
      when: '2024-01-01T00:00:00.000Z',
      relates_to: { domains: ['Order'], capabilities: ['Checkout'] },
    });
    const content = serializeEvent(event);

    const model = parseNDJSON(content);

    expect(model.decisions['dec-123']).toBeDefined();
    expect(model.decisions['dec-123'].what).toBe('Use event sourcing');
    expect(model.decisions['dec-123'].relates_to.domains).toEqual(['Order']);
  });

  test('updates lastUpdated to most recent event timestamp', () => {
    const t1 = '2024-01-01T00:00:00.000Z';
    const t2 = '2024-01-05T00:00:00.000Z';

    const event1 = {
      ...createEntityCreatedEvent('domain', { name: 'First', description: 'First' }),
      timestamp: t1,
    };
    const event2 = {
      ...createEntityCreatedEvent('domain', { name: 'Second', description: 'Second' }),
      timestamp: t2,
    };

    const content = [event1, event2].map(serializeEvent).join('\n');
    const model = parseNDJSON(content);

    expect(model.lastUpdated).toBe(t2);
  });

});
