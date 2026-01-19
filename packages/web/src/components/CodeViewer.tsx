import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { codeToHtml } from 'shiki';

interface CodeViewerProps {
  file: string;
  onClose: () => void;
}

export function CodeViewer({ file, onClose }: CodeViewerProps) {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Fetch file content
    fetch(`/api/file?path=${encodeURIComponent(file)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load file: ${res.statusText}`);
        return res.json();
      })
      .then(async (data: { content: string; language: string }) => {
        // Highlight with Shiki
        const highlighted = await codeToHtml(data.content, {
          lang: data.language || 'typescript',
          theme: 'github-dark',
        });
        setHtml(highlighted);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [file]);

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <span className="text-gray-300 font-mono text-sm">{file}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">Loading file...</div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-400">Error: {error}</div>
            </div>
          )}
          {html && (
            <div
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
