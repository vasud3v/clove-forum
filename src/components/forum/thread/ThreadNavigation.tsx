import { ChevronsUp, ChevronsDown } from 'lucide-react';

interface ThreadNavigationProps {
  postCount: number;
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
}

export default function ThreadNavigation({
  postCount,
  onScrollToTop,
  onScrollToBottom,
}: ThreadNavigationProps) {
  return (
    <div className="hud-panel flex items-center justify-between px-4 py-2">
      <span className="text-[10px] font-mono text-forum-muted">
        <span className="text-forum-text font-semibold">{postCount}</span>{' '}
        posts in this thread
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onScrollToTop}
          className="transition-forum flex items-center gap-1  px-2 py-1 text-[9px] font-mono text-forum-muted border border-forum-border/30 hover:text-primary hover:border-primary/30"
          title="Jump to first post"
        >
          <ChevronsUp size={10} /> First
        </button>
        <button
          onClick={onScrollToBottom}
          className="transition-forum flex items-center gap-1  px-2 py-1 text-[9px] font-mono text-forum-muted border border-forum-border/30 hover:text-primary hover:border-primary/30"
          title="Jump to last post"
        >
          <ChevronsDown size={10} /> Last
        </button>
      </div>
    </div>
  );
}
