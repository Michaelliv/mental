import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { useScrollAnimation } from '../hooks';

interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  github: string;
}

const PROJECTS: Project[] = [
  { id: 'mental', name: 'mental', description: 'CLI for codebase mental models', url: 'https://michaelliv.github.io/mental/', github: 'https://github.com/Michaelliv/mental' },
  { id: 'dejavu', name: 'dejavu', description: 'CLI for Claude Code command history', url: 'https://michaelliv.github.io/cc-dejavu/', github: 'https://github.com/Michaelliv/cc-dejavu' },
  { id: 'psst', name: 'psst', description: 'CLI for AI-safe secrets injection', url: 'https://michaelliv.github.io/psst/', github: 'https://github.com/Michaelliv/psst' },
];

export function Visualization() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeProject, setActiveProject] = useState<string>('mental');
  const [loadedFrames, setLoadedFrames] = useState<Set<string>>(new Set());
  const [hasAnimated, setHasAnimated] = useState(false);

  const activeProjectData = PROJECTS.find((p) => p.id === activeProject)!;

  const handleFrameLoad = (projectId: string) => {
    setLoadedFrames((prev) => new Set([...prev, projectId]));
  };

  // Entrance animation
  useEffect(() => {
    if (!isVisible || hasAnimated) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHasAnimated(true);
      return;
    }

    anime({
      targets: containerRef.current,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 600,
      easing: 'easeOutQuad',
    });

    setHasAnimated(true);
  }, [isVisible, hasAnimated]);

  return (
    <section ref={ref} className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-wide text-cream-45 mb-2">
            Open Source Examples
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            See it in action
          </h2>
          <p className="text-cream-60 mt-3">
            Real GitHub projects, visualized with <code className="text-cream-45 bg-warm-elevated px-1.5 py-0.5 rounded text-xs">mental publish</code>
          </p>
        </div>

        {/* Container */}
        <div
          ref={containerRef}
          className="opacity-0 rounded-xl border border-border-default overflow-hidden shadow-lg bg-warm-deep"
        >
          {/* Project tabs */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle bg-warm-elevated">
            {PROJECTS.map((project) => (
              <button
                key={project.id}
                onClick={() => setActiveProject(project.id)}
                className={`group flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeProject === project.id
                    ? 'bg-warm-surface text-cream shadow-sm'
                    : 'text-cream-45 hover:text-cream-60 hover:bg-warm-surface/50'
                }`}
              >
                <span>{project.name}</span>
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`opacity-50 hover:opacity-100 transition-opacity ${
                    activeProject === project.id ? 'opacity-70' : ''
                  }`}
                  title={`View ${project.name} on GitHub`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </button>
            ))}
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-cream-45 hidden sm:block">
                {activeProjectData.description}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium">
                LIVE
              </span>
            </div>
          </div>

          {/* Iframe container */}
          <div className="relative h-[500px] bg-warm-deep">
            {/* Loading state */}
            {!loadedFrames.has(activeProject) && (
              <div className="absolute inset-0 flex items-center justify-center bg-warm-deep z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2">
                    <span className="glyph glyph-domain text-2xl animate-pulse">□</span>
                    <span className="glyph glyph-capability text-2xl animate-pulse" style={{ animationDelay: '0.1s' }}>◇</span>
                    <span className="glyph glyph-aspect text-2xl animate-pulse" style={{ animationDelay: '0.2s' }}>○</span>
                  </div>
                  <span className="text-sm text-cream-45">Loading {activeProjectData.name}...</span>
                </div>
              </div>
            )}

            {/* Iframes - render all but only show active */}
            {PROJECTS.map((project) => (
              <iframe
                key={project.id}
                src={project.url}
                title={`${project.name} mental model`}
                className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-200 ${
                  activeProject === project.id ? 'opacity-100 z-0' : 'opacity-0 -z-10'
                }`}
                onLoad={() => handleFrameLoad(project.id)}
              />
            ))}
          </div>

          {/* Footer with links */}
          <div className="px-4 py-3 border-t border-border-subtle bg-warm-elevated flex items-center justify-between">
            <span className="text-xs text-cream-28">
              Generated with <code className="text-cream-45">mental publish</code>
            </span>
            <div className="flex items-center gap-4">
              <a
                href={activeProjectData.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cream-45 hover:text-cream transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                View source
              </a>
              <a
                href={activeProjectData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cream-45 hover:text-cream transition-colors flex items-center gap-1"
              >
                Open full view
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
