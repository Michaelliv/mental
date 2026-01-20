/**
 * Hook for managing entity selection state
 *
 * Handles:
 * - Selected entity tracking
 * - Hovered entity tracking
 * - Last visited entity (with localStorage persistence)
 */

import { useState, useCallback, useEffect } from 'react';
import type { Entity } from '@mentalmodel/shared';

const LAST_SELECTED_KEY = 'mental-model-last-selected';

interface UseEntitySelectionOptions {
  /** Auto-clear "last visited" highlight after this many milliseconds */
  lastVisitedTimeout?: number;
}

export interface EntitySelectionState {
  /** Currently selected entity (stays selected until explicitly deselected) */
  selectedEntity: Entity | null;
  /** Entity being hovered over */
  hoveredEntityId: string | null;
  /** ID of entity that was selected in previous session (for "you were here" indicator) */
  lastVisitedEntityId: string | null;
  /** The currently active entity (selected takes precedence over hovered) */
  activeEntityId: string | null;
  /** Select/deselect an entity */
  handleSelect: (entity: Entity) => void;
  /** Set hover state */
  handleHover: (entityId: string | null) => void;
  /** Clear selection */
  clearSelection: () => void;
}

export function useEntitySelection(
  entities: Entity[],
  options: UseEntitySelectionOptions = {}
): EntitySelectionState {
  const { lastVisitedTimeout = 3000 } = options;

  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  const [lastVisitedEntityId, setLastVisitedEntityId] = useState<string | null>(null);

  // On mount, check if there's a last visited entity and briefly highlight it
  useEffect(() => {
    const lastSelected = localStorage.getItem(LAST_SELECTED_KEY);
    if (lastSelected && entities.some((e) => e.id === lastSelected)) {
      setLastVisitedEntityId(lastSelected);
      // Clear the "you were here" indicator after a few seconds
      const timer = setTimeout(() => setLastVisitedEntityId(null), lastVisitedTimeout);
      return () => clearTimeout(timer);
    }
  }, [entities, lastVisitedTimeout]);

  // Save selected entity to localStorage when it changes
  useEffect(() => {
    if (selectedEntity) {
      localStorage.setItem(LAST_SELECTED_KEY, selectedEntity.id);
    }
  }, [selectedEntity]);

  const handleSelect = useCallback((entity: Entity) => {
    setSelectedEntity((prev) => (prev?.id === entity.id ? null : entity));
  }, []);

  const handleHover = useCallback((entityId: string | null) => {
    setHoveredEntityId(entityId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedEntity(null);
  }, []);

  // Use selected entity as primary, hovered as fallback (Munzner's recommendation)
  const activeEntityId = selectedEntity?.id ?? hoveredEntityId;

  return {
    selectedEntity,
    hoveredEntityId,
    lastVisitedEntityId,
    activeEntityId,
    handleSelect,
    handleHover,
    clearSelection,
  };
}
