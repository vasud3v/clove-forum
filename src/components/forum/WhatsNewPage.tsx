import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ForumHeader from '@/components/forum/ForumHeader';
import ThreadRow from '@/components/forum/ThreadRow';
import SortControls from '@/components/forum/SortControls';
import ForumPagination from '@/components/forum/ForumPagination';
import SidebarStatsPanel from '@/components/forum/SidebarStatsPanel';
import OnlineUsers from '@/components/forum/OnlineUsers';
import PopularTags from '@/components/forum/PopularTags';
import NewThreadModal from '@/components/forum/NewThreadModal';
import { useForumContext } from '@/context/ForumContext';
import { SortOption } from '@/types/forum';
import {
  Home as HomeIcon,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Clock,
  Flame,
  TrendingUp,
} from 'lucide-react';

type WhatsNewFilter = 'recent' | 'trending' | 'today';

export default function WhatsNewPage() {
  const navigate = useNavigate();
  const { forumStats, currentUser, getAllThreads, getCategory, pageSize } = useForumContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [filter, setFilter] = useState<WhatsNewFilter>('recent');
  const [currentPage, setCurrentPage] = useState(1);

  const allThreads = useMemo(() => getAllThreads(), [getAllThreads]);

  const filteredThreads = useMemo(() => {
    let threads = [...allThreads];

    // Apply what's new filter
    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      threads = threads.filter((t) => new Date(t.lastReplyAt) >= today || new Date(t.createdAt) >= today);
    } else if (filter === 'trending') {
      threads = threads.filter((t) => t.isHot || (t.trendingScore && t.trendingScore > 0));
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      threads = threads.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.author.username.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Apply sort
    switch (sortBy) {
      case 'views':
        threads.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'replies':
        threads.sort((a, b) => b.replyCount - a.replyCount);
        break;
      case 'latest':
      default:
        threads.sort((a, b) => new Date(b.lastReplyAt).getTime() - new Date(a.lastReplyAt).getTime());
        break;
    }

    return threads;
  }, [allThreads, filter, sortBy, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredThreads.length / pageSize));
  const paginatedThreads = filteredThreads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Ensure current page is valid when pageSize or filteredThreads changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const filterOptions: { key: WhatsNewFilter; label: string; icon: typeof Clock; count: number }[] = [
    { key: 'recent', label: 'Recent', icon: Clock, count: allThreads.length },
    { key: 'trending', label: 'Trending', icon: Flame, count: allThreads.filter((t) => t.isHot).length },
    { key: 'today', label: 'Today', icon: Sparkles, count: allThreads.filter((t) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(t.lastReplyAt) >= today || new Date(t.createdAt) >= today;
    }).length },
  ];

  return (
    <div className="min-h-screen bg-forum-bg">
      <ForumHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-4 pb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted">
          <HomeIcon size={11} className="text-primary" />
          <span
            className="text-forum-text hover:text-primary transition-forum cursor-pointer"
            onClick={() => navigate('/')}
          >
            Forums
          </span>
          <ChevronRight size={10} />
          <span className="text-forum-muted">What's New</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Page header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center  bg-primary/10 border border-primary/20">
                  <MessageSquare size={14} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-[16px] font-bold text-forum-text font-mono">
                    What's New
                  </h1>
                  <p className="text-[10px] text-forum-muted font-mono">
                    Latest activity across all categories
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp size={12} className="text-primary" />
                <span className="text-[10px] font-mono text-forum-muted">
                  {filteredThreads.length} threads
                </span>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 mb-3">
              {filterOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setFilter(opt.key);
                      setCurrentPage(1);
                    }}
                    className={`transition-forum flex items-center gap-1.5  px-3 py-1.5 text-[10px] font-mono font-medium ${
                      filter === opt.key
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-forum-muted hover:text-forum-text hover:bg-forum-hover border border-transparent'
                    }`}
                  >
                    <Icon size={11} />
                    {opt.label}
                    <span className="text-[8px] opacity-60">({opt.count})</span>
                  </button>
                );
              })}
            </div>

            {/* Sort controls */}
            <SortControls activeSort={sortBy} onSortChange={(s) => { setSortBy(s); setCurrentPage(1); }} />

            {/* Thread list */}
            <div className="space-y-1.5 mt-3">
              {paginatedThreads.length > 0 ? (
                paginatedThreads.map((thread) => {
                  const category = getCategory(thread.categoryId);
                  return (
                    <div key={thread.id}>
                      <ThreadRow thread={thread} />
                      {category && (
                        <div className="flex items-center gap-1.5 ml-14 -mt-0.5 mb-1">
                          <span className="text-[8px] font-mono text-forum-muted/40">in</span>
                          <button
                            onClick={() => navigate(`/category/${category.id}`)}
                            className="text-[8px] font-mono text-primary/60 hover:text-primary transition-forum"
                          >
                            {category.name}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center hud-panel px-6 py-16">
                  <MessageSquare size={40} className="text-primary mx-auto mb-3" />
                  <h3 className="text-[13px] font-bold text-forum-text font-mono mb-1">
                    No threads found
                  </h3>
                  <p className="text-[11px] text-forum-muted font-mono">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4">
                <ForumPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden w-[280px] flex-shrink-0 space-y-3 lg:block">
            <SidebarStatsPanel stats={forumStats} />
            <OnlineUsers />
            <PopularTags />
          </div>
        </div>
      </div>

      {/* New Thread Modal */}
      <NewThreadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
