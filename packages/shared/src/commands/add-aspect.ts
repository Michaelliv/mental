/**
 * Pure command logic for adding an aspect
 */

import type { MentalModel, Aspect, EntityCreatedEvent } from '../types';
import { createEntityCreatedEvent } from '../storage';
import { type CommandResult, success, failure } from './types';

export interface AddAspectInput {
  name: string;
  description: string;
  applies_to?: {
    capabilities?: string[];
    domains?: string[];
  };
  files?: string[];
}

/**
 * Validate and create an aspect event
 * Pure function: takes model + input, returns Result<Event, Error>
 */
export function createAspectEvent(
  model: MentalModel,
  input: AddAspectInput
): CommandResult<EntityCreatedEvent> {
  // Validation
  if (!input.name) {
    return failure('Name is required');
  }

  if (!/^[A-Z][a-zA-Z0-9]*$/.test(input.name)) {
    return failure('Name must be PascalCase (e.g., Auth, Logging)');
  }

  if (!input.description) {
    return failure('Description is required');
  }

  // Check for duplicates
  if (model.aspects[input.name]) {
    return failure(`Aspect "${input.name}" already exists`);
  }

  // Build aspect object
  const aspect: Aspect = {
    name: input.name,
    description: input.description,
  };

  if (input.applies_to) {
    const appliesTo: Aspect['applies_to'] = {};
    if (input.applies_to.capabilities && input.applies_to.capabilities.length > 0) {
      appliesTo.capabilities = input.applies_to.capabilities;
    }
    if (input.applies_to.domains && input.applies_to.domains.length > 0) {
      appliesTo.domains = input.applies_to.domains;
    }
    if (Object.keys(appliesTo).length > 0) {
      aspect.applies_to = appliesTo;
    }
  }

  if (input.files && input.files.length > 0) {
    aspect.files = input.files;
  }

  // Create and return event
  const event = createEntityCreatedEvent('aspect', aspect);
  return success(event);
}
