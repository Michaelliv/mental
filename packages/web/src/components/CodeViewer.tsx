import { useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { codeToHtml } from 'shiki';

interface CodeViewerProps {
  file: string;
  onClose: () => void;
}

interface FileData {
  content: string;
  language: string;
}

const fetcher = async (url: string): Promise<FileData> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load file: ${res.statusText}`);
  return res.json();
};

export function CodeViewer({ file, onClose }: CodeViewerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const { data, error, isLoading } = useSWR<FileData>(
    `/api/file?path=${encodeURIComponent(file)}`,
    fetcher
  );

  const { data: html } = useSWR(
    data ? ['highlight', file, data.content] : null,
    async () => {
      if (!data) return '';
      return codeToHtml(data.content, {
        lang: data.language || 'typescript',
        theme: 'github-dark',
      });
    }
  );

  // Focus trap and keyboard handling
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    // Simple focus trap - keep focus within dialog
    if (e.key === 'Tab' && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }, [onClose]);

  useEffect(() => {
    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    // Add keyboard listener
    document.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [handleKeyDown]);

  const modalLabelId = 'code-viewer-title';

  return (
    <div
      className="fixed inset-0 bg-cream/60 flex items-center justify-center z-50 motion-safe:animate-fade-in backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalLabelId}
        className="bg-warm-surface rounded-lg shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col border border-border-default motion-safe:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-warm-elevated">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-capability/10 rounded-lg">
              <svg
                className="w-5 h-5 text-capability"
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
            <h2 id={modalLabelId} className="text-cream-75 font-mono text-sm font-medium">{file}</h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close code viewer"
            className="text-cream-45 hover:text-cream transition-colors p-2 hover:bg-warm-deep rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/30"
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

        {/* Content - keeping dark for code readability */}
        <div className="flex-1 overflow-auto p-6 bg-gray-950 rounded-b-lg">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-3 text-gray-400">
                <div className="w-5 h-5 border-2 border-gray-600 border-t-capability rounded-full animate-spin" aria-hidden="true" />
                <span>Loading file&hellip;</span>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full" role="alert">
              <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-6 py-4">
                <div className="font-semibold mb-1">Error</div>
                <div className="text-sm">{error.message}</div>
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
