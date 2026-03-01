import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Wrench,
  Rocket,
  Newspaper,
  Shield,
  TrendingUp,
  Pin,
  Lock,
  LucideProps,
  Flame,
  Sparkles,
  Star,
} from 'lucide-react';
import { Category } from '@/types/forum';

const iconMap: Record<string, React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>> = {
  MessageSquare,
  Wrench,
  Rocket,
  Newspaper,
  Shield,
};

interface CategoryCardProps {
  category: Category;
}

// Helper function to determine category badges
function getCategoryBadges(category: Category) {
  const badges: Array<{ label: string; icon: JSX.Element; color: string; bgGlow: string }> = [];
  
  // Hot: High activity in last 24 hours (more than 50 posts)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentActivity = new Date(category.lastActivity).getTime() > oneDayAgo;
  const isHot = recentActivity && category.postCount > 50;
  
  // Trending: Growing fast (more than 20 threads)
  const isTrending = category.threadCount > 20 && recentActivity;
  
  // Popular: High thread count (more than 100 threads)
  const isPopular = category.threadCount > 100;
  
  // New: Created in last 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const isNew = new Date(category.lastActivity).getTime() > sevenDaysAgo && category.threadCount < 10;
  
  if (isHot) {
    badges.push({
      label: 'Hot',
      icon: <Flame size={11} className="animate-pulse" />,
      color: 'bg-gradient-to-r from-orange-500/15 to-red-500/15 border-orange-500/40 text-orange-400',
      bgGlow: 'shadow-[0_0_12px_rgba(251,146,60,0.3)]'
    });
  }
  
  if (isTrending && !isHot) {
    badges.push({
      label: 'Trending',
      icon: <TrendingUp size={11} />,
      color: 'bg-gradient-to-r from-emerald-500/15 to-green-500/15 border-emerald-500/40 text-emerald-400',
      bgGlow: 'shadow-[0_0_12px_rgba(52,211,153,0.3)]'
    });
  }
  
  if (isPopular && !isHot && !isTrending) {
    badges.push({
      label: 'Popular',
      icon: <Star size={11} className="fill-current" />,
      color: 'bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border-blue-500/40 text-blue-400',
      bgGlow: 'shadow-[0_0_12px_rgba(59,130,246,0.3)]'
    });
  }
  
  if (isNew) {
    badges.push({
      label: 'New',
      icon: <Sparkles size={11} className="animate-pulse" />,
      color: 'bg-gradient-to-r from-purple-500/15 to-pink-500/15 border-purple-500/40 text-purple-400',
      bgGlow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]'
    });
  }
  
  return badges;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const Icon = iconMap[category.icon] || MessageSquare;
  const badges = getCategoryBadges(category);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  const latestThread = category.threads?.[0];

  return (
    <div className="hud-panel overflow-hidden">
      {/* Category Header */}
      <div className="bg-gradient-to-r from-forum-card to-forum-bg border-b border-forum-border px-4 py-2.5 flex items-center justify-between">
        <h2 className="text-[11px] font-bold text-forum-text font-mono uppercase tracking-wider">
          {category.name}
        </h2>
        
        {/* Category Badges */}
        {badges.length > 0 && (
          <div className="flex items-center gap-2">
            {badges.map((badge, index) => (
              <span
                key={index}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[9px] font-mono font-bold uppercase tracking-wider transition-all ${badge.color} ${badge.bgGlow}`}
              >
                {badge.icon}
                <span>{badge.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Category Row */}
      <Link
        to={`/category/${category.id}`}
        className="group transition-forum flex items-center gap-4 px-4 py-4 border-b border-forum-border/30 hover:bg-forum-hover"
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-forum-pink/20 to-forum-pink/5 border border-forum-pink/30 group-hover:border-forum-pink/50 transition-forum">
            <Icon size={20} className="text-forum-pink" />
          </div>
        </div>

        {/* Category Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-bold text-forum-text font-mono group-hover:text-forum-pink transition-forum mb-1">
            {category.name}
          </h3>
          <p className="text-[10px] text-forum-muted font-mono leading-relaxed">
            {category.description}
          </p>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-6 text-center">
          <div className="min-w-[70px]">
            <div className="text-[13px] font-bold text-forum-text font-mono">
              {category.threadCount.toLocaleString()}
            </div>
            <div className="text-[9px] text-forum-muted font-mono uppercase">Threads</div>
          </div>
          <div className="min-w-[70px]">
            <div className="text-[13px] font-bold text-forum-text font-mono">
              {category.postCount.toLocaleString()}
            </div>
            <div className="text-[9px] text-forum-muted font-mono uppercase">Posts</div>
          </div>
        </div>

        {/* Latest Post */}
        <div className="hidden lg:block min-w-[200px] max-w-[200px]">
          {latestThread ? (
            <div className="text-right">
              <Link
                to={`/thread/${latestThread.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-medium text-forum-text font-mono hover:text-forum-pink transition-forum line-clamp-1 mb-1"
              >
                {latestThread.title}
              </Link>
              <div className="flex items-center justify-end gap-1.5 text-[9px] text-forum-muted font-mono">
                <span>{formatTimeAgo(latestThread.lastReplyAt)}</span>
                <span>by</span>
                <span className="text-forum-pink">{latestThread.lastReplyBy.username}</span>
              </div>
            </div>
          ) : (
            <div className="text-[9px] text-forum-muted font-mono text-right">
              No posts yet
            </div>
          )}
        </div>
      </Link>

      {/* Thread List */}
      {category.threads && category.threads.length > 0 && (
        <div className="divide-y divide-forum-border/20">
          {category.threads.slice(0, 5).map((thread) => (
            <Link
              key={thread.id}
              to={`/thread/${thread.id}`}
              className="group transition-forum flex items-center gap-3 px-4 py-3 hover:bg-forum-hover/50"
            >
              {/* Thread Status Icons */}
              <div className="flex-shrink-0 flex items-center gap-1">
                {thread.isPinned && (
                  <Pin size={12} className="text-forum-pink" fill="currentColor" />
                )}
                {thread.isLocked && (
                  <Lock size={12} className="text-forum-muted" />
                )}
                {thread.isHot && (
                  <TrendingUp size={12} className="text-orange-400" />
                )}
                {!thread.isPinned && !thread.isLocked && !thread.isHot && (
                  <MessageSquare size={12} className="text-forum-muted" />
                )}
              </div>

              {/* Thread Info */}
              <div className="flex-1 min-w-0">
                <h5 className="text-[11px] font-medium text-forum-text font-mono group-hover:text-forum-pink transition-forum truncate mb-0.5">
                  {thread.title}
                </h5>
                <div className="flex items-center gap-2 text-[9px] text-forum-muted font-mono">
                  <span className="hover:text-forum-pink transition-forum">
                    {thread.author.username}
                  </span>
                  <span>•</span>
                  <span>{formatTimeAgo(thread.createdAt)}</span>
                </div>
              </div>

              {/* Thread Stats */}
              <div className="hidden sm:flex items-center gap-4 text-center">
                <div className="min-w-[50px]">
                  <div className="text-[11px] font-semibold text-forum-text font-mono">
                    {thread.replyCount}
                  </div>
                  <div className="text-[8px] text-forum-muted font-mono uppercase">Replies</div>
                </div>
                <div className="min-w-[50px]">
                  <div className="text-[11px] font-semibold text-forum-text font-mono">
                    {thread.viewCount}
                  </div>
                  <div className="text-[8px] text-forum-muted font-mono uppercase">Views</div>
                </div>
              </div>

              {/* Last Reply */}
              <div className="hidden md:block min-w-[120px] max-w-[120px] text-right">
                <div className="text-[9px] text-forum-muted font-mono">
                  {formatTimeAgo(thread.lastReplyAt)}
                </div>
                <div className="text-[9px] text-forum-pink font-mono truncate">
                  {thread.lastReplyBy.username}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
