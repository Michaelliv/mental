import { useState } from 'react';
import type { Entity } from '@mentalmodel/shared';

interface EntityCardProps {
  entity: Entity;
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

export function EntityCard({
  entity,
  isHovered,
  isDirectConnection,
  isTransitiveConnection,
  isSelected,
  isLastVisited,
  onHover,
  onClick,
}: EntityCardProps) {
  const config = typeConfig[entity.type];

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
      </div>
    </button>
  );
}
