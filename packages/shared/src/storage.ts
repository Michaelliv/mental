/**
 * Storage layer for mental model - Event Sourcing
 * Uses NDJSON format in .mental/model.ndjson
 *
 * Event types:
 * - EntityCreated: Full payload when entity first added
 * - EntityUpdated: Field-level changes with operations (set, unset, array_add, array_remove)
 * - EntityDeleted: Removes entity from model
 * - EntityRenamed: Renames entity with optional cascade to references
 */

import type {
  Domain,
  Capability,
  Aspect,
  Decision,
  MentalModel,
  ModelEvent,
  EntityCreatedEvent,
  EntityUpdatedEvent,
  EntityDeletedEvent,
  EntityRenamedEvent,
  FieldOperation,
  EntityType,
} from './types';
import { CURRENT_EVENT_VERSION } from './types';

/**
 * Apply a field operation to a value
 */
function applyFieldOperation(
  currentValue: unknown,
  operation: FieldOperation
): unknown {
  switch (operation.op) {
    case 'set':
      return operation.value;
    case 'unset':
      return undefined;
    case 'array_add': {
      const arr = Array.isArray(currentValue) ? currentValue : [];
      return [...arr, ...operation.values];
    }
    case 'array_remove': {
      const arr = Array.isArray(currentValue) ? currentValue : [];
      const toRemove = new Set(operation.values);
      return arr.filter((v) => !toRemove.has(v));
    }
  }
}

/**
 * Get entity ID from an entity (name for most, id for decisions)
 */
function getEntityId(entityType: EntityType, entity: Domain | Capability | Aspect | Decision): string {
  if (entityType === 'decision') {
    return (entity as Decision).id;
  }
  return (entity as Domain | Capability | Aspect).name;
}

/**
 * Update references in an entity when another entity is renamed
 */
function updateReferencesInEntity(
  entity: Domain | Capability | Aspect | Decision,
  entityType: EntityType,
  renamedEntityType: EntityType,
  oldName: string,
  newName: string
): void {
  const replaceInArray = (arr: string[] | undefined): string[] | undefined => {
    if (!arr) return arr;
    return arr.map((v) => (v === oldName ? newName : v));
  };

  switch (entityType) {
    case 'domain': {
      const domain = entity as Domain;
      if (renamedEntityType === 'domain') {
        domain.references = replaceInArray(domain.references);
      }
      break;
    }
    case 'capability': {
      const capability = entity as Capability;
      if (renamedEntityType === 'domain') {
        capability.operates_on = replaceInArray(capability.operates_on);
      } else if (renamedEntityType === 'capability') {
        capability.composes = replaceInArray(capability.composes);
      }
      break;
    }
    case 'aspect': {
      const aspect = entity as Aspect;
      if (aspect.applies_to) {
        if (renamedEntityType === 'capability') {
          aspect.applies_to.capabilities = replaceInArray(aspect.applies_to.capabilities);
        } else if (renamedEntityType === 'domain') {
          aspect.applies_to.domains = replaceInArray(aspect.applies_to.domains);
        }
      }
      break;
    }
    case 'decision': {
      const decision = entity as Decision;
      if (decision.relates_to) {
        if (renamedEntityType === 'domain') {
          decision.relates_to.domains = replaceInArray(decision.relates_to.domains);
        } else if (renamedEntityType === 'capability') {
          decision.relates_to.capabilities = replaceInArray(decision.relates_to.capabilities);
        } else if (renamedEntityType === 'aspect') {
          decision.relates_to.aspects = replaceInArray(decision.relates_to.aspects);
        }
      }
      break;
    }
  }
}

/**
 * Parse NDJSON event stream into mental model
 * Replays events to reconstruct current state
 *
 * @param content - NDJSON content
 * @param asOfTimestamp - Optional timestamp to reconstruct state at a point in time
 */
export function parseNDJSON(content: string, asOfTimestamp?: string): MentalModel {
  const lines = content.trim().split('\n').filter(Boolean);

  const domains: Record<string, Domain> = {};
  const capabilities: Record<string, Capability> = {};
  const aspects: Record<string, Aspect> = {};
  const decisions: Record<string, Decision> = {};

  let lastUpdated = new Date(0).toISOString();

  for (const line of lines) {
    try {
      const event = JSON.parse(line) as ModelEvent;

      // Skip events after the requested timestamp (for time-travel)
      if (asOfTimestamp && event.timestamp > asOfTimestamp) {
        continue;
      }

      if (event.timestamp > lastUpdated) {
        lastUpdated = event.timestamp;
      }

      switch (event.eventType) {
        case 'EntityCreated': {
          const created = event as EntityCreatedEvent;
          switch (created.entityType) {
            case 'domain': {
              const domain = created.payload as Domain;
              domain.timestamp = created.timestamp;
              domains[created.entityId] = domain;
              break;
            }
            case 'capability': {
              const capability = created.payload as Capability;
              capability.timestamp = created.timestamp;
              capabilities[created.entityId] = capability;
              break;
            }
            case 'aspect': {
              const aspect = created.payload as Aspect;
              aspect.timestamp = created.timestamp;
              aspects[created.entityId] = aspect;
              break;
            }
            case 'decision':
              decisions[created.entityId] = created.payload as Decision;
              break;
          }
          break;
        }

        case 'EntityUpdated': {
          const updated = event as EntityUpdatedEvent;
          let entity: Record<string, unknown> | undefined;

          switch (updated.entityType) {
            case 'domain':
              entity = domains[updated.entityId] as unknown as Record<string, unknown>;
              break;
            case 'capability':
              entity = capabilities[updated.entityId] as unknown as Record<string, unknown>;
              break;
            case 'aspect':
              entity = aspects[updated.entityId] as unknown as Record<string, unknown>;
              break;
            case 'decision':
              entity = decisions[updated.entityId] as unknown as Record<string, unknown>;
              break;
          }

          if (entity) {
            for (const [field, operation] of Object.entries(updated.payload.changes)) {
              const newValue = applyFieldOperation(entity[field], operation);
              if (newValue === undefined) {
                delete entity[field];
              } else {
                entity[field] = newValue;
              }
            }
          }
          break;
        }

        case 'EntityDeleted': {
          const deleted = event as EntityDeletedEvent;
          switch (deleted.entityType) {
            case 'domain':
              delete domains[deleted.entityId];
              break;
            case 'capability':
              delete capabilities[deleted.entityId];
              break;
            case 'aspect':
              delete aspects[deleted.entityId];
              break;
            case 'decision':
              delete decisions[deleted.entityId];
              break;
          }
          break;
        }

        case 'EntityRenamed': {
          const renamed = event as EntityRenamedEvent;
          const { oldName, newName, cascadeReferences } = renamed.payload;

          // Move entity to new key
          switch (renamed.entityType) {
            case 'domain': {
              const domain = domains[oldName];
              if (domain) {
                domain.name = newName;
                domains[newName] = domain;
                delete domains[oldName];
              }
              break;
            }
            case 'capability': {
              const capability = capabilities[oldName];
              if (capability) {
                capability.name = newName;
                capabilities[newName] = capability;
                delete capabilities[oldName];
              }
              break;
            }
            case 'aspect': {
              const aspect = aspects[oldName];
              if (aspect) {
                aspect.name = newName;
                aspects[newName] = aspect;
                delete aspects[oldName];
              }
              break;
            }
            case 'decision': {
              const decision = decisions[oldName];
              if (decision) {
                decision.id = newName;
                decisions[newName] = decision;
                delete decisions[oldName];
              }
              break;
            }
          }

          // Cascade references if requested
          if (cascadeReferences) {
            for (const domain of Object.values(domains)) {
              updateReferencesInEntity(domain, 'domain', renamed.entityType, oldName, newName);
            }
            for (const capability of Object.values(capabilities)) {
              updateReferencesInEntity(capability, 'capability', renamed.entityType, oldName, newName);
            }
            for (const aspect of Object.values(aspects)) {
              updateReferencesInEntity(aspect, 'aspect', renamed.entityType, oldName, newName);
            }
            for (const decision of Object.values(decisions)) {
              updateReferencesInEntity(decision, 'decision', renamed.entityType, oldName, newName);
            }
          }
          break;
        }
      }
    } catch (error) {
      console.error('Failed to parse event:', line, error);
    }
  }

  return {
    domains,
    capabilities,
    aspects,
    decisions,
    version: '0.1.0',
    lastUpdated,
  };
}

/**
 * Serialize an event to NDJSON line
 */
export function serializeEvent(event: ModelEvent): string {
  return JSON.stringify(event);
}

/**
 * Create an EntityCreated event
 */
export function createEntityCreatedEvent(
  entityType: EntityType,
  entity: Domain | Capability | Aspect | Decision
): EntityCreatedEvent {
  return {
    eventType: 'EntityCreated',
    entityType,
    entityId: getEntityId(entityType, entity),
    timestamp: new Date().toISOString(),
    version: CURRENT_EVENT_VERSION,
    payload: entity,
  };
}

/**
 * Create an EntityUpdated event
 */
export function createEntityUpdatedEvent(
  entityType: EntityType,
  entityId: string,
  changes: Record<string, FieldOperation>
): EntityUpdatedEvent {
  return {
    eventType: 'EntityUpdated',
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
    version: CURRENT_EVENT_VERSION,
    payload: { changes },
  };
}

/**
 * Create an EntityDeleted event
 */
export function createEntityDeletedEvent(
  entityType: EntityType,
  entityId: string
): EntityDeletedEvent {
  return {
    eventType: 'EntityDeleted',
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
    version: CURRENT_EVENT_VERSION,
    payload: {},
  };
}

/**
 * Create an EntityRenamed event
 */
export function createEntityRenamedEvent(
  entityType: EntityType,
  oldName: string,
  newName: string,
  cascadeReferences: boolean
): EntityRenamedEvent {
  return {
    eventType: 'EntityRenamed',
    entityType,
    entityId: oldName,
    timestamp: new Date().toISOString(),
    version: CURRENT_EVENT_VERSION,
    payload: {
      oldName,
      newName,
      cascadeReferences,
    },
  };
}

/**
 * Compute array changes between old and new arrays
 */
export function computeArrayChanges(
  oldArr: string[] | undefined,
  newArr: string[] | undefined
): FieldOperation | null {
  const old = oldArr || [];
  const updated = newArr || [];

  // No change
  if (JSON.stringify(old) === JSON.stringify(updated)) {
    return null;
  }

  const oldSet = new Set(old);
  const newSet = new Set(updated);

  const added = updated.filter((x) => !oldSet.has(x));
  const removed = old.filter((x) => !newSet.has(x));

  // Pure addition
  if (added.length > 0 && removed.length === 0) {
    return { op: 'array_add', values: added };
  }

  // Pure removal
  if (removed.length > 0 && added.length === 0) {
    return { op: 'array_remove', values: removed };
  }

  // Mixed changes - replace all
  return { op: 'set', value: updated };
}

/**
 * Compute scalar changes between old and new values
 */
export function computeScalarChange(
  oldValue: unknown,
  newValue: unknown
): FieldOperation | null {
  if (oldValue === newValue) {
    return null;
  }

  if (newValue === undefined || newValue === null) {
    return { op: 'unset' };
  }

  return { op: 'set', value: newValue };
}
