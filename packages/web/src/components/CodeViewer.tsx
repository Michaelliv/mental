import { useEffect, useState } from 'react';
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
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col border border-gray-700 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gradient-to-br from-gray-800/50 to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
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
            </div>
            <span className="text-gray-300 font-mono text-sm font-medium">{file}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="flex-1 overflow-auto p-6 bg-[#0d1117]">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-3 text-gray-400">
                <div className="w-5 h-5 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin"></div>
                <span>Loading file...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-6 py-4">
                <div className="font-semibold mb-1">Error</div>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          )}
          {html && (
            <div
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
