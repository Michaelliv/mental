import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { useScrollAnimation } from '../hooks';

interface EntityData {
  id: string;
  label: string;
  type: 'domain' | 'capability' | 'aspect';
  description: string;
  connections?: string[];
  files?: number;
  decisions?: number;
}

const DOMAINS: EntityData[] = [
  { id: 'user', label: 'User', type: 'domain', description: 'User accounts and profiles', files: 3 },
  { id: 'order', label: 'Order', type: 'domain', description: 'Purchase orders and line items', files: 5, decisions: 2 },
  { id: 'payment', label: 'Payment', type: 'domain', description: 'Payment processing and transactions', files: 2 },
];

const CAPABILITIES: EntityData[] = [
  { id: 'checkout', label: 'Checkout', type: 'capability', description: 'Process customer checkout flow', connections: ['user', 'order'], files: 2, decisions: 1 },
  { id: 'process-payment', label: 'ProcessPayment', type: 'capability', description: 'Handle payment transactions', connections: ['order', 'payment'], files: 3 },
  { id: 'send-notification', label: 'SendNotification', type: 'capability', description: 'Dispatch emails and push notifications', connections: ['user'], files: 1 },
];

const ASPECTS: EntityData[] = [
  { id: 'auth', label: 'Auth', type: 'aspect', description: 'Authentication and authorization', connections: ['checkout', 'process-payment'], files: 4, decisions: 1 },
  { id: 'validation', label: 'Validation', type: 'aspect', description: 'Input validation rules', connections: ['checkout'] },
  { id: 'logging', label: 'Logging', type: 'aspect', description: 'Audit trails and debugging', connections: ['process-payment'], files: 1 },
];

const CAPABILITIES_BY_DOMAIN: Record<string, EntityData[]> = {
  user: [CAPABILITIES[0], CAPABILITIES[2]],
  order: [CAPABILITIES[0], CAPABILITIES[1]],
  payment: [CAPABILITIES[1]],
};

const typeConfig = {
  domain: { glyph: '□', colorClass: 'text-domain', color: 'var(--color-domain)' },
  capability: { glyph: '◇', colorClass: 'text-capability', color: 'var(--color-capability)' },
  aspect: { glyph: '○', colorClass: 'text-aspect', color: 'var(--color-aspect)' },
};

const connectionLabels: Record<string, string> = {
  domain: 'refs',
  capability: 'on',
  aspect: 'for',
};

// EntityCard - matches packages/web exactly
function EntityCard({
  entity,
  isHovered,
  isDirectConnection,
  onHover,
  fullHeight = false,
}: {
  entity: EntityData;
  isHovered: boolean;
  isDirectConnection: boolean;
  onHover: (id: string | null) => void;
  fullHeight?: boolean;
}) {
  const config = typeConfig[entity.type];
  const [isPressed, setIsPressed] = useState(false);

  const highlightLevel = isHovered ? 3 : isDirectConnection ? 2 : 0;

  const cardClasses = [
    'p-3 rounded-lg border-2 transition-all duration-150',
    fullHeight && 'h-full',
    highlightLevel === 3 && 'border-current bg-warm-surface shadow-lg shadow-current/20',
    highlightLevel === 2 && 'border-current/50 bg-warm-elevated shadow-md shadow-current/10',
    highlightLevel === 0 && 'border-border-subtle bg-warm-elevated',
  ].filter(Boolean).join(' ');

  const glyphClasses = [
    'text-xl font-mono inline-block transition-all duration-200',
    config.colorClass,
    highlightLevel >= 2 && 'brightness-125 scale-110',
  ].filter(Boolean).join(' ');

  return (
    <button
      onMouseEnter={() => onHover(entity.id)}
      onMouseLeave={() => { onHover(null); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={`entity-card w-full text-left relative transition-transform duration-100 ${
        fullHeight ? 'h-full' : ''
      } ${
        isPressed ? 'scale-[0.98]' : highlightLevel >= 2 ? 'scale-[1.02]' : 'scale-100'
      } ${config.colorClass}`}
    >
      <div className={cardClasses}>
        <div className="flex items-center gap-2 mb-1">
          <span className={glyphClasses}>{config.glyph}</span>
          <span className={`font-medium truncate transition-colors duration-150 ${
            highlightLevel >= 2 ? 'text-cream' : 'text-cream-75'
          }`}>
            {entity.label}
          </span>
        </div>

        <p className={`text-xs leading-relaxed line-clamp-2 transition-colors duration-150 ${
          highlightLevel >= 2 ? 'text-cream-60' : 'text-cream-45'
        }`}>
          {entity.description}
        </p>

        {entity.connections && entity.connections.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-cream-60">
            <span className="font-medium">{connectionLabels[entity.type]}</span>
            <span className="truncate text-cream-45">
              {entity.connections.slice(0, 3).join(', ')}
            </span>
          </div>
        )}

        {(entity.files || entity.decisions) && (
          <div className="mt-1.5 flex items-center gap-3 text-[10px] text-cream-45">
            {entity.files && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {entity.files}
              </span>
            )}
            {entity.decisions && (
              <span className="flex items-center gap-1">
                <span className="text-decision">⚡</span>
                {entity.decisions}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

// EntityColumn - matches packages/web exactly
function EntityColumn({
  title,
  entities,
  color,
  hoveredId,
  connectedIds,
  onHover,
}: {
  title: string;
  entities: EntityData[];
  color: string;
  hoveredId: string | null;
  connectedIds: Set<string>;
  onHover: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="flex-shrink-0 px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold uppercase tracking-wide" style={{ color }}>
            {title}
          </h2>
          <span className="text-xs text-cream-28">{entities.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {entities.map((entity) => (
          <EntityCard
            key={entity.id}
            entity={entity}
            isHovered={hoveredId === entity.id}
            isDirectConnection={connectedIds.has(entity.id)}
            onHover={onHover}
          />
        ))}
      </div>
    </div>
  );
}

// ColumnsView (StructureView) - matches packages/web exactly
function ColumnsView({
  hoveredId,
  connectedIds,
  onHover,
}: {
  hoveredId: string | null;
  connectedIds: Set<string>;
  onHover: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 min-w-0 border-r border-border-subtle">
        <EntityColumn
          title="Domains"
          entities={DOMAINS}
          color="var(--color-domain)"
          hoveredId={hoveredId}
          connectedIds={connectedIds}
          onHover={onHover}
        />
      </div>
      <div className="flex-1 min-w-0 border-r border-border-subtle">
        <EntityColumn
          title="Capabilities"
          entities={CAPABILITIES}
          color="var(--color-capability)"
          hoveredId={hoveredId}
          connectedIds={connectedIds}
          onHover={onHover}
        />
      </div>
      <div className="flex-1 min-w-0">
        <EntityColumn
          title="Aspects"
          entities={ASPECTS}
          color="var(--color-aspect)"
          hoveredId={hoveredId}
          connectedIds={connectedIds}
          onHover={onHover}
        />
      </div>
    </div>
  );
}

// DomainRegion - matches packages/web exactly
function DomainRegion({
  domain,
  capabilities,
  hoveredId,
  connectedIds,
  onHover,
}: {
  domain: EntityData;
  capabilities: EntityData[];
  hoveredId: string | null;
  connectedIds: Set<string>;
  onHover: (id: string | null) => void;
}) {
  const isDomainHighlighted = hoveredId === domain.id || connectedIds.has(domain.id);

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all duration-150 ${
        isDomainHighlighted
          ? 'border-domain/60 bg-warm-surface/70 shadow-lg shadow-domain/10'
          : 'border-domain/30 bg-warm-surface/50'
      }`}
    >
      <button
        onMouseEnter={() => onHover(domain.id)}
        onMouseLeave={() => onHover(null)}
        className="w-full text-left mb-3 pb-2 border-b border-border-subtle cursor-pointer hover:opacity-80"
      >
        <div className="flex items-center gap-2">
          <span className={`text-lg font-mono ${isDomainHighlighted ? 'text-domain brightness-125' : 'text-domain'}`}>
            □
          </span>
          <h3 className={`font-semibold transition-colors ${isDomainHighlighted ? 'text-cream' : 'text-cream-75'}`}>
            {domain.label}
          </h3>
          <span className="text-xs text-cream-28 ml-auto">
            {capabilities.length} {capabilities.length === 1 ? 'capability' : 'capabilities'}
          </span>
        </div>
        <p className="text-xs text-cream-45 mt-1 line-clamp-1">{domain.description}</p>
      </button>

      <div className="flex flex-wrap gap-2">
        {capabilities.map((cap) => (
          <div key={cap.id} className="w-full sm:w-[calc(50%-0.25rem)]">
            <EntityCard
              entity={cap}
              isHovered={hoveredId === cap.id}
              isDirectConnection={connectedIds.has(cap.id)}
              onHover={onHover}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// RegionsView (SpatialView) - matches packages/web exactly
function RegionsView({
  hoveredId,
  connectedIds,
  onHover,
}: {
  hoveredId: string | null;
  connectedIds: Set<string>;
  onHover: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Main scrollable area */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {/* Aspect bar at top - scrolls with content */}
        {ASPECTS.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-aspect text-sm font-mono">○</span>
              <span className="text-xs font-medium text-cream-45 uppercase tracking-wide">
                Aspects
              </span>
              <span className="text-xs text-cream-28">({ASPECTS.length})</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,14rem)] gap-2">
              {ASPECTS.map((aspect) => (
                <EntityCard
                  key={aspect.id}
                  entity={aspect}
                  isHovered={hoveredId === aspect.id}
                  isDirectConnection={connectedIds.has(aspect.id)}
                  onHover={onHover}
                  fullHeight
                />
              ))}
            </div>
          </div>
        )}

        {/* Domain regions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min">
          {DOMAINS.map((domain) => (
            <DomainRegion
              key={domain.id}
              domain={domain}
              capabilities={CAPABILITIES_BY_DOMAIN[domain.id] || []}
              hoveredId={hoveredId}
              connectedIds={connectedIds}
              onHover={onHover}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Visualization() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'structure' | 'spatial'>('structure');
  const [hasAnimated, setHasAnimated] = useState(false);

  // Calculate connected entities
  const connectedIds = new Set<string>();
  if (hoveredId) {
    const allEntities = [...DOMAINS, ...CAPABILITIES, ...ASPECTS];
    const hoveredEntity = allEntities.find((e) => e.id === hoveredId);

    if (hoveredEntity?.connections) {
      hoveredEntity.connections.forEach((id) => connectedIds.add(id));
    }

    allEntities.forEach((entity) => {
      if (entity.connections?.includes(hoveredId)) {
        connectedIds.add(entity.id);
      }
    });
  }

  // Entrance animation
  useEffect(() => {
    if (!isVisible || hasAnimated) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHasAnimated(true);
      return;
    }

    anime({
      targets: containerRef.current,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 600,
      easing: 'easeOutQuad',
    });

    setHasAnimated(true);
  }, [isVisible, hasAnimated]);

  return (
    <section ref={ref} className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-wide text-cream-45 mb-2">
            See what you know
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Your system at a glance
          </h2>
        </div>

        {/* App container - matches packages/web/App.tsx */}
        <div
          ref={containerRef}
          className="opacity-0 rounded-xl border border-border-default overflow-hidden shadow-lg"
        >
          {/* Header - matches exactly */}
          <header className="flex-shrink-0 px-6 py-3 border-b border-border-subtle bg-warm-deep">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <h1 className="text-lg font-bold text-cream">Mental Model</h1>
                <div className="flex items-center gap-4 text-xs text-cream-45">
                  <span><span className="text-domain">□</span> 3</span>
                  <span><span className="text-capability">◇</span> 3</span>
                  <span><span className="text-aspect">○</span> 3</span>
                  <span><span className="text-decision">⚡</span> 4</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Search - decorative */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search entities…"
                    disabled
                    className="w-48 px-3 py-1.5 pl-8 text-sm rounded-lg bg-warm-elevated border border-border-default text-cream placeholder:text-cream-28 cursor-default"
                  />
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* View toggle - functional */}
                <div className="flex items-center rounded-lg p-0.5 bg-warm-elevated border border-border-default">
                  <button
                    onClick={() => setViewMode('structure')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      viewMode === 'structure'
                        ? 'bg-warm-surface text-cream shadow-sm'
                        : 'text-cream-45 hover:text-cream-60'
                    }`}
                  >
                    Columns
                  </button>
                  <button
                    onClick={() => setViewMode('spatial')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      viewMode === 'spatial'
                        ? 'bg-warm-surface text-cream shadow-sm'
                        : 'text-cream-45 hover:text-cream-60'
                    }`}
                  >
                    Regions
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="h-[400px] flex flex-col bg-dotted">
            {viewMode === 'structure' ? (
              <ColumnsView hoveredId={hoveredId} connectedIds={connectedIds} onHover={setHoveredId} />
            ) : (
              <RegionsView hoveredId={hoveredId} connectedIds={connectedIds} onHover={setHoveredId} />
            )}
          </main>
        </div>

        {/* Caption */}
        <p className="text-center text-sm text-cream-45 mt-6">
          Hover to see connections · Toggle views above
        </p>
      </div>
    </section>
  );
}
