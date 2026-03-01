import { ArrowUp } from 'lucide-react';
import { memo } from 'react';

interface ViewParentButtonProps {
  parentId: string;
  onViewParent: (parentId: string) => void;
}

const ViewParentButton = memo(({ parentId, onViewParent }: ViewParentButtonProps) => {
  const handleClick = () => {
    if (!parentId) {
      console.warn('ViewParentButton: parentId is empty');
      return;
    }
    onViewParent(parentId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded text-forum-muted hover:text-forum-pink hover:bg-forum-pink/10 transition-colors border border-forum-border/20"
      title="Jump to parent post"
      aria-label="View parent post"
    >
      <ArrowUp size={10} />
      <span className="hidden sm:inline">View Parent</span>
    </button>
  );
});

ViewParentButton.displayName = 'ViewParentButton';

export default ViewParentButton;
