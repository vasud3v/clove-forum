import { memo, useRef, useState, useEffect } from 'react';
import { Reply } from 'lucide-react';

interface MobileReplySwipeProps {
  postId: string;
  onReply: (postId: string) => void;
  children: React.ReactNode;
}

const MobileReplySwipe = memo(({ postId, onReply, children }: MobileReplySwipeProps) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const swipeThreshold = 50;
  const maxSwipe = 80;

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || !isMobile) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Only allow left swipe (negative diff)
    if (diff < 0) {
      setSwipeX(Math.max(diff, -maxSwipe));
    } else {
      setSwipeX(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    
    setIsSwiping(false);
    
    // If swiped more than threshold, trigger reply
    if (swipeX < -swipeThreshold) {
      onReply(postId);
    }
    
    // Reset swipe with animation
    setSwipeX(0);
  };

  const handleTouchCancel = () => {
    if (!isMobile) return;
    setIsSwiping(false);
    setSwipeX(0);
  };

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden touch-pan-y">
      {/* Reply action revealed on swipe */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-20 bg-forum-pink flex items-center justify-center pointer-events-none"
        style={{
          transform: `translateX(${Math.abs(swipeX) < maxSwipe ? maxSwipe - Math.abs(swipeX) : 0}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
        }}
        aria-hidden="true"
      >
        <Reply size={20} className="text-white" />
      </div>

      {/* Swipeable content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
});

MobileReplySwipe.displayName = 'MobileReplySwipe';

export default MobileReplySwipe;
