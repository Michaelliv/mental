/**
 * Core mental model types - MVP
 */

export interface Decision {
  id: string;
  what: string; // The actual decision made
  why: string; // Brief rationale
  when: string; // ISO timestamp
  relates_to: {
    domains?: string[];
    capabilities?: string[];
    aspects?: string[];
  };
  deleted?: boolean; // Tombstone for deletion
}

export interface Domain {
  name: string;
  description: string;
  references?: string[];
  files?: string[];
  decisions?: string[]; // Decision IDs
  deleted?: boolean; // Tombstone for deletion
}

export interface Capability {
  name: string;
  description: string;
  operates_on?: string[];
  composes?: string[];
  files?: string[];
  decisions?: string[]; // Decision IDs
  deleted?: boolean; // Tombstone for deletion
}

export interface Aspect {
  name: string;
  description: string;
  applies_to?: {
    capabilities?: string[];
    domains?: string[];
  };
  files?: string[];
  decisions?: string[]; // Decision IDs
  deleted?: boolean; // Tombstone for deletion
}

export interface MentalModel {
  domains: Record<string, Domain>;
  capabilities: Record<string, Capability>;
  aspects: Record<string, Aspect>;
  decisions: Record<string, Decision>;
  version: string;
  lastUpdated: string;
}

export type EntityType = 'domain' | 'capability' | 'aspect';

export interface GraphNode {
  id: string;
  type: EntityType;
  label: string;
  description: string;
  files?: string[];
  decisions?: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'operates_on' | 'applies_to' | 'references' | 'composes';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
