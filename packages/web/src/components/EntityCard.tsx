import { useState, useMemo } from 'react';
import type { Entity, Connection } from '@mentalmodel/shared';

interface EntityCardProps {
  entity: Entity;
  connections: Connection[];
  isHovered: boolean;
  isDirectConnection: boolean;
  isTransitiveConnection: boolean;
  isSelected: boolean;
  isLastVisited: boolean;
  onHover: (entityId: string | null) => void;
  onClick: (entity: Entity) => void;
}

const typeConfig = {
  domain: {
    glyph: '□',
    colorClass: 'text-domain',
    label: 'Domain',
  },
  capability: {
    glyph: '◇',
    colorClass: 'text-capability',
    label: 'Capability',
  },
  aspect: {
    glyph: '○',
    colorClass: 'text-aspect',
    label: 'Aspect',
  },
};

// Connection type labels per entity type
const connectionLabels: Record<Entity['type'], string> = {
  domain: 'refs',
  capability: 'on',
  aspect: 'for',
};

export function EntityCard({
  entity,
  connections,
  isHovered,
  isDirectConnection,
  isTransitiveConnection,
  isSelected,
  isLastVisited,
  onHover,
  onClick,
}: EntityCardProps) {
  const config = typeConfig[entity.type];

  // Compute outgoing connections for this entity
  const outgoingConnections = useMemo(() => {
    return connections
      .filter((c) => c.from === entity.id)
      .map((c) => c.to);
  }, [connections, entity.id]);

  // Counts for metadata
  const fileCount = entity.files?.length ?? 0;
  const decisionCount = entity.decisions?.length ?? 0;

  // Track press state for physical feedback
  const [isPressed, setIsPressed] = useState(false);

  // Determine highlight level
  const highlightLevel = isHovered || isSelected ? 3
    : isDirectConnection ? 2
    : isTransitiveConnection ? 1
    : 0;

  // Build class names based on state
  const cardClasses = [
    'p-3 rounded-lg border-2 transition-all duration-150',
    highlightLevel === 3 && 'border-current bg-warm-surface shadow-lg shadow-current/20',
    highlightLevel === 2 && 'border-current/50 bg-warm-elevated shadow-md shadow-current/10',
    highlightLevel === 1 && 'border-border-default bg-warm-elevated',
    highlightLevel === 0 && 'border-border-subtle bg-warm-elevated',
    isPressed && 'shadow-inner',
  ].filter(Boolean).join(' ');

  const glyphClasses = [
    'text-xl font-mono inline-block transition-all duration-200',
    config.colorClass,
    highlightLevel >= 2 && 'brightness-125 scale-110',
    isDirectConnection && !isHovered && !isSelected && 'rotate-[5deg] scale-105',
    isTransitiveConnection && !isDirectConnection && 'rotate-[3deg] scale-[1.02]',
  ].filter(Boolean).join(' ');

  return (
    <button
      onMouseEnter={() => onHover(entity.id)}
      onMouseLeave={() => { onHover(null); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={() => onClick(entity)}
      data-type={entity.type}
      className={`w-full text-left relative transition-transform duration-100 ${
        isPressed ? 'scale-[0.98]' : highlightLevel >= 2 ? 'scale-[1.02]' : 'scale-100'
      } ${config.colorClass}`}
    >
      {/* "You were here" indicator */}
      {isLastVisited && (
        <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded text-[10px] font-medium z-10 bg-warm-elevated border border-border-default text-cream-75 animate-fade-out">
          you were here
        </div>
      )}

      <div className={cardClasses}>
        {/* Header with glyph and name */}
        <div className="flex items-center gap-2 mb-1">
          <span className={glyphClasses}>
            {config.glyph}
          </span>
          <span className={`font-medium truncate transition-colors duration-150 ${
            highlightLevel >= 2 ? 'text-cream' : 'text-cream-75'
          }`}>
            {entity.label}
          </span>
        </div>

        {/* Description */}
        <p className={`text-xs leading-relaxed line-clamp-2 transition-colors duration-150 ${
          highlightLevel >= 2 ? 'text-cream-60' : 'text-cream-45'
        }`}>
          {entity.description}
        </p>

        {/* Connection preview */}
        {outgoingConnections.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-cream-60">
            <span className="font-medium">{connectionLabels[entity.type]}</span>
            <span className="truncate text-cream-45">
              {outgoingConnections.slice(0, 3).join(', ')}
              {outgoingConnections.length > 3 && (
                <span className="text-cream-28"> +{outgoingConnections.length - 3}</span>
              )}
            </span>
          </div>
        )}

        {/* Micro-metadata */}
        {(fileCount > 0 || decisionCount > 0) && (
          <div className="mt-1.5 flex items-center gap-3 text-[10px] text-cream-45">
            {fileCount > 0 && (
              <span className="flex items-center gap-1" title={`${fileCount} file${fileCount !== 1 ? 's' : ''}`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {fileCount}
              </span>
            )}
            {decisionCount > 0 && (
              <span className="flex items-center gap-1" title={`${decisionCount} decision${decisionCount !== 1 ? 's' : ''}`}>
                <span>⚡</span>
                {decisionCount}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
