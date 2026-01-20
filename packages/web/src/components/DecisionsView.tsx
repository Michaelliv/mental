import { useMemo, useState } from 'react';
import type { MentalModel, Decision, ModelView } from '@mentalmodel/shared';

interface DecisionsViewProps {
  model: MentalModel;
  data: ModelView;
  onSelectEntity: (entityId: string) => void;
}

const typeConfig = {
  domain: { glyph: '□', colorClass: 'text-domain' },
  capability: { glyph: '◇', colorClass: 'text-capability' },
  aspect: { glyph: '○', colorClass: 'text-aspect' },
};

interface DecisionWithEntities extends Decision {
  relatedEntities: Array<{
    id: string;
    label: string;
    type: 'domain' | 'capability' | 'aspect';
  }>;
}

export function DecisionsView({ model, data, onSelectEntity }: DecisionsViewProps) {
  const [hoveredDecisionId, setHoveredDecisionId] = useState<string | null>(null);

  // Build decisions with resolved entity references
  const decisions = useMemo(() => {
    const result: DecisionWithEntities[] = [];

    for (const [id, decision] of Object.entries(model.decisions)) {
      const relatedEntities: DecisionWithEntities['relatedEntities'] = [];

      // Add related domains
      if (decision.relates_to?.domains) {
        for (const name of decision.relates_to.domains) {
          if (model.domains[name]) {
            relatedEntities.push({
              id: `domain:${name}`,
              label: name,
              type: 'domain',
            });
          }
        }
      }

      // Add related capabilities
      if (decision.relates_to?.capabilities) {
        for (const name of decision.relates_to.capabilities) {
          if (model.capabilities[name]) {
            relatedEntities.push({
              id: `capability:${name}`,
              label: name,
              type: 'capability',
            });
          }
        }
      }

      // Add related aspects
      if (decision.relates_to?.aspects) {
        for (const name of decision.relates_to.aspects) {
          if (model.aspects[name]) {
            relatedEntities.push({
              id: `aspect:${name}`,
              label: name,
              type: 'aspect',
            });
          }
        }
      }

      // Also find entities that reference this decision
      for (const [name, domain] of Object.entries(model.domains)) {
        if (domain.decisions?.includes(id) && !relatedEntities.find((e) => e.id === `domain:${name}`)) {
          relatedEntities.push({
            id: `domain:${name}`,
            label: name,
            type: 'domain',
          });
        }
      }

      for (const [name, capability] of Object.entries(model.capabilities)) {
        if (capability.decisions?.includes(id) && !relatedEntities.find((e) => e.id === `capability:${name}`)) {
          relatedEntities.push({
            id: `capability:${name}`,
            label: name,
            type: 'capability',
          });
        }
      }

      for (const [name, aspect] of Object.entries(model.aspects)) {
        if (aspect.decisions?.includes(id) && !relatedEntities.find((e) => e.id === `aspect:${name}`)) {
          relatedEntities.push({
            id: `aspect:${name}`,
            label: name,
            type: 'aspect',
          });
        }
      }

      result.push({
        ...decision,
        relatedEntities,
      });
    }

    // Sort by date (newest first)
    result.sort((a, b) => {
      if (!a.when && !b.when) return 0;
      if (!a.when) return 1;
      if (!b.when) return -1;
      return new Date(b.when).getTime() - new Date(a.when).getTime();
    });

    return result;
  }, [model]);

  // Get all related entity IDs for the hovered decision
  const highlightedEntities = useMemo(() => {
    if (!hoveredDecisionId) return new Set<string>();
    const decision = decisions.find((d) => d.id === hoveredDecisionId);
    if (!decision) return new Set<string>();
    return new Set(decision.relatedEntities.map((e) => e.id));
  }, [hoveredDecisionId, decisions]);

  // Group entities by whether they have decisions or not
  const { entitiesWithDecisions, entitiesWithoutDecisions } = useMemo(() => {
    const withDecisions = new Set<string>();
    for (const decision of decisions) {
      for (const entity of decision.relatedEntities) {
        withDecisions.add(entity.id);
      }
    }

    const withoutDecisions = data.entities
      .filter((e) => !withDecisions.has(e.id))
      .map((e) => ({
        id: e.id,
        label: e.label,
        type: e.type,
      }));

    return {
      entitiesWithDecisions: withDecisions,
      entitiesWithoutDecisions: withoutDecisions,
    };
  }, [decisions, data.entities]);

  return (
    <div className="h-full flex">
      {/* Decisions list */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-border-subtle">
        <h2 className="text-lg font-bold text-cream mb-4">
          Decisions
          <span className="text-cream-28 font-normal ml-2">({decisions.length})</span>
        </h2>

        {decisions.length === 0 ? (
          <div className="text-center py-12 text-cream-28">
            <p>No decisions recorded yet</p>
            <p className="text-sm mt-2">
              Use <code className="px-2 py-0.5 bg-warm-elevated rounded">mental add decision</code> to add one
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {decisions.map((decision) => (
              <div
                key={decision.id}
                className={`p-4 rounded-lg border-l-2 border-decision transition-all cursor-default ${
                  hoveredDecisionId === decision.id
                    ? 'bg-decision/10'
                    : 'bg-decision/5'
                }`}
                onMouseEnter={() => setHoveredDecisionId(decision.id)}
                onMouseLeave={() => setHoveredDecisionId(null)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-decision text-lg">⚡</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-cream">{decision.what}</div>
                    <div className="text-sm text-cream-45 mt-1 italic">"{decision.why}"</div>

                    {/* Related entities */}
                    {decision.relatedEntities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {decision.relatedEntities.map((entity) => (
                          <button
                            key={entity.id}
                            onClick={() => onSelectEntity(entity.id)}
                            className="px-2 py-1 text-xs rounded-md bg-warm-elevated hover:bg-warm-surface border border-border-default hover:border-border-subtle transition-all flex items-center gap-1.5"
                          >
                            <span className={typeConfig[entity.type].colorClass}>
                              {typeConfig[entity.type].glyph}
                            </span>
                            <span className="text-cream-75">{entity.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {decision.relatedEntities.length === 0 && (
                      <div className="text-xs text-cream-28 mt-2">
                        No entities linked
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Entities sidebar */}
      <div className="w-72 overflow-y-auto p-6">
        <h3 className="text-sm font-bold text-cream-75 mb-3">
          Entities by Decision Coverage
        </h3>

        {/* Entities with decisions */}
        <div className="mb-6">
          <div className="text-xs text-cream-28 uppercase tracking-wider mb-2">
            With rationale ({entitiesWithDecisions.size})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(entitiesWithDecisions).map((id) => {
              const entity = data.entities.find((e) => e.id === id);
              if (!entity) return null;
              const isHighlighted = highlightedEntities.has(id);
              return (
                <button
                  key={id}
                  onClick={() => onSelectEntity(id)}
                  className={`px-2 py-1 text-xs rounded-md border transition-all flex items-center gap-1 ${
                    isHighlighted
                      ? 'bg-decision/15 border-decision/40'
                      : 'bg-warm-elevated border-border-default'
                  }`}
                >
                  <span className={typeConfig[entity.type].colorClass}>
                    {typeConfig[entity.type].glyph}
                  </span>
                  <span className="text-cream-75">{entity.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Entities without decisions */}
        {entitiesWithoutDecisions.length > 0 && (
          <div>
            <div className="text-xs text-cream-28 uppercase tracking-wider mb-2">
              Without rationale ({entitiesWithoutDecisions.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {entitiesWithoutDecisions.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => onSelectEntity(entity.id)}
                  className="px-2 py-1 text-xs rounded-md bg-warm-elevated/50 border border-border-subtle hover:border-border-default transition-all flex items-center gap-1 opacity-50 hover:opacity-70"
                >
                  <span className={typeConfig[entity.type].colorClass}>
                    {typeConfig[entity.type].glyph}
                  </span>
                  <span className="text-cream-45">{entity.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-cream-28 mt-3">
              These entities have no decisions explaining their design rationale.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
