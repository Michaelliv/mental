/**
 * File system operations for mental model storage
 *
 * Provides a Storage interface that can be injected into commands,
 * enabling testing without filesystem access.
 */

import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, appendFileSync } from 'fs';
import {
  parseNDJSON,
  serializeEvent,
  createEntityCreatedEvent,
  createEntityDeletedEvent,
  createEntityRenamedEvent,
  createEntityUpdatedEvent,
  computeArrayChanges,
  computeScalarChange,
} from '@mentalmodel/shared';
import type {
  MentalModel,
  ModelEvent,
  EntityType,
  FieldOperation,
} from '@mentalmodel/shared';

const MENTAL_DIR = '.mental';
const MODEL_FILE = 'model.ndjson';

// ============================================================================
// Storage Interface
// ============================================================================

/**
 * Storage interface for reading/writing mental model data
 * This abstraction allows commands to be tested without filesystem access
 */
export interface Storage {
  /** Read the current mental model state */
  readModel(): MentalModel;
  /** Append an event to the event log */
  appendEvent(event: ModelEvent): void;
  /** Append multiple events to the event log */
  appendEvents(events: ModelEvent[]): void;
  /** Check if the model file exists/is initialized */
  isInitialized(): boolean;
}

// ============================================================================
// File System Storage Implementation
// ============================================================================

/**
 * Get path to mental model directory
 */
export function getMentalDir(cwd: string = process.cwd()): string {
  return join(cwd, MENTAL_DIR);
}

/**
 * Get path to model file
 */
export function getModelPath(cwd: string = process.cwd()): string {
  return join(getMentalDir(cwd), MODEL_FILE);
}

/**
 * Initialize .mental directory if it doesn't exist
 */
export function initMentalDir(cwd: string = process.cwd()): void {
  const mentalDir = getMentalDir(cwd);
  if (!existsSync(mentalDir)) {
    mkdirSync(mentalDir, { recursive: true });
  }

  const modelPath = getModelPath(cwd);
  if (!existsSync(modelPath)) {
    // Create empty file
    appendFileSync(modelPath, '');
  }
}

/**
 * Create a file system storage implementation
 */
export function createFileStorage(cwd: string = process.cwd()): Storage {
  return {
    readModel(): MentalModel {
      const modelPath = getModelPath(cwd);

      if (!existsSync(modelPath)) {
        return {
          domains: {},
          capabilities: {},
          aspects: {},
          decisions: {},
          version: '0.1.0',
          lastUpdated: new Date().toISOString(),
        };
      }

      const content = readFileSync(modelPath, 'utf-8');
      return parseNDJSON(content);
    },

    appendEvent(event: ModelEvent): void {
      initMentalDir(cwd);
      const modelPath = getModelPath(cwd);
      const line = serializeEvent(event);
      appendFileSync(modelPath, line + '\n');
    },

    appendEvents(events: ModelEvent[]): void {
      if (events.length === 0) return;
      initMentalDir(cwd);
      const modelPath = getModelPath(cwd);
      const lines = events.map(serializeEvent).join('\n');
      appendFileSync(modelPath, lines + '\n');
    },

    isInitialized(): boolean {
      return existsSync(getModelPath(cwd));
    },
  };
}

// Default file storage instance
const defaultStorage = createFileStorage();

// ============================================================================
// Memory Storage Implementation (for testing)
// ============================================================================

/**
 * Create an in-memory storage implementation for testing
 * @param initialEvents - Optional initial events to seed the storage
 */
export function createMemoryStorage(initialEvents: ModelEvent[] = []): Storage & { events: ModelEvent[] } {
  const events = [...initialEvents];

  return {
    events,

    readModel(): MentalModel {
      if (events.length === 0) {
        return {
          domains: {},
          capabilities: {},
          aspects: {},
          decisions: {},
          version: '0.1.0',
          lastUpdated: new Date().toISOString(),
        };
      }
      const content = events.map(serializeEvent).join('\n');
      return parseNDJSON(content);
    },

    appendEvent(event: ModelEvent): void {
      events.push(event);
    },

    appendEvents(newEvents: ModelEvent[]): void {
      events.push(...newEvents);
    },

    isInitialized(): boolean {
      return true;
    },
  };
}

// Re-export event creators and helpers for convenience
export {
  createEntityCreatedEvent,
  createEntityDeletedEvent,
  createEntityRenamedEvent,
  createEntityUpdatedEvent,
  computeArrayChanges,
  computeScalarChange,
};
export type { EntityType, FieldOperation };
