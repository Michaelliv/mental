/**
 * Hook for computing connection highlighting
 *
 * Computes which entities should be highlighted based on their
 * connection to the active entity (direct or transitive).
 */

import { useMemo } from 'react';
import type { Connection } from '@mentalmodel/shared';
import { getTransitiveConnections } from '../lib/connections';

export interface ConnectionHighlighting {
  /** Entities directly connected to the active entity */
  directConnections: Set<string>;
  /** Entities connected via one intermediate entity */
  transitiveConnections: Set<string>;
}

interface UseConnectionHighlightingOptions {
  /** How many levels deep to compute transitive connections (default: 2) */
  depth?: number;
}

export function useConnectionHighlighting(
  activeEntityId: string | null,
  connections: Connection[],
  options: UseConnectionHighlightingOptions = {}
): ConnectionHighlighting {
  const { depth = 2 } = options;

  return useMemo(() => {
    if (!activeEntityId) {
      return {
        directConnections: new Set<string>(),
        transitiveConnections: new Set<string>(),
      };
    }

    const { direct, transitive } = getTransitiveConnections(activeEntityId, connections, depth);

    return {
      directConnections: direct,
      transitiveConnections: transitive,
    };
  }, [activeEntityId, connections, depth]);
}
