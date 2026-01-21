import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { useScrollAnimation } from '../hooks';

export function Problem() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
  const quoteRef = useRef<HTMLQuoteElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timeline = anime.timeline({
      easing: 'easeOutQuad',
    });

    // Quote slides in from left with ochre border
    timeline.add({
      targets: quoteRef.current,
      opacity: [0, 1],
      translateX: [-30, 0],
      duration: 600,
    });

    // Text paragraphs stagger in
    timeline.add({
      targets: '.problem-text',
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(150),
      duration: 400,
    }, '-=300');

  }, [isVisible]);

  return (
    <section ref={ref} className="py-20 px-6 bg-warm-surface">
      <div className="max-w-2xl mx-auto">
        {/* Section header */}
        <p className="text-sm uppercase tracking-wide text-cream-45 mb-8">
          The Problem
        </p>

        {/* Pull quote */}
        <blockquote
          ref={quoteRef}
          className="opacity-0 pl-6 border-l-4 border-decision mb-10"
        >
          <p
            className="text-xl md:text-2xl italic text-cream-75 leading-relaxed"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            "I approved that PR but I have no idea what it actually does."
          </p>
        </blockquote>

        {/* Explanation */}
        <div ref={textRef} className="space-y-6 text-cream-75 leading-relaxed">
          <p className="problem-text opacity-0">
            When <strong className="text-cream">you</strong> write code, understanding comes free. You know what's there because you put it there.
          </p>

          <p className="problem-text opacity-0">
            When <strong className="text-cream">agents</strong> write code, the code appears — but the understanding doesn't transfer. You read it, you approve it, you ship it. But you didn't <em>build</em> it.
          </p>

          <p className="problem-text opacity-0">
            Slowly, you become a stranger in your own codebase. A rubber stamp for the machine.
          </p>

          <p className="problem-text opacity-0 text-cream-60">
            The <span className="text-domain">□</span>&nbsp;domains, <span className="text-capability">◇</span>&nbsp;capabilities, and <span className="text-aspect">○</span>&nbsp;aspects you would have internalized? Missing.
          </p>
        </div>
      </div>
    </section>
  );
}
