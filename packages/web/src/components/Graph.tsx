import { useState, useCallback, useMemo } from 'react';
import type { GraphData, GraphNode } from '@mentalmodel/shared';
import { NodeCard } from './NodeCard';

interface GraphProps {
  data: GraphData;
  selectedNode: GraphNode | null;
  onSelectNode: (node: GraphNode | null) => void;
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function Graph({ data, selectedNode, onSelectNode }: GraphProps) {
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());

  // Group nodes by type
  const layers = useMemo(() => ({
    aspects: data.nodes.filter(n => n.type === 'aspect'),
    capabilities: data.nodes.filter(n => n.type === 'capability'),
    domains: data.nodes.filter(n => n.type === 'domain'),
  }), [data.nodes]);

  // Track node positions for SVG lines
  const handleNodeMount = useCallback((id: string, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect();
    const containerRect = element.offsetParent?.getBoundingClientRect();
    if (!containerRect) return;

    setNodePositions(prev => new Map(prev).set(id, {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
    }));
  }, []);

  // Determine highlighted nodes
  const highlightedNodes = useMemo(() => {
    if (!selectedNode) return new Set(data.nodes.map(n => n.id));

    const highlighted = new Set([selectedNode.id]);

    // Add connected nodes
    data.edges.forEach(edge => {
      if (edge.from === selectedNode.id) highlighted.add(edge.to);
      if (edge.to === selectedNode.id) highlighted.add(edge.from);
    });

    return highlighted;
  }, [selectedNode, data.nodes, data.edges]);

  return (
    <div className="flex-1 relative overflow-auto bg-gray-950">
      {/* Container for nodes */}
      <div className="relative min-h-screen p-12">
        {/* SVG overlay for connections */}
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#4b5563" />
            </marker>
          </defs>
          {data.edges.map((edge, i) => {
            const from = nodePositions.get(edge.from);
            const to = nodePositions.get(edge.to);
            if (!from || !to) return null;

            const highlighted = highlightedNodes.has(edge.from) && highlightedNodes.has(edge.to);

            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={highlighted ? '#6b7280' : '#1f2937'}
                strokeWidth={highlighted ? 2 : 1}
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </svg>

        {/* Layer: Aspects */}
        <div className="mb-16" style={{ zIndex: 1, position: 'relative' }}>
          <div className="mb-4">
            <h2 className="text-xs font-semibold tracking-wider text-purple-500 uppercase">
              Aspects
            </h2>
            <p className="text-xs text-gray-500 mt-1">Cross-cutting concerns that apply across capabilities</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {layers.aspects.length === 0 ? (
              <div className="text-gray-600 text-sm italic">No aspects defined yet</div>
            ) : (
              layers.aspects.map(node => (
                <NodeCard
                  key={node.id}
                  node={node}
                  selected={selectedNode?.id === node.id}
                  highlighted={highlightedNodes.has(node.id)}
                  onClick={() => onSelectNode(node)}
                  onMount={handleNodeMount}
                />
              ))
            )}
          </div>
        </div>

        {/* Layer: Capabilities */}
        <div className="mb-16" style={{ zIndex: 1, position: 'relative' }}>
          <div className="mb-4">
            <h2 className="text-xs font-semibold tracking-wider text-blue-500 uppercase">
              Capabilities
            </h2>
            <p className="text-xs text-gray-500 mt-1">What the system does - actions and operations</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {layers.capabilities.length === 0 ? (
              <div className="text-gray-600 text-sm italic">No capabilities defined yet</div>
            ) : (
              layers.capabilities.map(node => (
                <NodeCard
                  key={node.id}
                  node={node}
                  selected={selectedNode?.id === node.id}
                  highlighted={highlightedNodes.has(node.id)}
                  onClick={() => onSelectNode(node)}
                  onMount={handleNodeMount}
                />
              ))
            )}
          </div>
        </div>

        {/* Layer: Domains */}
        <div className="mb-16" style={{ zIndex: 1, position: 'relative' }}>
          <div className="mb-4">
            <h2 className="text-xs font-semibold tracking-wider text-emerald-500 uppercase">
              Domains
            </h2>
            <p className="text-xs text-gray-500 mt-1">What the system is about - core entities and concepts</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {layers.domains.length === 0 ? (
              <div className="text-gray-600 text-sm italic">No domains defined yet</div>
            ) : (
              layers.domains.map(node => (
                <NodeCard
                  key={node.id}
                  node={node}
                  selected={selectedNode?.id === node.id}
                  highlighted={highlightedNodes.has(node.id)}
                  onClick={() => onSelectNode(node)}
                  onMount={handleNodeMount}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
