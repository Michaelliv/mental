import type { Entity, Connection } from '@mentalmodel/shared';
import { EntityCard } from './EntityCard';
import { sortByName } from '../lib/connections';
import { useMemo } from 'react';

interface DomainRegionProps {
  domain: Entity | null; // null for "Uncategorized" region
  capabilities: Entity[];
  connections: Connection[];
  hoveredEntityId: string | null;
  directConnections: Set<string>;
  transitiveConnections: Set<string>;
  selectedEntityId: string | null;
  lastVisitedEntityId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (entity: Entity) => void;
}

export function DomainRegion({
  domain,
  capabilities,
  connections,
  hoveredEntityId,
  directConnections,
  transitiveConnections,
  selectedEntityId,
  lastVisitedEntityId,
  onHover,
  onSelect,
}: DomainRegionProps) {
  // Sort capabilities alphabetically
  const sortedCapabilities = useMemo(() => {
    return sortByName(capabilities, 'asc');
  }, [capabilities]);

  // Check if domain itself is highlighted
  const isDomainHighlighted = domain && (
    hoveredEntityId === domain.id ||
    selectedEntityId === domain.id ||
    directConnections.has(domain.id) ||
    transitiveConnections.has(domain.id)
  );

  const regionLabel = domain ? domain.label : 'Uncategorized';
  const regionDescription = domain?.description;

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all duration-150 ${
        isDomainHighlighted
          ? 'border-domain/60 bg-warm-surface/70 shadow-lg shadow-domain/10'
          : 'border-domain/30 bg-warm-surface/50'
      }`}
    >
      {/* Region header */}
      <button
        onClick={() => domain && onSelect(domain)}
        onMouseEnter={() => domain && onHover(domain.id)}
        onMouseLeave={() => onHover(null)}
        disabled={!domain}
        className={`w-full text-left mb-3 pb-2 border-b border-border-subtle ${
          domain ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`text-lg font-mono ${isDomainHighlighted ? 'text-domain brightness-125' : 'text-domain'}`}>
            □
          </span>
          <h3 className={`font-semibold transition-colors ${
            isDomainHighlighted ? 'text-cream' : 'text-cream-75'
          }`}>
            {regionLabel}
          </h3>
          <span className="text-xs text-cream-28 ml-auto">
            {capabilities.length} {capabilities.length === 1 ? 'capability' : 'capabilities'}
          </span>
        </div>
        {regionDescription && (
          <p className="text-xs text-cream-45 mt-1 line-clamp-1">
            {regionDescription}
          </p>
        )}
      </button>

      {/* Capabilities within this region */}
      {sortedCapabilities.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sortedCapabilities.map((capability) => (
            <div key={capability.id} className="w-full sm:w-[calc(50%-0.25rem)]">
              <EntityCard
                entity={capability}
                connections={connections}
                isHovered={hoveredEntityId === capability.id}
                isDirectConnection={directConnections.has(capability.id)}
                isTransitiveConnection={transitiveConnections.has(capability.id)}
                isSelected={selectedEntityId === capability.id}
                isLastVisited={lastVisitedEntityId === capability.id}
                onHover={onHover}
                onClick={onSelect}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-cream-28">
          <div className="text-lg text-capability mb-1">◇</div>
          <div className="text-xs">No capabilities in this domain</div>
        </div>
      )}
    </div>
  );
}
