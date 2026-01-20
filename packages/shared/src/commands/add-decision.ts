/**
 * Pure command logic for adding a decision
 */

import type { MentalModel, Decision, EntityCreatedEvent } from '../types';
import { createEntityCreatedEvent } from '../storage';
import { type CommandResult, success, failure } from './types';

export interface AddDecisionInput {
  what: string;
  why: string;
  context?: string;
  relates_to?: {
    domains?: string[];
    capabilities?: string[];
    aspects?: string[];
  };
  docs?: string[];
}

/**
 * Validate and create a decision event
 * Pure function: takes model + input, returns Result<Event, Error>
 *
 * Note: Decisions use auto-generated IDs, so duplicates aren't possible
 */
export function createDecisionEvent(
  model: MentalModel,
  input: AddDecisionInput
): CommandResult<EntityCreatedEvent> {
  // Validation
  if (!input.what) {
    return failure('What decision was made is required');
  }

  if (!input.why) {
    return failure('Why the decision was made is required');
  }

  // Build relates_to object
  const relates_to: Decision['relates_to'] = {};
  if (input.relates_to) {
    if (input.relates_to.domains && input.relates_to.domains.length > 0) {
      relates_to.domains = input.relates_to.domains;
    }
    if (input.relates_to.capabilities && input.relates_to.capabilities.length > 0) {
      relates_to.capabilities = input.relates_to.capabilities;
    }
    if (input.relates_to.aspects && input.relates_to.aspects.length > 0) {
      relates_to.aspects = input.relates_to.aspects;
    }
  }

  // Build decision object with auto-generated ID
  const decision: Decision = {
    id: `dec-${Date.now()}`,
    what: input.what,
    why: input.why,
    ...(input.context && { context: input.context }),
    when: new Date().toISOString(),
    status: 'active',
    relates_to,
    ...(input.docs && input.docs.length > 0 && { docs: input.docs }),
  };

  // Create and return event
  const event = createEntityCreatedEvent('decision', decision);
  return success(event);
}
