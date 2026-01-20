/**
 * Pure command logic for superseding a decision
 */

import type { MentalModel, Decision, ModelEvent } from '../types';
import { createEntityCreatedEvent, createEntityUpdatedEvent } from '../storage';
import { type CommandResultMultiple, successMultiple, failureMultiple } from './types';

export interface SupersedeDecisionInput {
  decisionId: string;
  what: string;
  why: string;
  context?: string;
  relates_to?: {
    domains?: string[];
    capabilities?: string[];
    aspects?: string[];
  };
}

/**
 * Validate and create events to supersede a decision
 * Pure function: takes model + input, returns Result<Event[], Error>
 *
 * Creates two events:
 * 1. EntityCreated for the new decision (status: 'active')
 * 2. EntityUpdated for the old decision (status: 'superseded', superseded_by: newId)
 */
export function createSupersedeDecisionEvents(
  model: MentalModel,
  input: SupersedeDecisionInput
): CommandResultMultiple<ModelEvent> {
  // Validation
  const oldDecision = model.decisions[input.decisionId];
  if (!oldDecision) {
    return failureMultiple(`Decision not found: ${input.decisionId}`);
  }

  if (oldDecision.status === 'superseded') {
    return failureMultiple(
      `Decision ${input.decisionId} is already superseded by ${oldDecision.superseded_by}`
    );
  }

  if (!input.what) {
    return failureMultiple('What decision was made is required');
  }

  if (!input.why) {
    return failureMultiple('Why the decision was made is required');
  }

  // Build relates_to object (use provided or inherit from old decision)
  const relates_to: Decision['relates_to'] = input.relates_to || { ...oldDecision.relates_to };

  // Build new decision object
  const newDecision: Decision = {
    id: `dec-${Date.now()}`,
    what: input.what,
    why: input.why,
    ...(input.context && { context: input.context }),
    when: new Date().toISOString(),
    status: 'active',
    relates_to,
  };

  // Create event for new decision
  const createEvent = createEntityCreatedEvent('decision', newDecision);

  // Create event to update old decision
  const updateEvent = createEntityUpdatedEvent('decision', input.decisionId, {
    status: { op: 'set', value: 'superseded' },
    superseded_by: { op: 'set', value: newDecision.id },
  });

  return successMultiple([createEvent, updateEvent]);
}
