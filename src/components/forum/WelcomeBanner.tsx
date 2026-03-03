import { useState } from 'react';
import { X, Zap, ExternalLink, Sparkles } from 'lucide-react';

export default function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden hud-panel border-primary/25">
      {/* Scanline overlay effect */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,45,146,0.1) 2px, rgba(255,45,146,0.1) 4px)',
          }}
        />
      </div>

      {/* Gradient background */}
      <div className="absolute inset-0 bg-primary via-transparent to-forum-pink/5" />

      <div className="relative flex items-center gap-4 px-5 py-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="flex h-11 w-11 items-center justify-center  bg-primary/15 border border-primary/25 shadow-brutal-sm">
            <Zap size={20} className="text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[13px] font-bold text-forum-text font-mono">
              <span className="text-primary text-glow-pink">v2.0</span> Forum Update Live!
            </h3>
            <span className="flex items-center gap-1  border border-forum-border bg-forum-bg/50 px-2 py-0.5 text-[8px] font-mono font-semibold uppercase tracking-wider text-forum-muted">
              <Sparkles size={8} />
              New
            </span>
          </div>
          <p className="text-[11px] text-forum-muted font-mono leading-relaxed">
            Enhanced thread search, real-time notifications, and a brand new cyberpunk theme. Check out the{' '}
            <a href="#" className="text-primary hover:text-primary/80 transition-forum inline-flex items-center gap-0.5">
              changelog <ExternalLink size={9} />
            </a>
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 transition-forum  p-1.5 text-forum-muted hover:bg-forum-hover hover:text-primary"
        >
          <X size={14} />
        </button>
      </div>

      {/* Bottom accent bar */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-forum-pink/40 to-transparent" />
    </div>
  );
}
