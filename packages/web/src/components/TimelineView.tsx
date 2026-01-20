import { useMemo } from 'react';
import type { MentalModel, Decision } from '@mentalmodel/shared';

interface TimelineViewProps {
  model: MentalModel;
  onSelectEntity: (entityId: string) => void;
}

const typeConfig = {
  domain: { glyph: '□', colorClass: 'text-domain' },
  capability: { glyph: '◇', colorClass: 'text-capability' },
  aspect: { glyph: '○', colorClass: 'text-aspect' },
  decision: { glyph: '⚡', colorClass: 'text-decision' },
};

interface TimelineItem {
  id: string;
  type: 'domain' | 'capability' | 'aspect' | 'decision';
  label: string;
  description: string;
  timestamp: Date | null;
  entityId?: string;
}

export function TimelineView({ model, onSelectEntity }: TimelineViewProps) {
  // Build timeline from decisions (they have timestamps) and entity counts
  const { timelineItems, entitySummary } = useMemo(() => {
    const items: TimelineItem[] = [];

    // Add decisions (they have timestamps)
    for (const [id, decision] of Object.entries(model.decisions)) {
      items.push({
        id,
        type: 'decision',
        label: decision.what,
        description: decision.why,
        timestamp: decision.when ? new Date(decision.when) : null,
      });
    }

    // Sort by timestamp (newest first), nulls at end
    items.sort((a, b) => {
      if (!a.timestamp && !b.timestamp) return 0;
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Entity counts for summary
    const entitySummary = {
      domains: Object.keys(model.domains).length,
      capabilities: Object.keys(model.capabilities).length,
      aspects: Object.keys(model.aspects).length,
      decisions: Object.keys(model.decisions).length,
    };

    return { timelineItems: items, entitySummary };
  }, [model]);

  // Group items by date
  const groupedItems = useMemo(() => {
    const groups: Map<string, TimelineItem[]> = new Map();

    for (const item of timelineItems) {
      const dateKey = item.timestamp
        ? new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(item.timestamp)
        : 'Unknown date';

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(item);
    }

    return Array.from(groups.entries());
  }, [timelineItems]);

  return (
    <div className="h-full overflow-y-auto">
      {/* Summary header */}
      <div className="p-6 border-b border-border-subtle">
        <h2 className="text-lg font-bold text-cream mb-4">Model Summary</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-warm-elevated border border-border-subtle">
            <div className="flex items-center gap-2 mb-1">
              <span className={typeConfig.domain.colorClass}>{typeConfig.domain.glyph}</span>
              <span className="text-xs text-cream-28 uppercase tracking-wider">Domains</span>
            </div>
            <div className="text-2xl font-semibold text-cream">{entitySummary.domains}</div>
          </div>
          <div className="p-4 rounded-lg bg-warm-elevated border border-border-subtle">
            <div className="flex items-center gap-2 mb-1">
              <span className={typeConfig.capability.colorClass}>{typeConfig.capability.glyph}</span>
              <span className="text-xs text-cream-28 uppercase tracking-wider">Capabilities</span>
            </div>
            <div className="text-2xl font-semibold text-cream">{entitySummary.capabilities}</div>
          </div>
          <div className="p-4 rounded-lg bg-warm-elevated border border-border-subtle">
            <div className="flex items-center gap-2 mb-1">
              <span className={typeConfig.aspect.colorClass}>{typeConfig.aspect.glyph}</span>
              <span className="text-xs text-cream-28 uppercase tracking-wider">Aspects</span>
            </div>
            <div className="text-2xl font-semibold text-cream">{entitySummary.aspects}</div>
          </div>
          <div className="p-4 rounded-lg bg-warm-elevated border border-border-subtle">
            <div className="flex items-center gap-2 mb-1">
              <span className={typeConfig.decision.colorClass}>{typeConfig.decision.glyph}</span>
              <span className="text-xs text-cream-28 uppercase tracking-wider">Decisions</span>
            </div>
            <div className="text-2xl font-semibold text-cream">{entitySummary.decisions}</div>
          </div>
        </div>
      </div>

      {/* Decision timeline */}
      <div className="p-6">
        <h2 className="text-lg font-bold text-cream mb-4">Decision Timeline</h2>

        {groupedItems.length === 0 ? (
          <div className="text-center py-12 text-cream-28">
            No decisions recorded yet
          </div>
        ) : (
          <div className="space-y-6">
            {groupedItems.map(([date, items]) => (
              <div key={date}>
                <div className="text-xs text-cream-28 uppercase tracking-wider mb-3">
                  {date}
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border-l-2 border-decision bg-decision/5 hover:bg-decision/10 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5 text-decision">
                          {typeConfig.decision.glyph}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-cream">{item.label}</div>
                          <div className="text-sm text-cream-45 mt-1 italic">"{item.description}"</div>
                          {item.timestamp && (
                            <div className="text-xs text-cream-28 mt-2">
                              {new Intl.DateTimeFormat(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              }).format(item.timestamp)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
