import { Flame, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForumContext } from '@/context/ForumContext';
import { useEffect, useState } from 'react';

export default function TrendingTicker() {
  const navigate = useNavigate();
  const { getAllThreads } = useForumContext();
  const [hotThreads, setHotThreads] = useState<any[]>([]);

  useEffect(() => {
    const updateHotThreads = () => {
      const allThreads = getAllThreads();
      const trending = allThreads
        .filter((t) => t.isHot || t.viewCount > 100)
        .sort((a, b) => {
          // Sort by combination of views and recent activity
          const scoreA = b.viewCount + (b.replyCount * 10);
          const scoreB = a.viewCount + (a.replyCount * 10);
          return scoreB - scoreA;
        })
        .slice(0, 8);
      
      setHotThreads(trending);
    };

    updateHotThreads();

    // Update every 30 seconds
    const interval = setInterval(updateHotThreads, 30000);

    return () => clearInterval(interval);
  }, [getAllThreads]);

  if (hotThreads.length === 0) {
    return (
      <div className="hud-panel overflow-hidden">
        <div className="flex items-stretch">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-forum-pink/10 to-orange-500/10 border-r border-forum-border px-4 py-2.5 flex-shrink-0 w-[140px]">
            <Flame size={12} className="text-orange-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider whitespace-nowrap">
              Trending
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 py-2.5">
            <span className="text-[10px] font-mono text-forum-muted">
              No trending threads yet
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hud-panel overflow-hidden">
      <div className="flex items-stretch">
        {/* Label */}
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-forum-pink/10 to-orange-500/10 border-r border-forum-border px-4 py-2.5 flex-shrink-0 w-[140px]">
          <Flame size={12} className="text-orange-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider whitespace-nowrap">
            Trending
          </span>
        </div>

        {/* Scrolling content */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center gap-6 px-4 py-2.5 animate-scroll-ticker">
            {[...hotThreads, ...hotThreads].map((thread, idx) => (
              <button
                key={`${thread.id}-${idx}`}
                onClick={() => navigate(`/thread/${thread.id}`)}
                className="flex items-center gap-2 whitespace-nowrap group transition-all duration-200 hover:scale-105"
              >
                {thread.isHot && (
                  <Flame size={10} className="text-orange-400 flex-shrink-0" />
                )}
                <span className="text-[11px] font-mono text-forum-text group-hover:text-forum-pink transition-colors">
                  {thread.title.length > 50 ? thread.title.slice(0, 50) + '...' : thread.title}
                </span>
                <span className="text-[9px] font-mono text-forum-muted/60 flex items-center gap-0.5">
                  <ArrowRight size={8} />
                  {thread.viewCount.toLocaleString()} views
                </span>
              </button>
            ))}
          </div>
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-forum-card to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-forum-card to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </div>
  );
}
