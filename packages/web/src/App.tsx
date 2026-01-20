import { useMemo, useState } from 'react';
import useSWR from 'swr';
import type { MentalModel } from '@mentalmodel/shared';
import { buildModelView } from './lib/model-view';
import { StructureView } from './components/StructureView';
import { fetchers } from './lib/api';

export default function App() {
  const { data: model, error, isLoading } = useSWR<MentalModel>('/api/model', fetchers.model);
  const [searchQuery, setSearchQuery] = useState('');

  const modelView = useMemo(() => {
    if (!model) return null;
    return buildModelView(model);
  }, [model]);

  // Count entities for the header
  const entityCounts = useMemo(() => {
    if (!model) return { domains: 0, capabilities: 0, aspects: 0, decisions: 0, total: 0 };
    const domains = Object.keys(model.domains).length;
    const capabilities = Object.keys(model.capabilities).length;
    const aspects = Object.keys(model.aspects).length;
    const decisions = Object.keys(model.decisions).length;
    return {
      domains,
      capabilities,
      aspects,
      decisions,
      total: domains + capabilities + aspects,
    };
  }, [model]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-warm-deep">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-border-subtle" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-domain motion-safe:animate-spin" />
          </div>
          <span className="text-sm text-cream-45">Loading mental model…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-warm-deep">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">Something went wrong</div>
          <div className="text-sm text-cream-45">{error.message}</div>
        </div>
      </div>
    );
  }

  if (!modelView || !model) {
    return (
      <div className="flex items-center justify-center h-screen bg-warm-deep">
        <div className="text-center max-w-md px-6">
          <div className="text-4xl mb-4 text-cream-45">□ ◇ ○</div>
          <div className="text-lg mb-3 text-cream-75">
            Your mental model starts here
          </div>
          <div className="text-sm leading-relaxed text-cream-45">
            Understanding grows over time. Add your first domain to begin.
          </div>
          <code className="inline-block mt-4 px-3 py-1.5 rounded-lg text-sm bg-warm-elevated text-domain">
            mental add domain User
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-dotted">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-3 border-b border-border-subtle bg-warm-deep">
        <div className="flex items-center justify-between">
          {/* Left: Title and counts */}
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold text-cream">Mental Model</h1>
            <div className="flex items-center gap-4 text-xs text-cream-45">
              <span>
                <span className="text-domain">□</span> {entityCounts.domains}
              </span>
              <span>
                <span className="text-capability">◇</span> {entityCounts.capabilities}
              </span>
              <span>
                <span className="text-aspect">○</span> {entityCounts.aspects}
              </span>
              <span>
                <span className="text-decision">⚡</span> {entityCounts.decisions}
              </span>
            </div>
          </div>

          {/* Right: Search and view tabs */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <label htmlFor="entity-search" className="sr-only">Search entities</label>
              <input
                id="entity-search"
                type="text"
                placeholder="Search entities…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 px-3 py-1.5 pl-8 text-sm rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/30 bg-warm-elevated border border-border-default text-cream placeholder:text-cream-28"
              />
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-28"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors text-cream-28 hover:text-cream-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/30 rounded"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 min-h-0">
        <StructureView data={modelView} model={model} searchQuery={searchQuery} />
      </main>
    </div>
  );
}
