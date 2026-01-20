import React, { useMemo, useCallback, useState } from 'react';
import type { ModelView, Entity, MentalModel, Decision } from '@mentalmodel/shared';
import { EntityColumn } from './EntityColumn';
import { DetailPanel } from './DetailPanel';
import { TimelineBar } from './TimelineBar';
import { CodeViewer } from './CodeViewer';
import { DecisionViewer } from './DecisionViewer';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
    setSelectedFile(null);
  }, [clearSelection]);

  // File viewer state
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: string) => {
    setSelectedFile(file);
  }, []);

  const handleCloseFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  // Decision viewer state
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);

  const handleDecisionSelect = useCallback((decision: Decision) => {
    setSelectedDecision(decision);
  }, []);

  const handleCloseDecision = useCallback(() => {
    setSelectedDecision(null);
  }, []);

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

      </div>

      {/* Detail panel as sheet overlay */}
      <Sheet open={!!selectedEntity} onOpenChange={(open) => !open && handleCloseDetail()}>
        <SheetContent className="w-96 p-0 bg-warm-surface [&>button]:hidden">
          {selectedEntity && (
            <DetailPanel
              entity={selectedEntity}
              connections={data.connections}
              model={model}
              onClose={handleCloseDetail}
              onNavigate={handleNavigate}
              onFileSelect={handleFileSelect}
              onDecisionSelect={handleDecisionSelect}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Code viewer as left sheet */}
      <Sheet open={!!selectedFile} onOpenChange={(open) => !open && handleCloseFile()}>
        <SheetContent side="left" className="w-[calc(100vw-24rem)] p-0 bg-warm-surface [&>button]:hidden" overlayClassName="backdrop-blur-none bg-transparent">
          {selectedFile && (
            <CodeViewer file={selectedFile} onClose={handleCloseFile} />
          )}
        </SheetContent>
      </Sheet>

      {/* Decision viewer as left sheet */}
      <Sheet open={!!selectedDecision} onOpenChange={(open) => !open && handleCloseDecision()}>
        <SheetContent side="left" className="w-[calc(100vw-24rem)] p-0 bg-warm-surface [&>button]:hidden" overlayClassName="backdrop-blur-none bg-transparent">
          {selectedDecision && (
            <DecisionViewer decision={selectedDecision} onClose={handleCloseDecision} />
          )}
        </SheetContent>
      </Sheet>

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
