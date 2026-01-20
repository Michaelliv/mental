import React, { useMemo, useCallback } from 'react';
import type { ModelView, Entity, MentalModel } from '@mentalmodel/shared';
import { EntityColumn } from './EntityColumn';
import { DetailPanel } from './DetailPanel';
import { TimelineBar } from './TimelineBar';
import { useEntitySelection, useConnectionHighlighting, useEntityFilter } from '../hooks';

interface StructureViewProps {
  data: ModelView;
  model: MentalModel;
  searchQuery: string;
}

const columnConfig = {
  aspects: { title: 'Aspects', color: 'var(--color-aspect)' },
  capabilities: { title: 'Capabilities', color: 'var(--color-capability)' },
  domains: { title: 'Domains', color: 'var(--color-domain)' },
};

export function StructureView({ data, model, searchQuery }: StructureViewProps) {
  // Use custom hooks for state management
  const {
    selectedEntity,
    hoveredEntityId,
    lastVisitedEntityId,
    activeEntityId,
    handleSelect,
    handleHover,
    clearSelection,
  } = useEntitySelection(data.entities);

  // Time filter state (kept local since it's view-specific)
  const [currentTime, setCurrentTime] = React.useState<number>(Date.now());

  // Filter entities by search query and time
  const { filteredEntities } = useEntityFilter(data.entities, {
    searchQuery,
    currentTime,
  });

  // Calculate connection highlighting
  const { directConnections, transitiveConnections } = useConnectionHighlighting(
    activeEntityId,
    data.connections
  );

  // Split entities by type
  const { aspects, capabilities, domains } = useMemo(() => {
    const aspects: Entity[] = [];
    const capabilities: Entity[] = [];
    const domains: Entity[] = [];

    for (const entity of filteredEntities) {
      if (entity.type === 'aspect') aspects.push(entity);
      else if (entity.type === 'capability') capabilities.push(entity);
      else if (entity.type === 'domain') domains.push(entity);
    }

    return { aspects, capabilities, domains };
  }, [filteredEntities]);

  const handleNavigate = useCallback((entityId: string) => {
    const entity = data.entities.find((e) => e.id === entityId);
    if (entity) {
      handleSelect(entity);
    }
  }, [data.entities, handleSelect]);

  const handleCloseDetail = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 min-h-0">
        {/* Three columns: Domains → Capabilities → Aspects (foundation to governance) */}
        <div className="flex-1 flex min-w-0">
          {/* Domains column (foundation - leftmost) */}
          <div className="flex-1 min-w-0 border-r border-border-subtle">
            <EntityColumn
              title={columnConfig.domains.title}
              entities={domains}
              connections={data.connections}
              hoveredEntityId={hoveredEntityId}
              directConnections={directConnections}
              transitiveConnections={transitiveConnections}
              selectedEntityId={selectedEntity?.id ?? null}
              lastVisitedEntityId={lastVisitedEntityId}
              onHover={handleHover}
              onSelect={handleSelect}
              color={columnConfig.domains.color}
            />
          </div>

          {/* Capabilities column (actions on domains) */}
          <div className="flex-1 min-w-0 border-r border-border-subtle">
            <EntityColumn
              title={columnConfig.capabilities.title}
              entities={capabilities}
              connections={data.connections}
              hoveredEntityId={hoveredEntityId}
              directConnections={directConnections}
              transitiveConnections={transitiveConnections}
              selectedEntityId={selectedEntity?.id ?? null}
              lastVisitedEntityId={lastVisitedEntityId}
              onHover={handleHover}
              onSelect={handleSelect}
              color={columnConfig.capabilities.color}
            />
          </div>

          {/* Aspects column (governance - rightmost) */}
          <div className="flex-1 min-w-0">
            <EntityColumn
              title={columnConfig.aspects.title}
              entities={aspects}
              connections={data.connections}
              hoveredEntityId={hoveredEntityId}
              directConnections={directConnections}
              transitiveConnections={transitiveConnections}
              selectedEntityId={selectedEntity?.id ?? null}
              lastVisitedEntityId={lastVisitedEntityId}
              onHover={handleHover}
              onSelect={handleSelect}
              color={columnConfig.aspects.color}
            />
          </div>
        </div>

        {/* Detail panel */}
        {selectedEntity && (
          <div className="w-80 flex-shrink-0 border-l border-border-subtle">
            <DetailPanel
              entity={selectedEntity}
              connections={data.connections}
              model={model}
              onClose={handleCloseDetail}
              onNavigate={handleNavigate}
            />
          </div>
        )}
      </div>

      {/* Timeline bar at bottom */}
      <TimelineBar
        entities={data.entities}
        decisions={model.decisions}
        currentTime={currentTime}
        onTimeChange={setCurrentTime}
      />
    </div>
  );
}
