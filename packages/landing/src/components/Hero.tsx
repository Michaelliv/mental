import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';

export function Hero() {
  const glyphsRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check for reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const timeline = anime.timeline({
      easing: 'easeOutQuad',
    });

    // Glyphs drop in with anticipation and overshoot
    timeline.add({
      targets: '.hero-glyph',
      translateY: [-80, 8, 0],
      opacity: [0, 1, 1],
      scale: [0.3, 1.15, 1],
      rotate: ['-15deg', '5deg', '0deg'],
      delay: anime.stagger(150),
      duration: 800,
      easing: 'easeOutElastic(1, 0.6)',
    });

    // Tagline fades up with slight overshoot
    timeline.add({
      targets: taglineRef.current,
      translateY: [40, -5, 0],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutBack',
    }, '-=400');

    // Subtitle fades up
    timeline.add({
      targets: subtitleRef.current,
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 400,
    }, '-=300');

    // CTA pops in with squash and stretch
    timeline.add({
      targets: ctaRef.current,
      translateY: [30, 0],
      opacity: [0, 1],
      scaleX: [0.9, 1.03, 1],
      scaleY: [1.1, 0.97, 1],
      duration: 500,
      easing: 'easeOutBack',
    }, '-=200');

    // After entrance, start subtle floating animation on glyphs
    timeline.finished.then(() => {
      // Continuous gentle float for each glyph with different timing
      anime({
        targets: '.hero-glyph-domain',
        translateY: [0, -6, 0],
        rotate: [0, -3, 0],
        duration: 3000,
        easing: 'easeInOutSine',
        loop: true,
      });
      anime({
        targets: '.hero-glyph-capability',
        translateY: [0, -8, 0],
        rotate: [0, 4, 0],
        duration: 3500,
        easing: 'easeInOutSine',
        loop: true,
        delay: 500,
      });
      anime({
        targets: '.hero-glyph-aspect',
        translateY: [0, -5, 0],
        rotate: [0, -2, 0],
        duration: 2800,
        easing: 'easeInOutSine',
        loop: true,
        delay: 1000,
      });
    });

  }, []);

  // Glyph hover animation
  const handleGlyphHover = (e: React.MouseEvent<HTMLSpanElement>) => {
    anime.remove(e.currentTarget);
    anime({
      targets: e.currentTarget,
      scale: [1, 1.3, 1.15],
      rotate: ['0deg', '15deg', '-5deg', '0deg'],
      duration: 600,
      easing: 'easeOutElastic(1, 0.5)',
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('npm install -g @mentalmodel/cli');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-20 bg-dotted">
      <div className="max-w-3xl mx-auto text-center">
        {/* Glyphs */}
        <div ref={glyphsRef} className="flex items-center justify-center gap-8 mb-10">
          <span
            className="hero-glyph hero-glyph-domain glyph glyph-domain opacity-0 text-5xl cursor-pointer select-none"
            onMouseEnter={handleGlyphHover}
          >
            □
          </span>
          <span
            className="hero-glyph hero-glyph-capability glyph glyph-capability opacity-0 text-5xl cursor-pointer select-none"
            onMouseEnter={handleGlyphHover}
          >
            ◇
          </span>
          <span
            className="hero-glyph hero-glyph-aspect glyph glyph-aspect opacity-0 text-5xl cursor-pointer select-none"
            onMouseEnter={handleGlyphHover}
          >
            ○
          </span>
        </div>

        {/* Tagline */}
        <h1
          ref={taglineRef}
          className="opacity-0 text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Don't become a stranger<br />in your own codebase.
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="opacity-0 text-xl md:text-2xl text-cream-60 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Agents build fast. Stay the one who knows.
        </p>

        {/* CTA */}
        <div ref={ctaRef} className="opacity-0 flex flex-col items-center gap-4">
          <button
            onClick={handleCopy}
            className="group relative flex items-center gap-3 px-6 py-3 rounded-lg bg-warm-elevated border border-border-default hover:border-decision/50 transition-all card-lift"
          >
            <span className="text-decision font-mono text-sm">$</span>
            <code className="font-mono text-sm text-cream-75">
              npm install -g @mentalmodel/cli
            </code>
            <span className="text-cream-28 group-hover:text-cream-45 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </span>
          </button>
          <span className={`text-sm transition-opacity duration-300 ${copied ? 'text-decision opacity-100' : 'text-cream-28 opacity-0'}`}>
            Copied to clipboard
          </span>
        </div>
      </div>
    </section>
  );
}
