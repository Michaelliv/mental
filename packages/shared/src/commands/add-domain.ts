/**
 * Pure command logic for adding a domain
 */

import type { MentalModel, Domain, EntityCreatedEvent } from '../types';
import { createEntityCreatedEvent } from '../storage';
import { type CommandResult, success, failure } from './types';

export interface AddDomainInput {
  name: string;
  description: string;
  references?: string[];
  files?: string[];
}

/**
 * Validate and create a domain event
 * Pure function: takes model + input, returns Result<Event, Error>
 */
export function createDomainEvent(
  model: MentalModel,
  input: AddDomainInput
): CommandResult<EntityCreatedEvent> {
  // Validation
  if (!input.name) {
    return failure('Name is required');
  }

  if (!/^[A-Z][a-zA-Z0-9]*$/.test(input.name)) {
    return failure('Name must be PascalCase (e.g., Order, UserProfile)');
  }

  if (!input.description) {
    return failure('Description is required');
  }

  // Check for duplicates
  if (model.domains[input.name]) {
    return failure(`Domain "${input.name}" already exists`);
  }

  // Build domain object
  const domain: Domain = {
    name: input.name,
    description: input.description,
  };

  if (input.references && input.references.length > 0) {
    domain.references = input.references;
  }

  if (input.files && input.files.length > 0) {
    domain.files = input.files;
  }

  // Create and return event
  const event = createEntityCreatedEvent('domain', domain);
  return success(event);
}
