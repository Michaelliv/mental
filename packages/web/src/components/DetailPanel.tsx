import { useMemo, useState } from 'react';
import type { Entity, Connection, MentalModel, Decision } from '@mentalmodel/shared';
import { DecisionCard } from './DecisionCard';

interface DetailPanelProps {
  entity: Entity;
  connections: Connection[];
  model: MentalModel;
  onClose: () => void;
  onNavigate: (entityId: string) => void;
  onFileSelect?: (file: string) => void;
  onDecisionSelect?: (decision: Decision) => void;
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

interface RelationshipGroup {
  label: string;
  type: 'inbound' | 'outbound';
  edgeType: string;
  items: Array<{ id: string; label: string; type: 'domain' | 'capability' | 'aspect' }>;
}

export function DetailPanel({ entity, connections, model, onClose, onNavigate, onFileSelect, onDecisionSelect }: DetailPanelProps) {
  const config = typeConfig[entity.type];
  const [showSuperseded, setShowSuperseded] = useState(false);

  // Build relationship groups
  const relationships: RelationshipGroup[] = [];

  // Outbound connections (from this entity)
  const outboundConnections = connections.filter((c) => c.from === entity.id);
  const inboundConnections = connections.filter((c) => c.to === entity.id);

  // Group by connection type
  const operatesOn = outboundConnections
    .filter((c) => c.type === 'operates_on')
    .map((c) => {
      const [type, name] = c.to.split(':');
      return { id: c.to, label: name, type: type as 'domain' | 'capability' | 'aspect' };
    });

  const appliesTo = outboundConnections
    .filter((c) => c.type === 'applies_to')
    .map((c) => {
      const [type, name] = c.to.split(':');
      return { id: c.to, label: name, type: type as 'domain' | 'capability' | 'aspect' };
    });

  const references = outboundConnections
    .filter((c) => c.type === 'references')
    .map((c) => {
      const [type, name] = c.to.split(':');
      return { id: c.to, label: name, type: type as 'domain' | 'capability' | 'aspect' };
    });

  const composes = outboundConnections
    .filter((c) => c.type === 'composes')
    .map((c) => {
      const [type, name] = c.to.split(':');
      return { id: c.to, label: name, type: type as 'domain' | 'capability' | 'aspect' };
    });

  // Inbound relationships
  const referencedBy = inboundConnections
    .filter((c) => c.type === 'references')
    .map((c) => {
      const [type, name] = c.from.split(':');
      return { id: c.from, label: name, type: type as 'domain' | 'capability' | 'aspect' };
    });

  const operatedOnBy = inboundConnections
    .filter((c) => c.type === 'operates_on')
    .map((c) => {
      const [type, name] = c.from.split(':');
      return { id: c.from, label: name, type: type as 'domain' | 'capability' | 'aspect' };
    });

  const governedBy = inboundConnections
    .filter((c) => c.type === 'applies_to')
    .map((c) => {
      const [type, name] = c.from.split(':');
      return { id: c.from, label: name, type: type as 'domain' | 'capability' | 'aspect' };
    });

  const composedBy = inboundConnections
    .filter((c) => c.type === 'composes')
    .map((c) => {
      const [type, name] = c.from.split(':');
      return { id: c.from, label: name, type: type as 'domain' | 'capability' | 'aspect' };
    });

  if (operatesOn.length > 0) relationships.push({ label: 'Operates on', type: 'outbound', edgeType: 'operates_on', items: operatesOn });
  if (appliesTo.length > 0) relationships.push({ label: 'Applies to', type: 'outbound', edgeType: 'applies_to', items: appliesTo });
  if (references.length > 0) relationships.push({ label: 'References', type: 'outbound', edgeType: 'references', items: references });
  if (composes.length > 0) relationships.push({ label: 'Composes', type: 'outbound', edgeType: 'composes', items: composes });
  if (referencedBy.length > 0) relationships.push({ label: 'Referenced by', type: 'inbound', edgeType: 'references', items: referencedBy });
  if (operatedOnBy.length > 0) relationships.push({ label: 'Operated on by', type: 'inbound', edgeType: 'operates_on', items: operatedOnBy });
  if (governedBy.length > 0) relationships.push({ label: 'Governed by', type: 'inbound', edgeType: 'applies_to', items: governedBy });
  if (composedBy.length > 0) relationships.push({ label: 'Composed by', type: 'inbound', edgeType: 'composes', items: composedBy });

  // Get decisions related to this entity (via relates_to reverse lookup)
  const { activeDecisions, supersededDecisions, allDecisions } = useMemo(() => {
    const entityName = entity.label;
    const related: Decision[] = [];

    for (const decision of Object.values(model.decisions)) {
      const matches =
        (entity.type === 'domain' && decision.relates_to?.domains?.includes(entityName)) ||
        (entity.type === 'capability' && decision.relates_to?.capabilities?.includes(entityName)) ||
        (entity.type === 'aspect' && decision.relates_to?.aspects?.includes(entityName));
      if (matches) related.push(decision);
    }

    // Also check entity.decisions for backwards compatibility
    const decisionIds = entity.decisions || [];
    for (const id of decisionIds) {
      const dec = model.decisions[id];
      if (dec && !related.find((d) => d.id === dec.id)) {
        related.push(dec);
      }
    }

    // Sort: active first, then by date (newest first)
    related.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }
      if (!a.when && !b.when) return 0;
      if (!a.when) return 1;
      if (!b.when) return -1;
      return new Date(b.when).getTime() - new Date(a.when).getTime();
    });

    return {
      activeDecisions: related.filter((d) => d.status === 'active'),
      supersededDecisions: related.filter((d) => d.status === 'superseded'),
      allDecisions: related,
    };
  }, [entity, model.decisions]);

  // For backwards compatibility: decisions from entity.decisions that exist and don't have status
  const legacyDecisions: Decision[] = (entity.decisions || [])
    .map((id) => model.decisions[id])
    .filter((d): d is Decision => Boolean(d) && !d.status);

  // Combine with related decisions for display
  const decisionsToShow = showSuperseded ? allDecisions : activeDecisions;
  const hasSuperseded = supersededDecisions.length > 0;

  return (
    <div className="h-full flex flex-col bg-warm-surface">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-border-subtle">
          <div className="flex items-start justify-between mb-2">
            <span className={`text-xs uppercase tracking-wider font-medium ${config.colorClass}`}>
              {config.glyph} {config.label}
            </span>
            <button
              onClick={onClose}
              className="transition-colors p-1 -m-1 text-cream-28 hover:text-cream-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/30 rounded"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 className="text-xl font-semibold text-cream">{entity.label}</h2>
          <p className="text-sm mt-2 leading-relaxed text-cream-75">{entity.description}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Relationships */}
          {relationships.length > 0 && (
            <div className="space-y-4">
              {relationships.map((group) => (
                <div key={group.label}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-cream-45">
                    {group.label}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className="px-2 py-1 text-xs rounded-md transition-all flex items-center gap-1.5 bg-warm-elevated border border-border-default hover:border-border-subtle"
                      >
                        <span className={typeConfig[item.type].colorClass}>
                          {typeConfig[item.type].glyph}
                        </span>
                        <span className="text-cream-75">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Decisions */}
          {(decisionsToShow.length > 0 || legacyDecisions.length > 0) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-decision">
                  ⚡ Decisions
                </h3>
                {hasSuperseded && (
                  <button
                    onClick={() => setShowSuperseded(!showSuperseded)}
                    className="text-[10px] text-cream-45 hover:text-cream-60 transition-colors"
                  >
                    {showSuperseded ? 'Hide' : 'Show'} superseded ({supersededDecisions.length})
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {decisionsToShow.map((dec) => (
                  <DecisionCard
                    key={dec.id}
                    decision={dec}
                    onClick={onDecisionSelect ? () => onDecisionSelect(dec) : undefined}
                    onReplacementClick={(id) => {
                      // Show superseded decisions if the replacement is clicked
                      if (!showSuperseded) setShowSuperseded(true);
                    }}
                  />
                ))}
                {/* Legacy decisions without status */}
                {legacyDecisions.map((dec) => (
                  <div
                    key={dec.id}
                    className="p-3 rounded-lg border-l-2 border-decision bg-decision/5"
                  >
                    <div className="text-sm font-medium text-decision">{dec.what}</div>
                    <div className="text-xs mt-1 italic text-cream-45">"{dec.why}"</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {entity.files && entity.files.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-cream-45">
                Files
              </h3>
              <div className="space-y-1">
                {entity.files.map((file) => (
                  <button
                    key={file}
                    onClick={() => onFileSelect?.(file)}
                    className="w-full text-left px-3 py-2 rounded-lg transition-all group flex items-center justify-between bg-warm-elevated border border-border-subtle hover:border-border-default"
                  >
                    <span className="text-xs font-mono truncate text-cream-45 group-hover:text-cream-75">
                      {file}
                    </span>
                    <svg
                      className="w-3.5 h-3.5 flex-shrink-0 ml-2 text-cream-28 group-hover:text-cream-45"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {relationships.length === 0 && allDecisions.length === 0 && legacyDecisions.length === 0 && (!entity.files || entity.files.length === 0) && (
            <div className="text-center py-8 text-sm text-cream-28">
              <div className="mb-2">This {config.label.toLowerCase()} stands alone for now</div>
              <div className="text-xs">Connections will appear as your model grows</div>
            </div>
          )}
        </div>
      </div>
  );
}
