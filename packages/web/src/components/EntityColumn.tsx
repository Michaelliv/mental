import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { Entity, Connection } from '@mentalmodel/shared';
import { EntityCard } from './EntityCard';
import { sortByName } from '../lib/connections';

interface EntityColumnProps {
  title: string;
  entities: Entity[];
  connections: Connection[];
  hoveredEntityId: string | null;
  directConnections: Set<string>;
  transitiveConnections: Set<string>;
  selectedEntityId: string | null;
  lastVisitedEntityId: string | null;
  onHover: (entityId: string | null) => void;
  onSelect: (entity: Entity) => void;
  color: string;
}

export function EntityColumn({
  title,
  entities,
  connections,
  hoveredEntityId,
  directConnections,
  transitiveConnections,
  selectedEntityId,
  lastVisitedEntityId,
  onHover,
  onSelect,
  color,
}: EntityColumnProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const [offscreenCounts, setOffscreenCounts] = useState({ above: 0, below: 0 });

  // Always sort alphabetically
  const sortedEntities = useMemo(() => {
    return sortByName(entities, 'asc');
  }, [entities]);

  // Get all highlighted entity IDs in this column
  const highlightedEntityIds = useMemo(() => {
    const highlighted = new Set<string>();
    for (const entity of sortedEntities) {
      if (
        directConnections.has(entity.id) ||
        transitiveConnections.has(entity.id) ||
        selectedEntityId === entity.id
      ) {
        highlighted.add(entity.id);
      }
    }
    return highlighted;
  }, [sortedEntities, directConnections, transitiveConnections, selectedEntityId]);

  // Calculate off-screen highlighted items
  const updateOffscreenCounts = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || highlightedEntityIds.size === 0) {
      setOffscreenCounts({ above: 0, below: 0 });
      return;
    }

    const containerRect = container.getBoundingClientRect();
    let above = 0;
    let below = 0;

    for (const entityId of highlightedEntityIds) {
      const cardEl = cardRefsMap.current.get(entityId);
      if (!cardEl) continue;

      const cardRect = cardEl.getBoundingClientRect();

      // Card is above visible area
      if (cardRect.bottom < containerRect.top) {
        above++;
      }
      // Card is below visible area
      else if (cardRect.top > containerRect.bottom) {
        below++;
      }
    }

    setOffscreenCounts({ above, below });
  }, [highlightedEntityIds]);

  // Update counts on scroll and when highlights change
  useEffect(() => {
    updateOffscreenCounts();
  }, [updateOffscreenCounts, directConnections, transitiveConnections, selectedEntityId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', updateOffscreenCounts);
    return () => container.removeEventListener('scroll', updateOffscreenCounts);
  }, [updateOffscreenCounts]);

  // Scroll to first off-screen highlighted item in a direction
  const scrollToOffscreen = useCallback((direction: 'above' | 'below') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    // Find the first highlighted item that's off-screen in the given direction
    for (const entity of direction === 'above' ? [...sortedEntities].reverse() : sortedEntities) {
      if (!highlightedEntityIds.has(entity.id)) continue;

      const cardEl = cardRefsMap.current.get(entity.id);
      if (!cardEl) continue;

      const cardRect = cardEl.getBoundingClientRect();

      if (direction === 'above' && cardRect.bottom < containerRect.top) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (direction === 'below' && cardRect.top > containerRect.bottom) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
  }, [sortedEntities, highlightedEntityIds]);

  // Register card ref
  const registerCardRef = useCallback((entityId: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefsMap.current.set(entityId, el);
    } else {
      cardRefsMap.current.delete(entityId);
    }
  }, []);

  const hasHighlights = highlightedEntityIds.size > 0;

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Column header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <h2
            className="text-base font-bold uppercase tracking-wide"
            style={{ color }}
          >
            {title}
          </h2>
          <span className="text-xs text-cream-28">
            {entities.length}
          </span>
        </div>
      </div>

      {/* Scrollable card list with overlay indicators */}
      <div className="flex-1 relative min-h-0">
        {/* Scroll indicator - above (overlay) */}
        {hasHighlights && offscreenCounts.above > 0 && (
          <button
            onClick={() => scrollToOffscreen('above')}
            aria-label={`Scroll to ${offscreenCounts.above} highlighted items above`}
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center gap-2 py-1.5 transition-opacity bg-gradient-to-b from-warm-elevated to-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cream/30"
            style={{ color }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span className="text-xs font-medium">
              {offscreenCounts.above} above
            </span>
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto px-3 py-3 space-y-2"
        >
        {sortedEntities.map((entity) => (
          <div
            key={entity.id}
            ref={(el) => registerCardRef(entity.id, el)}
          >
            <EntityCard
              entity={entity}
              isHovered={hoveredEntityId === entity.id}
              isDirectConnection={directConnections.has(entity.id)}
              isTransitiveConnection={transitiveConnections.has(entity.id)}
              isSelected={selectedEntityId === entity.id}
              isLastVisited={lastVisitedEntityId === entity.id}
              onHover={onHover}
              onClick={onSelect}
            />
          </div>
        ))}

        {entities.length === 0 && (
          <div className="text-center py-12 text-cream-28">
            <div className="text-2xl mb-2" style={{ color }}>
              {title === 'Domains' ? '□' : title === 'Capabilities' ? '◇' : '○'}
            </div>
            <div className="text-sm text-cream-45">
              No {title.toLowerCase()} yet
            </div>
            <div className="text-xs mt-1">
              {title === 'Domains' && 'These are the nouns of your system'}
              {title === 'Capabilities' && 'These are what your system does'}
              {title === 'Aspects' && 'These emerge as you notice patterns'}
            </div>
          </div>
        )}
        </div>

        {/* Scroll indicator - below (overlay) */}
        {hasHighlights && offscreenCounts.below > 0 && (
          <button
            onClick={() => scrollToOffscreen('below')}
            aria-label={`Scroll to ${offscreenCounts.below} highlighted items below`}
            className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-2 py-1.5 transition-opacity bg-gradient-to-t from-warm-elevated to-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cream/30"
            style={{ color }}
          >
            <span className="text-xs font-medium">
              {offscreenCounts.below} below
            </span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
