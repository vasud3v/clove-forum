import { memo } from 'react';
import { MessageCircle } from 'lucide-react';

interface ReplyCountBadgeProps {
  count: number;
}

const ReplyCountBadge = memo(({ count }: ReplyCountBadgeProps) => {
  if (count === 0 || count < 0) return null;

  const displayCount = count > 999 ? '999+' : count.toString();

  return (
    <div 
      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-forum-pink/10 border border-forum-pink/30"
      title={`${count} ${count === 1 ? 'reply' : 'replies'}`}
      aria-label={`${count} ${count === 1 ? 'reply' : 'replies'}`}
    >
      <MessageCircle size={9} className="text-forum-pink" />
      <span className="text-[9px] font-mono font-bold text-forum-pink">
        {displayCount}
      </span>
    </div>
  );
});

ReplyCountBadge.displayName = 'ReplyCountBadge';

export default ReplyCountBadge;
