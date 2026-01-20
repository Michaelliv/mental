/**
 * Command functions - pure business logic for CLI operations
 *
 * Each command function takes a model and input, and returns a Result<Event, Error>.
 * This allows the CLI to remain a thin wrapper around pure, testable logic.
 */

// Types
export * from './types';

// Add commands
export { createDomainEvent, type AddDomainInput } from './add-domain';
export { createCapabilityEvent, type AddCapabilityInput } from './add-capability';
export { createAspectEvent, type AddAspectInput } from './add-aspect';
export { createDecisionEvent, type AddDecisionInput } from './add-decision';

// Update commands
export {
  createUpdateDomainEvents,
  createUpdateCapabilityEvents,
  createUpdateAspectEvents,
  type UpdateDomainInput,
  type UpdateCapabilityInput,
  type UpdateAspectInput,
} from './update';

// Delete command
export { createDeleteEvent, type DeleteEntityInput } from './delete';

// Supersede command
export { createSupersedeDecisionEvents, type SupersedeDecisionInput } from './supersede-decision';
