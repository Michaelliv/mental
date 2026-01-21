import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { useScrollAnimation } from '../hooks';

interface TerminalLine {
  command: string;
  output?: string;
}

const COMMANDS: TerminalLine[] = [
  { command: 'mental add domain Order --desc "A purchase transaction"', output: '✓ Added domain: Order' },
  { command: 'mental add capability Checkout --operates-on Order', output: '✓ Added capability: Checkout' },
  { command: 'mental add aspect Auth --applies-to Checkout', output: '✓ Added aspect: Auth' },
  { command: 'mental view', output: 'Opening visualization...' },
];

export function Terminal() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });
  const [displayedLines, setDisplayedLines] = useState<Array<{ command: string; output?: string; typing: boolean }>>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [showOutput, setShowOutput] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || hasStarted) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Show all lines immediately
      setDisplayedLines(COMMANDS.map((c) => ({ ...c, typing: false })));
      return;
    }

    setHasStarted(true);
    // Terminal entrance
    anime({
      targets: terminalRef.current,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 400,
      easing: 'easeOutQuad',
    });
  }, [isVisible, hasStarted]);

  // Typing effect
  useEffect(() => {
    if (!hasStarted || currentLine >= COMMANDS.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const command = COMMANDS[currentLine];

    // Start new line
    if (currentChar === 0 && !showOutput) {
      setDisplayedLines((prev) => {
        // Check if we already added this line
        if (prev.length > currentLine) return prev;
        return [...prev, { command: '', typing: true }];
      });
    }

    // Type next character
    if (currentChar < command.command.length) {
      const timeout = setTimeout(() => {
        setDisplayedLines((prev) => {
          const updated = [...prev];
          if (updated[currentLine]) {
            updated[currentLine] = {
              ...updated[currentLine],
              command: command.command.slice(0, currentChar + 1),
            };
          }
          return updated;
        });
        setCurrentChar((c) => c + 1);
      }, 30 + Math.random() * 20);
      return () => clearTimeout(timeout);
    }

    // Command complete, show output
    if (currentChar >= command.command.length && !showOutput) {
      const timeout = setTimeout(() => {
        setDisplayedLines((prev) => {
          const updated = [...prev];
          if (updated[currentLine]) {
            updated[currentLine] = {
              ...updated[currentLine],
              output: command.output,
              typing: false,
            };
          }
          return updated;
        });
        setShowOutput(true);
      }, 300);
      return () => clearTimeout(timeout);
    }

    // Move to next line
    if (showOutput) {
      const timeout = setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
        setShowOutput(false);
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [hasStarted, currentLine, currentChar, showOutput]);

  return (
    <section ref={ref} className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-wide text-cream-45 mb-2">
            The Solution
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            The map of your system
          </h2>
          <p className="text-cream-60 max-w-xl mx-auto">
            A CLI that captures what your codebase does — and why — as it evolves.
          </p>
        </div>

        {/* Terminal */}
        <div
          ref={terminalRef}
          className="opacity-0 bg-cream rounded-xl shadow-lg overflow-hidden"
        >
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-cream/90 border-b border-cream-28/30">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-aspect/60"></div>
              <div className="w-3 h-3 rounded-full bg-decision/60"></div>
              <div className="w-3 h-3 rounded-full bg-domain/60"></div>
            </div>
            <span className="text-xs text-warm-deep/60 font-mono ml-2">mental</span>
          </div>

          {/* Terminal content */}
          <div className="p-4 font-mono text-sm bg-cream text-warm-deep min-h-[200px]">
            {displayedLines.map((line, i) => (
              <div key={i} className="mb-2">
                <div className="flex items-start gap-2">
                  <span className="text-domain select-none">$</span>
                  <span>
                    {line.command}
                    {line.typing && <span className="cursor bg-warm-deep/75"></span>}
                  </span>
                </div>
                {line.output && (
                  <div className="ml-4 text-warm-deep/60 mt-1">{line.output}</div>
                )}
              </div>
            ))}
            {currentLine >= COMMANDS.length && (
              <div className="flex items-center gap-2">
                <span className="text-domain">$</span>
                <span className="cursor bg-warm-deep/75"></span>
              </div>
            )}
          </div>
        </div>

        {/* Feature list */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
          {[
            { glyph: '□', label: 'Domains', desc: 'The nouns', color: 'domain' },
            { glyph: '◇', label: 'Capabilities', desc: 'The verbs', color: 'capability' },
            { glyph: '○', label: 'Aspects', desc: 'Cross-cutting', color: 'aspect' },
            { glyph: '⚡', label: 'Decisions', desc: 'The why', color: 'decision' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <span className={`glyph glyph-${item.color} text-2xl`}>{item.glyph}</span>
              <div className="font-medium text-cream mt-1">{item.label}</div>
              <div className="text-xs text-cream-45">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
