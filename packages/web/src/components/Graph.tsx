import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { GraphData, GraphNode } from '@mentalmodel/shared';

interface GraphProps {
  data: GraphData;
  selectedNode: GraphNode | null;
  onSelectNode: (node: GraphNode | null) => void;
}

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
}

export function Graph({ data, selectedNode, onSelectNode }: GraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Layout algorithm: three horizontal layers
  const layoutNodes = useMemo(() => {
    const layers = {
      aspect: data.nodes.filter((n) => n.type === 'aspect'),
      capability: data.nodes.filter((n) => n.type === 'capability'),
      domain: data.nodes.filter((n) => n.type === 'domain'),
    };

    const layerY = { aspect: 100, capability: 300, domain: 500 };
    const nodeSpacing = 180;
    const startX = 100;

    const positioned: LayoutNode[] = [];

    // Position aspects
    layers.aspect.forEach((node, i) => {
      positioned.push({
        ...node,
        x: startX + i * nodeSpacing,
        y: layerY.aspect,
      });
    });

    // Position capabilities
    layers.capability.forEach((node, i) => {
      positioned.push({
        ...node,
        x: startX + i * nodeSpacing,
        y: layerY.capability,
      });
    });

    // Position domains
    layers.domain.forEach((node, i) => {
      positioned.push({
        ...node,
        x: startX + i * nodeSpacing,
        y: layerY.domain,
      });
    });

    return positioned;
  }, [data]);

  const isNodeHighlighted = (nodeId: string) => {
    if (!selectedNode && !hoveredNode) return true;
    const targetId = selectedNode?.id || hoveredNode;
    if (nodeId === targetId) return true;

    // Highlight connected nodes
    const connectedEdges = data.edges.filter(
      (e) => e.from === targetId || e.to === targetId
    );
    return connectedEdges.some((e) => e.from === nodeId || e.to === nodeId);
  };

  const getNodeById = (id: string) => layoutNodes.find((n) => n.id === id);

  return (
    <div className="flex-1 relative bg-gray-950">
      {/* Layer labels */}
      <div className="absolute left-4 top-20 text-purple-400 text-sm font-semibold">
        ASPECTS
      </div>
      <div className="absolute left-4 top-[270px] text-blue-400 text-sm font-semibold">
        CAPABILITIES
      </div>
      <div className="absolute left-4 top-[470px] text-green-400 text-sm font-semibold">
        DOMAINS
      </div>

      <svg className="w-full h-full">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#4b5563" />
          </marker>
        </defs>

        {/* Edges */}
        <g>
          {data.edges.map((edge, i) => {
            const from = getNodeById(edge.from);
            const to = getNodeById(edge.to);
            if (!from || !to) return null;

            const highlighted = isNodeHighlighted(edge.from) && isNodeHighlighted(edge.to);

            return (
              <motion.line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={highlighted ? '#6b7280' : '#1f2937'}
                strokeWidth={highlighted ? 2 : 1}
                markerEnd="url(#arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.02 }}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {layoutNodes.map((node, i) => {
            const highlighted = isNodeHighlighted(node.id);
            const selected = selectedNode?.id === node.id;
            const colors = {
              domain: '#10b981',
              capability: '#3b82f6',
              aspect: '#a855f7',
            };

            return (
              <g key={node.id}>
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={selected ? 32 : 28}
                  fill={highlighted ? colors[node.type] : '#1f2937'}
                  stroke={selected ? '#ffffff' : colors[node.type]}
                  strokeWidth={selected ? 3 : 2}
                  className="cursor-pointer"
                  onClick={() => onSelectNode(node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  whileHover={{ scale: 1.1 }}
                />
                <motion.text
                  x={node.x}
                  y={node.y + 50}
                  textAnchor="middle"
                  fill={highlighted ? '#ffffff' : '#4b5563'}
                  fontSize="14"
                  fontWeight="500"
                  className="pointer-events-none select-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 + 0.2 }}
                >
                  {node.label}
                </motion.text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
