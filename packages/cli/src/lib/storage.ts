/**
 * File system operations for mental model storage
 */

import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, appendFileSync } from 'fs';
import { parseNDJSON, serializeEntity, type EntityRecord } from '@mentalmodel/shared';
import type { MentalModel, Domain, Capability, Aspect, Decision } from '@mentalmodel/shared';

const MENTAL_DIR = '.mental';
const MODEL_FILE = 'model.ndjson';

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
 * Read mental model from disk
 */
export function readModel(cwd: string = process.cwd()): MentalModel {
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
}

/**
 * Append entity to model file
 */
export function appendEntity(
  type: 'domain' | 'capability' | 'aspect' | 'decision',
  entity: Domain | Capability | Aspect | Decision,
  cwd: string = process.cwd()
): void {
  initMentalDir(cwd);
  const modelPath = getModelPath(cwd);
  const line = serializeEntity(type, entity);
  appendFileSync(modelPath, line + '\n');
}

/**
 * Check if mental model is initialized
 */
export function isInitialized(cwd: string = process.cwd()): boolean {
  return existsSync(getModelPath(cwd));
}
