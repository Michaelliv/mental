/**
 * Tests for command functions
 */

import { describe, test, expect } from 'bun:test';
import type { MentalModel } from '../types';
import { createDomainEvent } from './add-domain';
import { createCapabilityEvent } from './add-capability';
import { createAspectEvent } from './add-aspect';
import { createDecisionEvent } from './add-decision';
import { createUpdateDomainEvents, createUpdateCapabilityEvents, createUpdateAspectEvents } from './update';
import { createDeleteEvent } from './delete';

// Helper to create an empty model
function emptyModel(): MentalModel {
  return {
    domains: {},
    capabilities: {},
    aspects: {},
    decisions: {},
    version: '0.1.0',
    lastUpdated: new Date().toISOString(),
  };
}

// Helper to create a model with some entities
function modelWithEntities(): MentalModel {
  return {
    domains: {
      Order: { name: 'Order', description: 'A purchase order', references: ['User'] },
      User: { name: 'User', description: 'A system user' },
    },
    capabilities: {
      Checkout: { name: 'Checkout', description: 'Checkout flow', operates_on: ['Order'] },
    },
    aspects: {
      Auth: { name: 'Auth', description: 'Authentication', applies_to: { capabilities: ['Checkout'] } },
    },
    decisions: {
      'dec-1': { id: 'dec-1', what: 'Use soft deletes', why: 'Audit trail', when: '2024-01-01', relates_to: {} },
    },
    version: '0.1.0',
    lastUpdated: new Date().toISOString(),
  };
}

describe('createDomainEvent', () => {
  test('creates domain event for valid input', () => {
    const result = createDomainEvent(emptyModel(), {
      name: 'Order',
      description: 'A purchase order',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.eventType).toBe('EntityCreated');
      expect(result.event.entityType).toBe('domain');
      expect(result.event.entityId).toBe('Order');
    }
  });

  test('includes references and files', () => {
    const result = createDomainEvent(emptyModel(), {
      name: 'Order',
      description: 'A purchase order',
      references: ['User', 'Product'],
      files: ['src/order.ts'],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const payload = result.event.payload as { references?: string[]; files?: string[] };
      expect(payload.references).toEqual(['User', 'Product']);
      expect(payload.files).toEqual(['src/order.ts']);
    }
  });

  test('rejects empty name', () => {
    const result = createDomainEvent(emptyModel(), {
      name: '',
      description: 'Test',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Name is required');
    }
  });

  test('rejects non-PascalCase name', () => {
    const result = createDomainEvent(emptyModel(), {
      name: 'order',
      description: 'Test',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('PascalCase');
    }
  });

  test('rejects empty description', () => {
    const result = createDomainEvent(emptyModel(), {
      name: 'Order',
      description: '',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Description is required');
    }
  });

  test('rejects duplicate domain', () => {
    const model = modelWithEntities();
    const result = createDomainEvent(model, {
      name: 'Order',
      description: 'Another order',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Domain "Order" already exists');
    }
  });
});

describe('createCapabilityEvent', () => {
  test('creates capability event for valid input', () => {
    const result = createCapabilityEvent(emptyModel(), {
      name: 'Checkout',
      description: 'Checkout flow',
      operates_on: ['Order'],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.eventType).toBe('EntityCreated');
      expect(result.event.entityType).toBe('capability');
      const payload = result.event.payload as { operates_on?: string[] };
      expect(payload.operates_on).toEqual(['Order']);
    }
  });

  test('rejects duplicate capability', () => {
    const model = modelWithEntities();
    const result = createCapabilityEvent(model, {
      name: 'Checkout',
      description: 'Another checkout',
    });

    expect(result.ok).toBe(false);
  });
});

describe('createAspectEvent', () => {
  test('creates aspect event for valid input', () => {
    const result = createAspectEvent(emptyModel(), {
      name: 'Auth',
      description: 'Authentication',
      applies_to: { capabilities: ['Checkout'] },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.eventType).toBe('EntityCreated');
      expect(result.event.entityType).toBe('aspect');
    }
  });

  test('rejects duplicate aspect', () => {
    const model = modelWithEntities();
    const result = createAspectEvent(model, {
      name: 'Auth',
      description: 'Another auth',
    });

    expect(result.ok).toBe(false);
  });
});

describe('createDecisionEvent', () => {
  test('creates decision event for valid input', () => {
    const result = createDecisionEvent(emptyModel(), {
      what: 'Use event sourcing',
      why: 'Audit trail and time-travel',
      relates_to: { domains: ['Order'] },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.eventType).toBe('EntityCreated');
      expect(result.event.entityType).toBe('decision');
      expect(result.event.entityId).toMatch(/^dec-\d+$/);
    }
  });

  test('rejects empty what', () => {
    const result = createDecisionEvent(emptyModel(), {
      what: '',
      why: 'Some reason',
    });

    expect(result.ok).toBe(false);
  });

  test('rejects empty why', () => {
    const result = createDecisionEvent(emptyModel(), {
      what: 'Some decision',
      why: '',
    });

    expect(result.ok).toBe(false);
  });
});

describe('createUpdateDomainEvents', () => {
  test('returns empty array when no changes', () => {
    const model = modelWithEntities();
    const result = createUpdateDomainEvents(model, {
      currentName: 'Order',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.events).toHaveLength(0);
    }
  });

  test('creates rename event', () => {
    const model = modelWithEntities();
    const result = createUpdateDomainEvents(model, {
      currentName: 'Order',
      newName: 'Purchase',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.events).toHaveLength(1);
      expect(result.events[0].eventType).toBe('EntityRenamed');
    }
  });

  test('creates update event for description change', () => {
    const model = modelWithEntities();
    const result = createUpdateDomainEvents(model, {
      currentName: 'Order',
      description: 'Updated description',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.events).toHaveLength(1);
      expect(result.events[0].eventType).toBe('EntityUpdated');
    }
  });

  test('creates both rename and update events', () => {
    const model = modelWithEntities();
    const result = createUpdateDomainEvents(model, {
      currentName: 'Order',
      newName: 'Purchase',
      description: 'Updated description',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.events).toHaveLength(2);
      expect(result.events[0].eventType).toBe('EntityRenamed');
      expect(result.events[1].eventType).toBe('EntityUpdated');
    }
  });

  test('rejects rename to existing name', () => {
    const model = modelWithEntities();
    const result = createUpdateDomainEvents(model, {
      currentName: 'Order',
      newName: 'User', // Already exists
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('already exists');
    }
  });

  test('rejects non-existent domain', () => {
    const model = modelWithEntities();
    const result = createUpdateDomainEvents(model, {
      currentName: 'NonExistent',
      description: 'New description',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('not found');
    }
  });

  test('handles array changes for references', () => {
    const model = modelWithEntities();
    const result = createUpdateDomainEvents(model, {
      currentName: 'Order',
      references: ['User', 'Product'], // Adding Product
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.events).toHaveLength(1);
      const event = result.events[0];
      if (event.eventType === 'EntityUpdated') {
        expect(event.payload.changes.references).toBeDefined();
      }
    }
  });
});

describe('createUpdateCapabilityEvents', () => {
  test('creates update event for operates_on change', () => {
    const model = modelWithEntities();
    const result = createUpdateCapabilityEvents(model, {
      currentName: 'Checkout',
      operates_on: ['Order', 'User'],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.events).toHaveLength(1);
      expect(result.events[0].eventType).toBe('EntityUpdated');
    }
  });
});

describe('createUpdateAspectEvents', () => {
  test('creates update event for applies_to change', () => {
    const model = modelWithEntities();
    const result = createUpdateAspectEvents(model, {
      currentName: 'Auth',
      applies_to: { capabilities: ['Checkout', 'Profile'] },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.events).toHaveLength(1);
      expect(result.events[0].eventType).toBe('EntityUpdated');
    }
  });
});

describe('createDeleteEvent', () => {
  test('creates delete event for existing domain', () => {
    const model = modelWithEntities();
    const result = createDeleteEvent(model, {
      entityType: 'domain',
      name: 'Order',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.eventType).toBe('EntityDeleted');
      expect(result.event.entityType).toBe('domain');
      expect(result.event.entityId).toBe('Order');
    }
  });

  test('creates delete event for existing capability', () => {
    const model = modelWithEntities();
    const result = createDeleteEvent(model, {
      entityType: 'capability',
      name: 'Checkout',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.eventType).toBe('EntityDeleted');
      expect(result.event.entityType).toBe('capability');
    }
  });

  test('creates delete event for existing aspect', () => {
    const model = modelWithEntities();
    const result = createDeleteEvent(model, {
      entityType: 'aspect',
      name: 'Auth',
    });

    expect(result.ok).toBe(true);
  });

  test('creates delete event for existing decision', () => {
    const model = modelWithEntities();
    const result = createDeleteEvent(model, {
      entityType: 'decision',
      name: 'dec-1',
    });

    expect(result.ok).toBe(true);
  });

  test('rejects delete for non-existent entity', () => {
    const model = modelWithEntities();
    const result = createDeleteEvent(model, {
      entityType: 'domain',
      name: 'NonExistent',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('not found');
    }
  });

  test('rejects delete with empty name', () => {
    const model = modelWithEntities();
    const result = createDeleteEvent(model, {
      entityType: 'domain',
      name: '',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Name is required');
    }
  });
});
