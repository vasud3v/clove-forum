import { memo } from 'react';
import { Circle } from 'lucide-react';

interface UnreadReplyIndicatorProps {
  count: number;
  onClick?: () => void;
}

const UnreadReplyIndicator = memo(({ count, onClick }: UnreadReplyIndicatorProps) => {
  if (count === 0 || count < 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-forum-pink/10 border border-forum-pink/30 hover:bg-forum-pink/20 transition-colors disabled:cursor-default"
      title={`${count} unread ${count === 1 ? 'reply' : 'replies'}`}
      aria-label={`${count} unread ${count === 1 ? 'reply' : 'replies'}`}
    >
      <Circle size={8} className="text-forum-pink fill-forum-pink animate-pulse" />
      <span className="text-[10px] font-mono font-bold text-forum-pink">
        {displayCount} new
      </span>
    </button>
  );
});

UnreadReplyIndicator.displayName = 'UnreadReplyIndicator';

export default UnreadReplyIndicator;
