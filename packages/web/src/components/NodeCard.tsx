import { useRef, useEffect } from 'react';
import type { GraphNode } from '@mentalmodel/shared';

interface NodeCardProps {
  node: GraphNode;
  selected: boolean;
  highlighted: boolean;
  onClick: () => void;
  onMount: (id: string, element: HTMLDivElement) => void;
}

const typeColors = {
  domain: {
    bg: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    selectedBorder: 'border-emerald-400',
  },
  capability: {
    bg: 'from-blue-500/10 to-blue-500/5',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    selectedBorder: 'border-blue-400',
  },
  aspect: {
    bg: 'from-purple-500/10 to-purple-500/5',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    selectedBorder: 'border-purple-400',
  },
};

export function NodeCard({ node, selected, highlighted, onClick, onMount }: NodeCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const colors = typeColors[node.type];

  useEffect(() => {
    if (ref.current) {
      onMount(node.id, ref.current);
    }
  }, [node.id, onMount]);

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`
        relative px-6 py-4 min-w-[200px] rounded-lg
        bg-gradient-to-br ${colors.bg}
        border-2 ${selected ? colors.selectedBorder : colors.border}
        cursor-pointer transition-all duration-200
        hover:scale-105 hover:shadow-xl
        ${highlighted ? 'opacity-100' : 'opacity-40'}
        ${selected ? 'shadow-2xl ring-2 ring-white/20' : 'shadow-lg'}
      `}
    >
      <div className={`font-semibold text-lg ${colors.text} mb-1`}>
        {node.label}
      </div>
      <div className="text-sm text-gray-400 line-clamp-2">
        {node.description}
      </div>
      {node.files && node.files.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{node.files.length} file{node.files.length > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}
