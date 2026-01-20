/**
 * Common types for command functions
 */

import type { EntityCreatedEvent, EntityUpdatedEvent, EntityDeletedEvent, EntityRenamedEvent } from '../types';

/**
 * Result type for command functions
 * Either returns a successful result with an event, or an error message
 */
export type CommandResult<T> =
  | { ok: true; event: T }
  | { ok: false; error: string };

/**
 * Result type for commands that may produce multiple events (e.g., rename with cascade)
 */
export type CommandResultMultiple<T> =
  | { ok: true; events: T[] }
  | { ok: false; error: string };

/**
 * Helper to create a success result
 */
export function success<T>(event: T): CommandResult<T> {
  return { ok: true, event };
}

/**
 * Helper to create a success result with multiple events
 */
export function successMultiple<T>(events: T[]): CommandResultMultiple<T> {
  return { ok: true, events };
}

/**
 * Helper to create an error result
 */
export function failure<T>(error: string): CommandResult<T> {
  return { ok: false, error };
}

/**
 * Helper to create an error result for multiple events
 */
export function failureMultiple<T>(error: string): CommandResultMultiple<T> {
  return { ok: false, error };
}
