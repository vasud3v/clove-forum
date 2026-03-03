import { useState } from 'react';
import { Share2, X, Copy, Check, Link2, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadTitle: string;
  threadId: string;
}

export default function ShareModal({ isOpen, onClose, threadTitle, threadId }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/thread/${threadId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 "
        onClick={onClose}
      />
      <div className="relative hud-panel w-[400px] max-w-[90vw] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-forum-border/20">
          <span className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
            <Share2 size={13} className="text-primary" /> Share Thread
          </span>
          <button
            onClick={onClose}
            className="text-forum-muted hover:text-forum-text transition-forum"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-[11px] font-mono text-forum-muted line-clamp-2">
            {threadTitle}
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-forum-bg border border-forum-border/30  px-3 py-2 text-[10px] font-mono text-forum-text truncate">
              {url}
            </div>
            <button
              onClick={handleCopy}
              className={`transition-forum  px-3 py-2 text-[10px] font-mono font-semibold border ${copied
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                }`}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(threadTitle)}&url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-forum flex items-center justify-center gap-1.5  border border-forum-border/30 bg-forum-bg/50 py-2 text-[9px] font-mono text-forum-muted hover:text-primary hover:border-primary/30"
            >
              <ExternalLink size={10} /> Twitter/X
            </a>
            <a
              href={`https://reddit.com/submit?title=${encodeURIComponent(threadTitle)}&url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-forum flex items-center justify-center gap-1.5  border border-forum-border/30 bg-forum-bg/50 py-2 text-[9px] font-mono text-forum-muted hover:text-orange-700 hover:border-orange-500/30"
            >
              <ExternalLink size={10} /> Reddit
            </a>
            <button
              onClick={handleCopy}
              className="transition-forum flex items-center justify-center gap-1.5  border border-forum-border/30 bg-forum-bg/50 py-2 text-[9px] font-mono text-forum-muted hover:text-forum-text hover:border-forum-border/50"
            >
              <Link2 size={10} /> Copy Link
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">
              Embed Code
            </span>
            <div className="bg-forum-bg border border-forum-border/30  px-3 py-2 text-[9px] font-mono text-primary/80 break-all">
              {`<iframe src="${url}?embed=true" width="600" height="400" frameborder="0"></iframe>`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
