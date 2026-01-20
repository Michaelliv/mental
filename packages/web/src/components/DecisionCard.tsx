import type { Decision } from '@mentalmodel/shared';

interface DecisionCardProps {
  decision: Decision;
  onReplacementClick?: (decisionId: string) => void;
  onClick?: () => void;
}

export function DecisionCard({ decision, onReplacementClick, onClick }: DecisionCardProps) {
  const isSuperseded = decision.status === 'superseded';
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border-l-2 ${
        isSuperseded
          ? 'border-cream-28 bg-warm-elevated/50'
          : 'border-decision bg-decision/5'
      } ${
        isClickable
          ? 'cursor-pointer transition-colors hover:bg-decision/10 hover:border-decision/60'
          : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`text-sm ${isSuperseded ? 'text-cream-28' : 'text-decision'}`}>
          {isSuperseded ? '○' : '⚡'}
        </span>
        <div className="flex-1 min-w-0">
          {/* What */}
          <div
            className={`text-sm font-medium ${
              isSuperseded ? 'text-cream-45 line-through' : 'text-decision'
            }`}
          >
            {decision.what}
          </div>

          {/* Status badge */}
          {isSuperseded && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium mt-1 bg-cream-28/20 text-cream-45">
              Superseded
            </span>
          )}

          {/* Why */}
          <div className={`text-xs mt-1 italic ${isSuperseded ? 'text-cream-28' : 'text-cream-45'}`}>
            "{decision.why}"
          </div>

          {/* Context */}
          {decision.context && (
            <div className={`text-xs mt-2 ${isSuperseded ? 'text-cream-28' : 'text-cream-45'}`}>
              <span className="font-medium">Context:</span> {decision.context}
            </div>
          )}

          {/* Replacement link */}
          {isSuperseded && decision.superseded_by && onReplacementClick && (
            <button
              onClick={() => onReplacementClick(decision.superseded_by!)}
              className="text-xs mt-2 text-decision hover:text-decision/80 hover:underline"
            >
              See replacement →
            </button>
          )}

          {/* Timestamp */}
          {decision.when && (
            <div className="text-[10px] mt-2 text-cream-28">
              {new Intl.DateTimeFormat(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }).format(new Date(decision.when))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
