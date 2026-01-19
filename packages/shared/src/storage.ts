/**
 * Storage layer for mental model
 * Uses NDJSON format in .mental/model.ndjson
 *
 * Mutation strategy:
 * - UPDATE: Append new version of entity (latest timestamp wins)
 * - DELETE: Append entity with deleted: true (tombstone)
 * - RENAME: Append old entity with deleted: true, then append new entity
 */

import type { Domain, Capability, Aspect, Decision, MentalModel } from './types';

export type EntityRecord =
  | (Domain & { type: 'domain'; timestamp: string })
  | (Capability & { type: 'capability'; timestamp: string })
  | (Aspect & { type: 'aspect'; timestamp: string })
  | (Decision & { type: 'decision'; timestamp: string });

/**
 * Parse NDJSON file into mental model
 * Latest record wins (by timestamp + name/id)
 */
export function parseNDJSON(content: string): MentalModel {
  const lines = content.trim().split('\n').filter(Boolean);

  const domains: Record<string, Domain> = {};
  const capabilities: Record<string, Capability> = {};
  const aspects: Record<string, Aspect> = {};
  const decisions: Record<string, Decision> = {};

  let lastUpdated = new Date(0).toISOString();

  for (const line of lines) {
    try {
      const record = JSON.parse(line) as EntityRecord;

      if (record.timestamp > lastUpdated) {
        lastUpdated = record.timestamp;
      }

      switch (record.type) {
        case 'domain': {
          const { type, timestamp, ...domain } = record;
          if (domain.deleted) {
            delete domains[domain.name];
          } else {
            domains[domain.name] = domain;
          }
          break;
        }
        case 'capability': {
          const { type, timestamp, ...capability } = record;
          if (capability.deleted) {
            delete capabilities[capability.name];
          } else {
            capabilities[capability.name] = capability;
          }
          break;
        }
        case 'aspect': {
          const { type, timestamp, ...aspect } = record;
          if (aspect.deleted) {
            delete aspects[aspect.name];
          } else {
            aspects[aspect.name] = aspect;
          }
          break;
        }
        case 'decision': {
          const { type, timestamp, ...decision } = record;
          if (decision.deleted) {
            delete decisions[decision.id];
          } else {
            decisions[decision.id] = decision;
          }
          break;
        }
      }
    } catch (error) {
      console.error('Failed to parse line:', line, error);
    }
  }

  return {
    domains,
    capabilities,
    aspects,
    decisions,
    version: '0.1.0',
    lastUpdated,
  };
}

/**
 * Serialize entity to NDJSON line
 */
export function serializeEntity(
  type: 'domain' | 'capability' | 'aspect' | 'decision',
  entity: Domain | Capability | Aspect | Decision
): string {
  const record: EntityRecord = {
    type,
    timestamp: new Date().toISOString(),
    ...entity,
  } as EntityRecord;

  return JSON.stringify(record);
}
