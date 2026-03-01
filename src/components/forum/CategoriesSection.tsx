import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Wrench,
  Rocket,
  Newspaper,
  Shield,
  ChevronDown,
  Pin,
  Lock,
  Flame,
  Star,
  Eye,
  TrendingUp,
  Bell,
  BellOff,
  Search,
  Filter,
  Film,
  Tv,
  Music,
  Gamepad2,
  Book,
  Code,
  Heart,
  Camera,
  Sparkles,
  Zap,
  Trophy,
  Users,
  LucideProps,
} from 'lucide-react';
import { Category } from '@/types/forum';
import { useState } from 'react';

const iconMap: Record<string, React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>> = {
  MessageSquare,
  Wrench,
  Rocket,
  Newspaper,
  Shield,
  Film,
  Tv,
  Music,
  Gamepad2,
  Book,
  Code,
  Heart,
  Camera,
  Sparkles,
  Zap,
  Trophy,
  Users,
};

interface CategoriesSectionProps {
  categories: Category[];
}

export default function CategoriesSection({ categories }: CategoriesSectionProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map(c => c.id))
  );
  const [subscribedCategories, setSubscribedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'subscribed'>('all');

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleSubscription = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubscribedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const threadDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (threadDate.getTime() === today.getTime()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (threadDate.getTime() === yesterday.getTime()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const filteredCategories = categories.filter(category => {
    if (filterMode === 'subscribed' && !subscribedCategories.has(category.id)) {
      return false;
    }
    if (searchQuery) {
      return category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             category.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="hud-panel p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forum-muted" />
            <input
              type="text"
              placeholder="Search categories and topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-forum-bg border border-forum-border rounded-lg text-[12px] text-forum-text placeholder:text-forum-muted focus:outline-none focus:border-forum-pink/50 transition-forum"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[11px] font-medium transition-forum ${
                filterMode === 'all'
                  ? 'bg-forum-pink/20 text-forum-pink border border-forum-pink/30'
                  : 'bg-forum-card text-forum-muted border border-forum-border hover:border-forum-pink/30'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[11px] font-medium transition-forum ${
                filterMode === 'unread'
                  ? 'bg-forum-pink/20 text-forum-pink border border-forum-pink/30'
                  : 'bg-forum-card text-forum-muted border border-forum-border hover:border-forum-pink/30'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilterMode('subscribed')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[11px] font-medium transition-forum ${
                filterMode === 'subscribed'
                  ? 'bg-forum-pink/20 text-forum-pink border border-forum-pink/30'
                  : 'bg-forum-card text-forum-muted border border-forum-border hover:border-forum-pink/30'
              }`}
            >
              <Bell size={12} className="inline mr-1" />
              <span className="hidden sm:inline">Subscribed</span>
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      {filteredCategories.map((category) => {
        const Icon = iconMap[category.icon] || MessageSquare;
        const isExpanded = expandedCategories.has(category.id);
        const isSubscribed = subscribedCategories.has(category.id);
        const hasTopics = category.topics && category.topics.length > 0;
        // Always show topics, never threads directly in categories
        const displayItems = category.topics || [];

        return (
          <div key={category.id} className="hud-panel overflow-hidden">
            {/* Category Header */}
            <div className="flex items-center justify-between px-4 py-3 hover:bg-forum-hover/30 transition-forum">
              <button
                onClick={() => toggleCategory(category.id)}
                className="flex items-center gap-2 flex-1"
              >
                <div className="transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                  <ChevronDown size={14} className="text-forum-muted hover:text-forum-pink transition-forum" />
                </div>
                <h2 className="text-[13px] font-semibold text-forum-text font-sans uppercase tracking-wide">
                  {category.name}
                </h2>
                <span className="text-[10px] text-forum-muted">
                  ({category.threadCount} threads)
                </span>
              </button>

              {/* Category Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => toggleSubscription(category.id, e)}
                  className={`p-1.5 rounded-md transition-forum ${
                    isSubscribed
                      ? 'text-forum-pink bg-forum-pink/10 border border-forum-pink/30'
                      : 'text-forum-muted hover:text-forum-pink hover:bg-forum-hover border border-transparent'
                  }`}
                  title={isSubscribed ? 'Unsubscribe' : 'Subscribe to notifications'}
                >
                  {isSubscribed ? <Bell size={14} /> : <BellOff size={14} />}
                </button>
                <Link
                  to={`/category/${category.id}`}
                  className="p-1.5 rounded-md text-forum-muted hover:text-forum-pink hover:bg-forum-hover transition-forum"
                  title="View all threads"
                >
                  <Eye size={14} />
                </Link>
              </div>
            </div>

            {/* Topics/Threads List */}
            {isExpanded && displayItems.length > 0 && (
              <div className="divide-y divide-forum-border/20">
                {displayItems.map((item: any) => {
                  const isTopic = 'topics' in category && category.topics?.includes(item);
                  const isThread = !isTopic;
                  // For topics, use the latest thread info from the topic itself
                  const latestThread = isThread ? item : (item.latestThreadTitle ? {
                    id: item.latestThreadId,
                    title: item.latestThreadTitle,
                    lastReplyBy: { username: item.latestThreadAuthor, avatar: item.latestThreadAuthorAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.latestThreadAuthor },
                    lastReplyAt: item.lastActivity
                  } : null);
                  
                  // Thread status indicators
                  const isPinned = isThread && item.isPinned;
                  const isLocked = isThread && item.isLocked;
                  const isHot = isThread && item.isHot;
                  const isFeatured = isThread && item.isFeatured;
                  const hasUnread = isThread && item.hasUnread;

                  return (
                    <Link
                      key={item.id}
                      to={isTopic ? `/category/${category.id}/topic/${item.id}` : `/thread/${item.id}`}
                      className="group flex items-center gap-3 px-4 py-3 hover:bg-forum-hover/50 transition-forum relative"
                    >
                      {/* Unread Indicator */}
                      {hasUnread && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-forum-pink" />
                      )}

                      {/* Icon/Banner */}
                      <div className="flex-shrink-0 relative">
                        {isTopic && item.icon && (item.icon.startsWith('http') || item.icon.startsWith('/')) ? (
                          // Display as square icon for topics
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
                            <img 
                              src={item.icon} 
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                // Fallback to icon if image fails to load
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-forum-muted"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>';
                                }
                              }}
                            />
                          </div>
                        ) : (
                          // Display as square icon for threads or topics without images
                          <div className={`flex items-center justify-center rounded-lg transition-forum ${
                            hasUnread
                              ? 'text-forum-pink'
                              : 'text-forum-muted group-hover:text-forum-pink'
                          }`} style={{ width: '75px', height: '50px' }}>
                            {isTopic && item.icon && !item.icon.startsWith('http') && !item.icon.startsWith('/') ? (
                              // Lucide icon name
                              (() => {
                                const TopicIcon = iconMap[item.icon] || MessageSquare;
                                return <TopicIcon size={18} className="transition-forum" />;
                              })()
                            ) : (
                              <MessageSquare size={18} className="transition-forum" />
                            )}
                          </div>
                        )}
                        {/* Status Badge */}
                        {(isPinned || isLocked || isHot || isFeatured) && (
                          <div className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-forum-card border border-forum-border">
                            {isPinned && <Pin size={10} className="text-forum-pink" fill="currentColor" />}
                            {isLocked && <Lock size={10} className="text-forum-muted" />}
                            {isHot && <Flame size={10} className="text-orange-400" />}
                            {isFeatured && <Star size={10} className="text-yellow-400" fill="currentColor" />}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-[13px] font-medium transition-forum truncate ${
                            hasUnread ? 'text-forum-text font-semibold' : 'text-forum-text group-hover:text-forum-pink'
                          }`}>
                            {item.name || item.title}
                          </h3>
                          {item.badges && item.badges.length > 0 && (
                            <span className="flex-shrink-0 px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              {item.badges[0].label}
                            </span>
                          )}
                        </div>
                        {/* Only show description for topics, not threads */}
                        {!isThread && item.description && (
                          <p className="text-[11px] text-forum-muted truncate">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-6 text-center">
                        <div className="min-w-[60px]">
                          <div className="text-[10px] text-forum-muted font-medium mb-0.5">Threads</div>
                          <div className="text-[13px] font-semibold text-forum-text">
                            {isTopic ? item.threadCount : item.replyCount || 0}
                          </div>
                        </div>
                        <div className="h-8 w-px bg-forum-border"></div>
                        <div className="min-w-[60px]">
                          <div className="text-[10px] text-forum-muted font-medium mb-0.5">Posts</div>
                          <div className="text-[13px] font-semibold text-forum-text">
                            {formatCount(isTopic ? item.postCount : item.viewCount || 0)}
                          </div>
                        </div>
                      </div>

                      {/* Latest Activity */}
                      <div className="hidden lg:flex items-center gap-3 min-w-[280px] max-w-[280px]">
                        {(latestThread || isThread) && (
                          <>
                            <img
                              src={
                                isThread 
                                  ? (item.thumbnail || item.author.avatar) 
                                  : (latestThread?.lastReplyBy?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default')
                              }
                              alt=""
                              className="h-8 w-8 rounded-full flex-shrink-0 border border-forum-border"
                            />
                            <div className="flex-1 min-w-0">
                              <div
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.location.href = `/thread/${isThread ? item.id : latestThread?.id}`;
                                }}
                                className="text-[11px] font-medium text-forum-text hover:text-forum-pink transition-forum line-clamp-1 mb-0.5 cursor-pointer"
                              >
                                {isThread ? item.title : latestThread?.title || 'No posts yet'}
                              </div>
                              <div className="text-[10px] text-forum-muted">
                                {formatTimeAgo(isThread ? item.lastReplyAt : latestThread?.lastReplyAt || item.lastActivity)} · {' '}
                                <span className="text-forum-text hover:text-forum-pink transition-forum">
                                  {isThread ? item.lastReplyBy?.username : latestThread?.lastReplyBy?.username || item.lastPostBy || 'Unknown'}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div className="hud-panel p-8 text-center">
          <Filter size={32} className="mx-auto mb-3 text-forum-muted" />
          <h3 className="text-[13px] font-semibold text-forum-text mb-1">No categories found</h3>
          <p className="text-[11px] text-forum-muted">
            {searchQuery ? 'Try adjusting your search query' : 'No categories match your filters'}
          </p>
        </div>
      )}
    </div>
  );
}
