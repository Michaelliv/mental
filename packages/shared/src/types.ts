/**
 * Core mental model types - MVP
 */

export type DecisionStatus = 'active' | 'superseded';

export interface Decision {
  id: string;
  what: string; // The actual decision made
  why: string; // Brief rationale
  context?: string; // Circumstances when decided
  when: string; // ISO timestamp
  status: DecisionStatus; // 'active' | 'superseded'
  superseded_by?: string; // ID of replacement decision
  relates_to: {
    domains?: string[];
    capabilities?: string[];
    aspects?: string[];
  };
  docs?: string[]; // Local paths (relative to project) or URLs
}

export interface Domain {
  name: string;
  description: string;
  references?: string[];
  files?: string[];
  decisions?: string[]; // Decision IDs
  timestamp?: string; // ISO timestamp from event sourcing
}

export interface Capability {
  name: string;
  description: string;
  operates_on?: string[];
  composes?: string[];
  files?: string[];
  decisions?: string[]; // Decision IDs
  timestamp?: string; // ISO timestamp from event sourcing
}

export interface Aspect {
  name: string;
  description: string;
  applies_to?: {
    capabilities?: string[];
    domains?: string[];
  };
  files?: string[];
  decisions?: string[]; // Decision IDs
  timestamp?: string; // ISO timestamp from event sourcing
}

// ============================================================================
// Event Sourcing Types
// ============================================================================

export type EntityType = 'domain' | 'capability' | 'aspect' | 'decision';

/** Current event schema version */
export const CURRENT_EVENT_VERSION = 1;

/** Base event interface */
export interface BaseEvent {
  eventType: string;
  entityType: EntityType;
  entityId: string;
  timestamp: string;
  version: number;
}

/** Field operation for granular updates */
export type FieldOperation =
  | { op: 'set'; value: unknown }
  | { op: 'unset' }
  | { op: 'array_add'; values: string[] }
  | { op: 'array_remove'; values: string[] };

/** Entity created event - full payload when entity first added */
export interface EntityCreatedEvent extends BaseEvent {
  eventType: 'EntityCreated';
  payload: Domain | Capability | Aspect | Decision;
}

/** Entity updated event - field-level changes */
export interface EntityUpdatedEvent extends BaseEvent {
  eventType: 'EntityUpdated';
  payload: {
    changes: Record<string, FieldOperation>;
  };
}

/** Entity deleted event */
export interface EntityDeletedEvent extends BaseEvent {
  eventType: 'EntityDeleted';
  payload: Record<string, never>;
}

/** Entity renamed event - tracks renames with optional cascade */
export interface EntityRenamedEvent extends BaseEvent {
  eventType: 'EntityRenamed';
  payload: {
    oldName: string;
    newName: string;
    cascadeReferences: boolean;
  };
}

export type ModelEvent =
  | EntityCreatedEvent
  | EntityUpdatedEvent
  | EntityDeletedEvent
  | EntityRenamedEvent;

export interface MentalModel {
  domains: Record<string, Domain>;
  capabilities: Record<string, Capability>;
  aspects: Record<string, Aspect>;
  decisions: Record<string, Decision>;
  version: string;
  lastUpdated: string;
}

export interface Entity {
  id: string;
  type: EntityType;
  label: string;
  description: string;
  files?: string[];
  decisions?: string[];
  timestamp?: string; // ISO timestamp
}

export interface Connection {
  from: string;
  to: string;
  type: 'operates_on' | 'applies_to' | 'references' | 'composes';
}

export interface ModelView {
  entities: Entity[];
  connections: Connection[];
}
