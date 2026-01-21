import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { useScrollAnimation } from '../hooks';

export function Philosophy() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    anime({
      targets: '.philosophy-text',
      opacity: [0, 1],
      translateY: [30, 0],
      delay: anime.stagger(200),
      duration: 600,
      easing: 'easeOutQuad',
    });
  }, [isVisible]);

  return (
    <section ref={ref} className="py-24 px-6 bg-warm-surface">
      <div ref={contentRef} className="max-w-2xl mx-auto text-center">
        <h2
          className="philosophy-text opacity-0 text-2xl md:text-3xl font-semibold mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          You're the architect. Agents are your builders.
        </h2>

        <p className="philosophy-text opacity-0 text-cream-60 leading-relaxed mb-8">
          Agents are fast. Agents are capable. But speed without understanding is dangerous. You need to stay the architect — the one who truly knows the system.
        </p>

        <p className="philosophy-text opacity-0 text-cream-45 text-sm leading-relaxed">
          The mental model is permission to forget the details, because you can always look them up. It's how you scale your understanding alongside the code.
        </p>
      </div>
    </section>
  );
}
