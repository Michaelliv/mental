/**
 * Pure command logic for updating entities
 */

import type {
  MentalModel,
  EntityType,
  ModelEvent,
  EntityUpdatedEvent,
  EntityRenamedEvent,
  FieldOperation,
  Domain,
  Capability,
  Aspect,
  Decision,
} from '../types';
import {
  createEntityUpdatedEvent,
  createEntityRenamedEvent,
  computeArrayChanges,
  computeScalarChange,
} from '../storage';
import { type CommandResultMultiple, successMultiple, failureMultiple } from './types';

export interface UpdateDomainInput {
  currentName: string;
  newName?: string;
  description?: string;
  references?: string[];
  files?: string[];
  cascade?: boolean;
}

export interface UpdateCapabilityInput {
  currentName: string;
  newName?: string;
  description?: string;
  operates_on?: string[];
  composes?: string[];
  files?: string[];
  cascade?: boolean;
}

export interface UpdateAspectInput {
  currentName: string;
  newName?: string;
  description?: string;
  applies_to?: {
    capabilities?: string[];
    domains?: string[];
  };
  files?: string[];
  cascade?: boolean;
}

export interface UpdateDecisionInput {
  id: string;
  what?: string;
  why?: string;
  context?: string;
  relates_to?: {
    domains?: string[];
    capabilities?: string[];
    aspects?: string[];
  };
  docs?: string[];
}

/**
 * Create events for updating a domain
 * May return 0, 1, or 2 events (rename and/or update)
 */
export function createUpdateDomainEvents(
  model: MentalModel,
  input: UpdateDomainInput
): CommandResultMultiple<ModelEvent> {
  const { currentName, newName, description, references, files, cascade } = input;

  // Validation
  if (!currentName) {
    return failureMultiple('Current name is required');
  }

  const existing = model.domains[currentName];
  if (!existing) {
    return failureMultiple(`Domain "${currentName}" not found`);
  }

  // Check if target name already exists (for rename)
  if (newName && newName !== currentName && model.domains[newName]) {
    return failureMultiple(`Domain "${newName}" already exists`);
  }

  const events: ModelEvent[] = [];

  // Handle rename first (if name is changing)
  if (newName && newName !== currentName) {
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(newName)) {
      return failureMultiple('New name must be PascalCase');
    }
    const renameEvent = createEntityRenamedEvent('domain', currentName, newName, cascade ?? false);
    events.push(renameEvent);
  }

  // Compute changes for other fields
  const changes: Record<string, FieldOperation> = {};
  const entityId = newName || currentName;

  if (description !== undefined) {
    const change = computeScalarChange(existing.description, description);
    if (change) changes.description = change;
  }

  if (references !== undefined) {
    const change = computeArrayChanges(existing.references, references);
    if (change) changes.references = change;
  }

  if (files !== undefined) {
    const change = computeArrayChanges(existing.files, files);
    if (change) changes.files = change;
  }

  // Emit update event if there are field changes
  if (Object.keys(changes).length > 0) {
    const updateEvent = createEntityUpdatedEvent('domain', entityId, changes);
    events.push(updateEvent);
  }

  return successMultiple(events);
}

/**
 * Create events for updating a capability
 */
export function createUpdateCapabilityEvents(
  model: MentalModel,
  input: UpdateCapabilityInput
): CommandResultMultiple<ModelEvent> {
  const { currentName, newName, description, operates_on, composes, files, cascade } = input;

  // Validation
  if (!currentName) {
    return failureMultiple('Current name is required');
  }

  const existing = model.capabilities[currentName];
  if (!existing) {
    return failureMultiple(`Capability "${currentName}" not found`);
  }

  // Check if target name already exists (for rename)
  if (newName && newName !== currentName && model.capabilities[newName]) {
    return failureMultiple(`Capability "${newName}" already exists`);
  }

  const events: ModelEvent[] = [];

  // Handle rename first (if name is changing)
  if (newName && newName !== currentName) {
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(newName)) {
      return failureMultiple('New name must be PascalCase');
    }
    const renameEvent = createEntityRenamedEvent('capability', currentName, newName, cascade ?? false);
    events.push(renameEvent);
  }

  // Compute changes for other fields
  const changes: Record<string, FieldOperation> = {};
  const entityId = newName || currentName;

  if (description !== undefined) {
    const change = computeScalarChange(existing.description, description);
    if (change) changes.description = change;
  }

  if (operates_on !== undefined) {
    const change = computeArrayChanges(existing.operates_on, operates_on);
    if (change) changes.operates_on = change;
  }

  if (composes !== undefined) {
    const change = computeArrayChanges(existing.composes, composes);
    if (change) changes.composes = change;
  }

  if (files !== undefined) {
    const change = computeArrayChanges(existing.files, files);
    if (change) changes.files = change;
  }

  // Emit update event if there are field changes
  if (Object.keys(changes).length > 0) {
    const updateEvent = createEntityUpdatedEvent('capability', entityId, changes);
    events.push(updateEvent);
  }

  return successMultiple(events);
}

/**
 * Create events for updating an aspect
 */
export function createUpdateAspectEvents(
  model: MentalModel,
  input: UpdateAspectInput
): CommandResultMultiple<ModelEvent> {
  const { currentName, newName, description, applies_to, files, cascade } = input;

  // Validation
  if (!currentName) {
    return failureMultiple('Current name is required');
  }

  const existing = model.aspects[currentName];
  if (!existing) {
    return failureMultiple(`Aspect "${currentName}" not found`);
  }

  // Check if target name already exists (for rename)
  if (newName && newName !== currentName && model.aspects[newName]) {
    return failureMultiple(`Aspect "${newName}" already exists`);
  }

  const events: ModelEvent[] = [];

  // Handle rename first (if name is changing)
  if (newName && newName !== currentName) {
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(newName)) {
      return failureMultiple('New name must be PascalCase');
    }
    const renameEvent = createEntityRenamedEvent('aspect', currentName, newName, cascade ?? false);
    events.push(renameEvent);
  }

  // Compute changes for other fields
  const changes: Record<string, FieldOperation> = {};
  const entityId = newName || currentName;

  if (description !== undefined) {
    const change = computeScalarChange(existing.description, description);
    if (change) changes.description = change;
  }

  if (applies_to !== undefined) {
    // For nested objects, we use set operation
    const oldAppliesTo = existing.applies_to;
    if (JSON.stringify(oldAppliesTo) !== JSON.stringify(applies_to)) {
      changes.applies_to = { op: 'set', value: applies_to };
    }
  }

  if (files !== undefined) {
    const change = computeArrayChanges(existing.files, files);
    if (change) changes.files = change;
  }

  // Emit update event if there are field changes
  if (Object.keys(changes).length > 0) {
    const updateEvent = createEntityUpdatedEvent('aspect', entityId, changes);
    events.push(updateEvent);
  }

  return successMultiple(events);
}

/**
 * Create events for updating a decision
 */
export function createUpdateDecisionEvents(
  model: MentalModel,
  input: UpdateDecisionInput
): CommandResultMultiple<ModelEvent> {
  const { id, what, why, context, relates_to, docs } = input;

  // Validation
  if (!id) {
    return failureMultiple('Decision ID is required');
  }

  const existing = model.decisions[id];
  if (!existing) {
    return failureMultiple(`Decision "${id}" not found`);
  }

  // Decisions cannot be renamed (they use generated IDs)
  // and status changes are handled by supersede command

  const events: ModelEvent[] = [];
  const changes: Record<string, FieldOperation> = {};

  if (what !== undefined) {
    const change = computeScalarChange(existing.what, what);
    if (change) changes.what = change;
  }

  if (why !== undefined) {
    const change = computeScalarChange(existing.why, why);
    if (change) changes.why = change;
  }

  if (context !== undefined) {
    const change = computeScalarChange(existing.context, context);
    if (change) changes.context = change;
  }

  if (relates_to !== undefined) {
    // For nested objects, we use set operation
    const oldRelatesTo = existing.relates_to;
    if (JSON.stringify(oldRelatesTo) !== JSON.stringify(relates_to)) {
      changes.relates_to = { op: 'set', value: relates_to };
    }
  }

  if (docs !== undefined) {
    const change = computeArrayChanges(existing.docs, docs);
    if (change) changes.docs = change;
  }

  // Emit update event if there are field changes
  if (Object.keys(changes).length > 0) {
    const updateEvent = createEntityUpdatedEvent('decision', id, changes);
    events.push(updateEvent);
  }

  return successMultiple(events);
}
