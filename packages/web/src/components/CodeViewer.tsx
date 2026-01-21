import useSWR from 'swr';
import { codeToHtml } from 'shiki';
import { api, type FileContent } from '../lib/api';

interface CodeViewerProps {
  file: string;
  onClose: () => void;
}

const fetcher = async (path: string): Promise<FileContent> => {
  return api.getFile(path);
};

export function CodeViewer({ file, onClose }: CodeViewerProps) {
  const { data, error, isLoading } = useSWR<FileContent>(
    ['file', file],
    () => fetcher(file)
  );

  const { data: html } = useSWR(
    data ? ['highlight', file, data.content] : null,
    async () => {
      if (!data) return '';
      return codeToHtml(data.content, {
        lang: data.language || 'typescript',
        theme: 'github-light',
      });
    }
  );

  return (
    <div className="h-full flex flex-col bg-warm-surface">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border-subtle">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-capability/10 rounded-lg flex-shrink-0">
            <svg
              className="w-4 h-4 text-capability"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>
          <span className="text-cream-75 font-mono text-sm truncate">{file}</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close code viewer"
          className="text-cream-28 hover:text-cream-60 transition-colors p-2 hover:bg-warm-elevated rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
      <div className="flex-1 overflow-auto p-4 bg-warm-elevated">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3 text-cream-45">
              <div className="w-5 h-5 border-2 border-border-default border-t-capability rounded-full animate-spin" aria-hidden="true" />
              <span>Loading file…</span>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full" role="alert">
            <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-6 py-4 max-w-md">
              <div className="font-semibold mb-1">Unable to load file</div>
              <div className="text-sm text-red-300 mb-2">{error.message}</div>
              {api.isStaticMode() && (
                <div className="text-xs text-cream-45 mt-3 pt-3 border-t border-red-500/20">
                  This file is loaded from GitHub. It may not be available if the repository is private or the file was deleted.
                </div>
              )}
            </div>
          </div>
        )}
        {html && (
          <div
            className="text-sm leading-relaxed code-with-line-numbers [&_pre]:bg-warm-deep [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:border [&_pre]:border-border-subtle [&_pre]:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
