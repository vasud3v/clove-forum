import { memo, useState, useEffect, useCallback } from 'react';
import { MessageSquarePlus } from 'lucide-react';

interface StickyReplyButtonProps {
  onClick: () => void;
}

const StickyReplyButton = memo(({ onClick }: StickyReplyButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = useCallback(() => {
    // Show button when scrolled down more than 300px
    const shouldShow = window.scrollY > 300;
    setIsVisible(shouldShow);
  }, []);

  useEffect(() => {
    // Throttle scroll events for better performance
    let ticking = false;
    
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    // Check initial scroll position
    handleScroll();
    
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [handleScroll]);

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-20 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full bg-forum-pink text-white shadow-lg hover:shadow-pink-glow transition-all hover:scale-105 active:scale-95 border border-forum-pink/50"
      title="Quick Reply"
      aria-label="Quick Reply"
    >
      <MessageSquarePlus size={18} />
      <span className="hidden sm:inline text-[11px] font-mono font-bold">
        Quick Reply
      </span>
    </button>
  );
});

StickyReplyButton.displayName = 'StickyReplyButton';

export default StickyReplyButton;
