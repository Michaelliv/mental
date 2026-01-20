/**
 * Pure command logic for deleting entities
 */

import type { MentalModel, EntityType, EntityDeletedEvent } from '../types';
import { createEntityDeletedEvent } from '../storage';
import { type CommandResult, success, failure } from './types';

export interface DeleteEntityInput {
  entityType: EntityType;
  name: string;
}

/**
 * Validate and create a delete event
 * Pure function: takes model + input, returns Result<Event, Error>
 */
export function createDeleteEvent(
  model: MentalModel,
  input: DeleteEntityInput
): CommandResult<EntityDeletedEvent> {
  const { entityType, name } = input;

  // Validation
  if (!name) {
    return failure('Name is required');
  }

  // Check if entity exists
  let exists = false;
  switch (entityType) {
    case 'domain':
      exists = !!model.domains[name];
      break;
    case 'capability':
      exists = !!model.capabilities[name];
      break;
    case 'aspect':
      exists = !!model.aspects[name];
      break;
    case 'decision':
      exists = !!model.decisions[name];
      break;
  }

  if (!exists) {
    return failure(`${entityType} "${name}" not found`);
  }

  // Create and return event
  const event = createEntityDeletedEvent(entityType, name);
  return success(event);
}
