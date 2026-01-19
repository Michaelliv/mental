import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <AnimatePresence>
      <motion.div
        className="w-[500px] bg-gray-900 border-l border-gray-800 flex flex-col"
        initial={{ x: 500 }}
        animate={{ x: 0 }}
        exit={{ x: 500 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                {node.type}
              </div>
              <h2 className="text-2xl font-bold">{node.label}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-gray-400 mt-2">{node.description}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Relationships */}
          {relationships.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Relationships</h3>
              {relationships.map((rel, i) => (
                <div key={i} className="mb-2">
                  <div className="text-xs text-gray-500">{rel.type}:</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {rel.items.map((item) => (
                      <span
                        key={item}
                        className="px-2 py-1 bg-gray-800 text-sm rounded"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Decisions */}
          {decisions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Decisions</h3>
              <div className="space-y-3">
                {decisions.map((decision) => (
                  <div key={decision.id} className="bg-gray-800 rounded p-3">
                    <div className="font-medium text-yellow-400">{decision.what}</div>
                    <div className="text-sm text-gray-400 mt-1">{decision.why}</div>
                    <div className="text-xs text-gray-500 mt-2">
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
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Files</h3>
              <div className="space-y-1">
                {node.files.map((file) => (
                  <button
                    key={file}
                    onClick={() => setSelectedFile(file)}
                    className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm flex items-center justify-between group transition-colors"
                  >
                    <span className="text-gray-300">{file}</span>
                    <svg
                      className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Code Viewer Modal */}
        {selectedFile && (
          <CodeViewer file={selectedFile} onClose={() => setSelectedFile(null)} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
