import useSWR from 'swr';
import { Streamdown } from 'streamdown';
import type { Decision } from '@mentalmodel/shared';

interface DecisionViewerProps {
  decision: Decision;
  onClose: () => void;
}

interface DocData {
  content?: string;
  url?: string;
  isMarkdown?: boolean;
  isExternal: boolean;
  error?: string;
}

const fetcher = async (url: string): Promise<DocData> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load doc: ${res.statusText}`);
  return res.json();
};

function DocRenderer({ docPath }: { docPath: string }) {
  const { data, error, isLoading } = useSWR<DocData>(
    `/api/doc?path=${encodeURIComponent(docPath)}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-cream-45">
        <div className="w-4 h-4 border-2 border-border-default border-t-decision rounded-full animate-spin" />
        <span>Loading document…</span>
      </div>
    );
  }

  if (error || data?.error) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
        {error?.message || data?.error || 'Failed to load document'}
      </div>
    );
  }

  if (data?.isExternal) {
    return (
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-3 rounded-lg bg-warm-elevated border border-border-subtle hover:border-border-default transition-colors group"
      >
        <svg
          className="w-4 h-4 text-cream-45 group-hover:text-decision"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
        <span className="text-sm text-cream-75 group-hover:text-cream truncate">
          {docPath}
        </span>
      </a>
    );
  }

  if (data?.content) {
    if (data.isMarkdown) {
      return (
        <div className="prose prose-invert prose-sm max-w-none [&_h1]:text-cream [&_h2]:text-cream [&_h3]:text-cream [&_p]:text-cream-75 [&_li]:text-cream-75 [&_a]:text-decision [&_code]:text-cream-60 [&_code]:bg-warm-deep [&_pre]:bg-warm-deep [&_pre]:border [&_pre]:border-border-subtle [&_blockquote]:border-decision [&_blockquote]:text-cream-60">
          <Streamdown>{data.content}</Streamdown>
        </div>
      );
    }
    return (
      <pre className="p-4 rounded-lg bg-warm-deep border border-border-subtle overflow-x-auto text-sm text-cream-75">
        {data.content}
      </pre>
    );
  }

  return null;
}

export function DecisionViewer({ decision, onClose }: DecisionViewerProps) {
  const isSuperseded = decision.status === 'superseded';
  const hasDocs = decision.docs && decision.docs.length > 0;

  return (
    <div className="h-full flex flex-col bg-warm-surface">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border-subtle">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs uppercase tracking-wider font-medium ${isSuperseded ? 'text-cream-45' : 'text-decision'}`}>
              {isSuperseded ? '○' : '⚡'} Decision
            </span>
            {isSuperseded && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium bg-cream-28/20 text-cream-45">
                Superseded
              </span>
            )}
          </div>
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
        <h2 className={`text-xl font-semibold ${isSuperseded ? 'text-cream-45 line-through' : 'text-cream'}`}>
          {decision.what}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Why section */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-cream-45">
            Rationale
          </h3>
          <blockquote className={`pl-4 border-l-2 italic ${isSuperseded ? 'border-cream-28 text-cream-45' : 'border-decision text-cream-75'}`}>
            "{decision.why}"
          </blockquote>
        </div>

        {/* Context section */}
        {decision.context && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-cream-45">
              Context
            </h3>
            <p className={`text-sm ${isSuperseded ? 'text-cream-45' : 'text-cream-75'}`}>
              {decision.context}
            </p>
          </div>
        )}

        {/* Timestamp */}
        {decision.when && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-cream-45">
              Decided
            </h3>
            <p className="text-sm text-cream-60">
              {new Intl.DateTimeFormat(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(decision.when))}
            </p>
          </div>
        )}

        {/* Related entities */}
        {(decision.relates_to?.domains?.length || decision.relates_to?.capabilities?.length || decision.relates_to?.aspects?.length) && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-cream-45">
              Relates to
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {decision.relates_to.domains?.map((d) => (
                <span key={`domain:${d}`} className="px-2 py-1 text-xs rounded-md bg-warm-elevated border border-border-default">
                  <span className="text-domain">□</span> {d}
                </span>
              ))}
              {decision.relates_to.capabilities?.map((c) => (
                <span key={`capability:${c}`} className="px-2 py-1 text-xs rounded-md bg-warm-elevated border border-border-default">
                  <span className="text-capability">◇</span> {c}
                </span>
              ))}
              {decision.relates_to.aspects?.map((a) => (
                <span key={`aspect:${a}`} className="px-2 py-1 text-xs rounded-md bg-warm-elevated border border-border-default">
                  <span className="text-aspect">○</span> {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Docs section */}
        {hasDocs && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-cream-45">
              Documentation
            </h3>
            <div className="space-y-4">
              {decision.docs!.map((docPath, index) => (
                <div key={index} className="space-y-2">
                  {decision.docs!.length > 1 && (
                    <div className="text-xs text-cream-28 font-mono truncate">{docPath}</div>
                  )}
                  <DocRenderer docPath={docPath} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty docs state */}
        {!hasDocs && !decision.context && (
          <div className="text-center py-8 text-sm text-cream-28">
            <div>No additional documentation attached</div>
          </div>
        )}
      </div>
    </div>
  );
}
