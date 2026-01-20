/**
 * Pure command logic for adding a capability
 */

import type { MentalModel, Capability, EntityCreatedEvent } from '../types';
import { createEntityCreatedEvent } from '../storage';
import { type CommandResult, success, failure } from './types';

export interface AddCapabilityInput {
  name: string;
  description: string;
  operates_on?: string[];
  composes?: string[];
  files?: string[];
}

/**
 * Validate and create a capability event
 * Pure function: takes model + input, returns Result<Event, Error>
 */
export function createCapabilityEvent(
  model: MentalModel,
  input: AddCapabilityInput
): CommandResult<EntityCreatedEvent> {
  // Validation
  if (!input.name) {
    return failure('Name is required');
  }

  if (!/^[A-Z][a-zA-Z0-9]*$/.test(input.name)) {
    return failure('Name must be PascalCase (e.g., Checkout, ProcessPayment)');
  }

  if (!input.description) {
    return failure('Description is required');
  }

  // Check for duplicates
  if (model.capabilities[input.name]) {
    return failure(`Capability "${input.name}" already exists`);
  }

  // Build capability object
  const capability: Capability = {
    name: input.name,
    description: input.description,
  };

  if (input.operates_on && input.operates_on.length > 0) {
    capability.operates_on = input.operates_on;
  }

  if (input.composes && input.composes.length > 0) {
    capability.composes = input.composes;
  }

  if (input.files && input.files.length > 0) {
    capability.files = input.files;
  }

  // Create and return event
  const event = createEntityCreatedEvent('capability', capability);
  return success(event);
}
