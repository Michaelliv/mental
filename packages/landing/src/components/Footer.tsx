export function Footer() {
  return (
    <footer className="py-12 px-6 bg-dotted">
      <div className="max-w-4xl mx-auto">
        {/* Links */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <a
            href="https://github.com/Michaelliv/mental"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-cream-60 hover:text-cream transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://github.com/Michaelliv/mental#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-cream-60 hover:text-cream transition-colors"
          >
            Documentation
          </a>
          <a
            href="https://x.com/micLivs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-cream-60 hover:text-cream transition-colors"
          >
            @micLivs
          </a>
        </div>

        {/* Glyphs */}
        <div className="flex items-center justify-center gap-6">
          <span className="glyph glyph-domain text-sm opacity-60">□</span>
          <span className="glyph glyph-capability text-sm opacity-60">◇</span>
          <span className="glyph glyph-aspect text-sm opacity-60">○</span>
        </div>
      </div>
    </footer>
  );
}
