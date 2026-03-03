import { memo, useCallback } from 'react';
import { ChevronsDown } from 'lucide-react';

interface JumpToUnreadButtonProps {
  unreadCount: number;
  onJump: () => void;
}

const JumpToUnreadButton = memo(({ unreadCount, onJump }: JumpToUnreadButtonProps) => {
  if (unreadCount === 0) return null;

  return (
    <button
      onClick={onJump}
      className="fixed bottom-24 right-6 z-30 flex items-center gap-2 px-4 py-2.5  bg-primary text-white text-[11px] font-mono font-bold shadow-brutal hover:shadow-brutal-sm transition-all animate-bounce-subtle border border-primary/50"
      title={`Jump to ${unreadCount} unread ${unreadCount === 1 ? 'reply' : 'replies'}`}
    >
      <ChevronsDown size={14} />
      <span>{unreadCount} New</span>
    </button>
  );
});

JumpToUnreadButton.displayName = 'JumpToUnreadButton';

export default JumpToUnreadButton;
