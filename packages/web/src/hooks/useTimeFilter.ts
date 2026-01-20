/**
 * Hook for managing time-based filtering
 *
 * Handles:
 * - Current time state for timeline scrubbing
 * - Filtering entities by timestamp
 */

import { useState, useMemo, useCallback } from 'react';
import type { Entity } from '@mentalmodel/shared';

export interface TimeFilterState {
  /** Current time for filtering (timestamp in milliseconds) */
  currentTime: number;
  /** Set the current time */
  setCurrentTime: (time: number) => void;
  /** Reset to current time (now) */
  resetToNow: () => void;
  /** Filter entities by current time */
  filterByTime: (entities: Entity[]) => Entity[];
}

export function useTimeFilter(initialTime?: number): TimeFilterState {
  const [currentTime, setCurrentTime] = useState<number>(initialTime ?? Date.now());

  const resetToNow = useCallback(() => {
    setCurrentTime(Date.now());
  }, []);

  const filterByTime = useCallback(
    (entities: Entity[]): Entity[] => {
      return entities.filter((entity) => {
        if (!entity.timestamp) return true; // Show entities without timestamps
        return new Date(entity.timestamp).getTime() <= currentTime;
      });
    },
    [currentTime]
  );

  return {
    currentTime,
    setCurrentTime,
    resetToNow,
    filterByTime,
  };
}

/**
 * Hook for filtering and searching entities
 *
 * Combines time filtering with search query filtering
 */
export interface UseEntityFilterOptions {
  /** Search query string */
  searchQuery: string;
  /** Current time for filtering */
  currentTime: number;
}

export interface EntityFilterState {
  /** Filtered entities */
  filteredEntities: Entity[];
}

export function useEntityFilter(
  entities: Entity[],
  options: UseEntityFilterOptions
): EntityFilterState {
  const { searchQuery, currentTime } = options;

  const filteredEntities = useMemo(() => {
    let result = entities;

    // Filter by time (only show entities created before or at currentTime)
    result = result.filter((entity) => {
      if (!entity.timestamp) return true; // Show entities without timestamps
      return new Date(entity.timestamp).getTime() <= currentTime;
    });

    // Filter by search query
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      result = result.filter(
        (entity) =>
          entity.label.toLowerCase().includes(query) ||
          entity.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [entities, searchQuery, currentTime]);

  return { filteredEntities };
}
