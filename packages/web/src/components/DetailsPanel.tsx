import { useState } from 'react';
import type { GraphNode, MentalModel } from '@mentalmodel/shared';
import { CodeViewer } from './CodeViewer';

interface DetailsPanelProps {
  node: GraphNode | null;
  model: MentalModel;
  onClose: () => void;
}

export function DetailsPanel({ node, model, onClose }: DetailsPanelProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  if (!node) return null;

  const decisions = node.decisions?.map((decId) => model.decisions[decId]).filter(Boolean) || [];

  // Get relationships
  const relationships = [];
  if (node.type === 'domain') {
    const domain = model.domains[node.label];
    if (domain?.references) {
      relationships.push({ type: 'References', items: domain.references });
    }
  }
  if (node.type === 'capability') {
    const capability = model.capabilities[node.label];
    if (capability?.operates_on) {
      relationships.push({ type: 'Operates on', items: capability.operates_on });
    }
    if (capability?.composes) {
      relationships.push({ type: 'Composes', items: capability.composes });
    }
  }
  if (node.type === 'aspect') {
    const aspect = model.aspects[node.label];
    if (aspect?.applies_to?.capabilities) {
      relationships.push({ type: 'Applies to', items: aspect.applies_to.capabilities });
    }
  }

  const typeColors = {
    domain: 'text-emerald-400',
    capability: 'text-blue-400',
    aspect: 'text-purple-400',
  };

  return (
    <>
      <div className="w-[450px] bg-gray-900 border-l border-gray-800 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-gradient-to-br from-gray-800/50 to-gray-900">
          <div className="flex items-start justify-between mb-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              {node.type}
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 className={`text-2xl font-bold ${typeColors[node.type]} mb-2`}>
            {node.label}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">{node.description}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Relationships */}
          {relationships.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Relationships
              </h3>
              <div className="space-y-3">
                {relationships.map((rel, i) => (
                  <div key={i}>
                    <div className="text-xs text-gray-500 mb-1">{rel.type}:</div>
                    <div className="flex flex-wrap gap-2">
                      {rel.items.map((item) => (
                        <span
                          key={item}
                          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded-md border border-gray-700 transition-colors"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decisions */}
          {decisions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Decisions
              </h3>
              <div className="space-y-3">
                {decisions.map((decision) => (
                  <div key={decision.id} className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                    <div className="font-medium text-yellow-400 mb-2">{decision.what}</div>
                    <div className="text-sm text-gray-400 mb-2">{decision.why}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(decision.when).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {node.files && node.files.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Files ({node.files.length})
              </h3>
              <div className="space-y-2">
                {node.files.map((file) => (
                  <button
                    key={file}
                    onClick={() => setSelectedFile(file)}
                    className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-lg flex items-center justify-between group transition-all"
                  >
                    <span className="text-sm text-gray-300 font-mono truncate">{file}</span>
                    <svg
                      className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Code Viewer Modal */}
      {selectedFile && (
        <CodeViewer file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}
    </>
  );
}
