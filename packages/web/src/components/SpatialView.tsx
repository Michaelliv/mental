import React, { useMemo, useCallback, useState } from 'react';
import type { ModelView, Entity, MentalModel, Decision, Connection } from '@mentalmodel/shared';
import { DomainRegion } from './DomainRegion';
import { EntityCard } from './EntityCard';
import { DetailPanel } from './DetailPanel';
import { TimelineBar } from './TimelineBar';
import { CodeViewer } from './CodeViewer';
import { DecisionViewer } from './DecisionViewer';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useEntitySelection, useConnectionHighlighting, useEntityFilter } from '../hooks';

interface SpatialViewProps {
  data: ModelView;
  model: MentalModel;
  searchQuery: string;
}

/**
 * Group capabilities by their primary domain (first operates_on connection)
 */
function groupCapabilitiesByDomain(
  capabilities: Entity[],
  connections: Connection[]
): Record<string, Entity[]> {
  const groups: Record<string, Entity[]> = {};

  for (const cap of capabilities) {
    const primaryDomain = connections
      .filter((c) => c.from === cap.id && c.type === 'operates_on')
      .map((c) => c.to)[0] ?? 'uncategorized';

    if (!groups[primaryDomain]) {
      groups[primaryDomain] = [];
    }
    groups[primaryDomain].push(cap);
  }

  return groups;
}

export function SpatialView({ data, model, searchQuery }: SpatialViewProps) {
  // Use the same hooks as StructureView for consistent behavior
  const {
    selectedEntity,
    hoveredEntityId,
    lastVisitedEntityId,
    activeEntityId,
    handleSelect,
    handleHover,
    clearSelection,
  } = useEntitySelection(data.entities);

  // Time filter state
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

  // Group capabilities by their primary domain
  const capabilitiesByDomain = useMemo(() => {
    return groupCapabilitiesByDomain(capabilities, data.connections);
  }, [capabilities, data.connections]);

  // Create a map of domain entities by ID for quick lookup
  const domainMap = useMemo(() => {
    const map: Record<string, Entity> = {};
    for (const domain of domains) {
      map[domain.id] = domain;
    }
    return map;
  }, [domains]);

  // Get domains that have capabilities, plus domains with no capabilities
  const domainRegions = useMemo(() => {
    const regions: Array<{ domain: Entity | null; capabilities: Entity[] }> = [];

    // Add domains with capabilities
    for (const domain of domains) {
      const caps = capabilitiesByDomain[domain.id] || [];
      regions.push({ domain, capabilities: caps });
    }

    // Add uncategorized region if there are orphan capabilities
    const uncategorized = capabilitiesByDomain['uncategorized'];
    if (uncategorized && uncategorized.length > 0) {
      regions.push({ domain: null, capabilities: uncategorized });
    }

    return regions;
  }, [domains, capabilitiesByDomain]);

  const handleNavigate = useCallback(
    (entityId: string) => {
      const entity = data.entities.find((e) => e.id === entityId);
      if (entity) {
        handleSelect(entity);
      }
    },
    [data.entities, handleSelect]
  );

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
      {/* Aspect bar at top */}
      {aspects.length > 0 && (
        <div className="flex-shrink-0 border-b border-border-subtle bg-warm-deep/50">
          <div className="px-4 pt-2 pb-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-aspect text-sm font-mono">○</span>
              <span className="text-xs font-medium text-cream-45 uppercase tracking-wide">
                Aspects
              </span>
              <span className="text-xs text-cream-28">({aspects.length})</span>
            </div>
            {/* Wrapper with negative margin to compensate for inner padding that prevents clipping */}
            <div className="-mx-2 -mb-1">
              <div className="flex gap-2 overflow-x-auto px-2 py-2 scrollbar-thin">
                {aspects.map((aspect) => (
                  <div key={aspect.id} className="flex-shrink-0 w-56">
                    <EntityCard
                      entity={aspect}
                      connections={data.connections}
                      isHovered={hoveredEntityId === aspect.id}
                      isDirectConnection={directConnections.has(aspect.id)}
                      isTransitiveConnection={transitiveConnections.has(aspect.id)}
                      isSelected={selectedEntity?.id === aspect.id}
                      isLastVisited={lastVisitedEntityId === aspect.id}
                      onHover={handleHover}
                      onClick={handleSelect}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main spatial grid */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {domainRegions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min">
            {domainRegions.map((region) => (
              <DomainRegion
                key={region.domain?.id ?? 'uncategorized'}
                domain={region.domain}
                capabilities={region.capabilities}
                connections={data.connections}
                hoveredEntityId={hoveredEntityId}
                directConnections={directConnections}
                transitiveConnections={transitiveConnections}
                selectedEntityId={selectedEntity?.id ?? null}
                lastVisitedEntityId={lastVisitedEntityId}
                onHover={handleHover}
                onSelect={handleSelect}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-cream-45">
            <div className="text-center">
              <div className="text-4xl mb-4">□ ◇</div>
              <div className="text-sm">No domains or capabilities match your search</div>
            </div>
          </div>
        )}
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
        <SheetContent
          side="left"
          className="w-[calc(100vw-24rem)] p-0 bg-warm-surface [&>button]:hidden"
          overlayClassName="backdrop-blur-none bg-transparent"
        >
          {selectedFile && <CodeViewer file={selectedFile} onClose={handleCloseFile} />}
        </SheetContent>
      </Sheet>

      {/* Decision viewer as left sheet */}
      <Sheet open={!!selectedDecision} onOpenChange={(open) => !open && handleCloseDecision()}>
        <SheetContent
          side="left"
          className="w-[calc(100vw-24rem)] p-0 bg-warm-surface [&>button]:hidden"
          overlayClassName="backdrop-blur-none bg-transparent"
        >
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
