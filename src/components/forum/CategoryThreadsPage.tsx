import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ForumHeader from '@/components/forum/ForumHeader';
import ThreadRow from '@/components/forum/ThreadRow';
import SortControls from '@/components/forum/SortControls';
import FilterDropdown from '@/components/forum/FilterDropdown';
import ForumPagination from '@/components/forum/ForumPagination';
import RecentActivityFeed from '@/components/forum/RecentActivityFeed';
import ForumRules from '@/components/forum/ForumRules';
import SelectTopicModal from '@/components/forum/SelectTopicModal';
import { useForumContext } from '@/context/ForumContext';
import { SortOption, FilterOption } from '@/types/forum';
import {
  Home as HomeIcon,
  ChevronRight,
  MessageSquare,
  Wrench,
  Rocket,
  Newspaper,
  Shield,
  LucideProps,
  ArrowLeft,
  Flame,
  Pin,
  Lock,
  Eye,
  MessageCircle,
  Clock,
  Users,
  Hash,
  SearchX,
  Construction,
  Plus,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

const iconMap: Record<string, React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>> = {
  MessageSquare,
  Wrench,
  Rocket,
  Newspaper,
  Shield,
};

const SORT_STORAGE_KEY = 'forum-sort-preference';

function getSavedSort(): SortOption {
  try {
    const saved = localStorage.getItem(SORT_STORAGE_KEY);
    if (saved === 'latest' || saved === 'views' || saved === 'replies') {
      return saved;
    }
  } catch {
    // localStorage may be unavailable
  }
  return 'latest';
}

export default function CategoryThreadsPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { categories, forumStats, currentUser, pageSize, setPageSize, availablePageSizes, getUserProfile } = useForumContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState<SortOption>(getSavedSort);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const threadListRef = useRef<HTMLDivElement>(null);

  // Persist sort preference to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SORT_STORAGE_KEY, activeSort);
    } catch {
      // localStorage may be unavailable
    }
  }, [activeSort]);

  const activeTopic = searchParams.get('topic');

  const category = categories.find((c) => c.id === categoryId);

  const filteredThreads = useMemo(() => {
    if (!category) return [];
    let threads = [...category.threads];

    // Topic filter
    if (activeTopic) {
      threads = threads.filter((t) => t.topicId === activeTopic);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      threads = threads.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.author.username.toLowerCase().includes(query) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }

    // Category filter
    if (activeFilter === 'trending') {
      threads = threads.filter((t) => t.isHot);
    } else if (activeFilter === 'unanswered') {
      threads = threads.filter((t) => t.replyCount === 0);
    } else if (activeFilter === 'my-threads') {
      threads = threads.filter((t) => t.author.id === currentUser.id);
    }

    // Sort
    threads.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      switch (activeSort) {
        case 'views':
          return b.viewCount - a.viewCount;
        case 'replies':
          return b.replyCount - a.replyCount;
        case 'latest':
        default:
          return new Date(b.lastReplyAt).getTime() - new Date(a.lastReplyAt).getTime();
      }
    });

    return threads;
  }, [category, searchQuery, activeSort, activeFilter, activeTopic, currentUser.id]);

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

  // Smooth page change handler with scroll-to-top transition
  const handlePageChange = (page: number) => {
    if (page === currentPage) return;
    setIsTransitioning(true);
    // Brief fade-out, then change page & scroll
    setTimeout(() => {
      setCurrentPage(page);
      setIsTransitioning(false);
      if (threadListRef.current) {
        threadListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    const firstVisibleIndex = (currentPage - 1) * pageSize;
    setPageSize(newSize);
    // Calculate what page the first visible item would be on with new page size
    const newPage = Math.max(1, Math.floor(firstVisibleIndex / newSize) + 1);
    setCurrentPage(newPage);
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-forum-bg flex items-center justify-center">
        <div className="hud-panel px-10 py-12 text-center">
          <div className="text-[40px] mb-4"><Construction size={40} className="text-forum-pink mx-auto" /></div>
          <h2 className="text-[16px] font-bold text-forum-text font-mono mb-2">Category Not Found</h2>
          <p className="text-[12px] text-forum-muted font-mono mb-6">The category you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="transition-forum rounded bg-forum-pink px-5 py-2.5 text-[11px] font-mono font-semibold text-white hover:shadow-pink-glow active:scale-95 border border-forum-pink/50"
          >
            Back to Forums
          </button>
        </div>
      </div>
    );
  }

  const Icon = iconMap[category.icon] || MessageSquare;
  const activeTopicData = activeTopic ? category.topics?.find(t => t.id === activeTopic) : null;
  const pinnedCount = category.threads.filter((t) => t.isPinned).length;
  const hotCount = category.threads.filter((t) => t.isHot).length;
  const lockedCount = category.threads.filter((t) => t.isLocked).length;

  // Collect all unique tags from threads in this category
  const allTags = Array.from(
    new Set(category.threads.flatMap((t) => t.tags || []))
  );

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
          <HomeIcon size={11} className="text-forum-pink" />
          <span
            onClick={() => navigate('/')}
            className="text-forum-text hover:text-forum-pink transition-forum cursor-pointer"
          >
            Forums
          </span>
          <ChevronRight size={10} />
          <span
            onClick={() => { if (activeTopic) { setSearchParams({}); setCurrentPage(1); } }}
            className={`${activeTopic ? 'text-forum-text hover:text-forum-pink cursor-pointer' : 'text-forum-pink'} transition-forum`}
          >
            {category.name}
          </span>
          {activeTopicData && (
            <>
              <ChevronRight size={10} />
              <span className="text-forum-pink">{activeTopicData.name}</span>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 space-y-4">
        <div className="hud-panel overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-forum-card to-forum-bg/50" />
            <div className="relative flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-forum-bg border border-forum-border">
                  <Icon size={26} className="text-forum-text" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-[18px] font-bold text-forum-text font-mono mb-1">
                    {category.name}
                  </h1>
                  <p className="text-[12px] text-forum-muted font-mono leading-relaxed">
                    {category.description}
                  </p>
                </div>
              </div>

              {/* Quick Stats & Create Thread Button */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="transition-forum flex items-center gap-2 rounded-lg border border-forum-pink/40 bg-transparent px-4 py-2.5 text-[11px] font-mono font-semibold text-forum-pink hover:bg-forum-pink/10 hover:border-forum-pink/60 active:scale-95"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Create Thread</span>
                </button>
                <div className="h-8 w-[1px] bg-forum-border hidden sm:block" />
                <div className="text-center hidden sm:block">
                  <div className="text-[16px] font-bold text-forum-text font-mono">
                    {category.threadCount.toLocaleString()}
                  </div>
                  <div className="text-[8px] text-forum-muted font-mono uppercase tracking-wider">Threads</div>
                </div>
                <div className="h-8 w-[1px] bg-forum-border hidden sm:block" />
                <div className="text-center hidden sm:block">
                  <div className="text-[16px] font-bold text-forum-text font-mono">
                    {category.postCount.toLocaleString()}
                  </div>
                  <div className="text-[8px] text-forum-muted font-mono uppercase tracking-wider">Posts</div>
                </div>
              </div>
            </div>

            {/* Bottom accent */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-forum-pink/40 to-transparent" />
          </div>
        </div>

        {/* Mod-only notice for important categories */}
        {category.isImportant && (
          <div className="hud-panel px-4 py-3 flex items-center gap-3 border-amber-500/20 bg-amber-500/[0.04]">
            <Lock size={14} className="text-amber-400 flex-shrink-0" />
            <div>
              <span className="text-[11px] font-mono font-semibold text-amber-400">
                Moderator-Managed Section
              </span>
              <p className="text-[10px] font-mono text-forum-muted mt-0.5">
                This category is visible to all members. Only moderators and administrators can create or edit threads here.
              </p>
            </div>
          </div>
        )}

        {/* Category Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="hud-panel px-3 py-2.5 flex items-center gap-2.5 group hover:border-forum-pink/30 transition-forum hover:shadow-[0_0_12px_rgba(255,45,146,0.1)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-forum-pink/15 to-forum-pink/5 border border-forum-pink/25 group-hover:border-forum-pink/40 group-hover:badge-glow-pink transition-forum">
              <Pin size={13} className="text-forum-pink drop-shadow-[0_0_3px_rgba(255,45,146,0.4)]" />
            </div>
            <div>
              <div className="text-[13px] font-bold font-mono text-forum-text">{pinnedCount}</div>
              <div className="text-[7px] font-mono uppercase tracking-widest text-forum-muted/60">Pinned</div>
            </div>
          </div>
          <div className="hud-panel px-3 py-2.5 flex items-center gap-2.5 group hover:border-orange-500/30 transition-forum hover:shadow-[0_0_12px_rgba(249,115,22,0.1)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-500/25 group-hover:border-orange-500/40 transition-forum">
              <Flame size={13} className="text-orange-400 drop-shadow-[0_0_3px_rgba(249,115,22,0.4)]" />
            </div>
            <div>
              <div className="text-[13px] font-bold font-mono text-forum-text">{hotCount}</div>
              <div className="text-[7px] font-mono uppercase tracking-widest text-forum-muted/60">Hot</div>
            </div>
          </div>
          <div className="hud-panel px-3 py-2.5 flex items-center gap-2.5 group hover:border-amber-500/30 transition-forum hover:shadow-[0_0_12px_rgba(245,158,11,0.1)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/25 group-hover:border-amber-500/40 transition-forum">
              <Lock size={13} className="text-amber-400 drop-shadow-[0_0_3px_rgba(245,158,11,0.4)]" />
            </div>
            <div>
              <div className="text-[13px] font-bold font-mono text-forum-text">{lockedCount}</div>
              <div className="text-[7px] font-mono uppercase tracking-widest text-forum-muted/60">Locked</div>
            </div>
          </div>
          <div className="hud-panel px-3 py-2.5 flex items-center gap-2.5 group hover:border-cyan-500/30 transition-forum hover:shadow-[0_0_12px_rgba(34,211,238,0.1)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border border-cyan-500/25 group-hover:border-cyan-500/40 transition-forum">
              <Eye size={13} className="text-cyan-400 drop-shadow-[0_0_3px_rgba(34,211,238,0.4)]" />
            </div>
            <div>
              <div className="text-[13px] font-bold font-mono text-forum-text">
                {category.threads.reduce((sum, t) => sum + t.viewCount, 0).toLocaleString()}
              </div>
              <div className="text-[7px] font-mono uppercase tracking-widest text-forum-muted/60">Views</div>
            </div>
          </div>
        </div>

        {/* Tags bar */}
        {allTags.length > 0 && (
          <div className="hud-panel px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Hash size={12} className="text-forum-pink flex-shrink-0" />
              <span className="text-[9px] font-mono font-semibold text-forum-pink uppercase tracking-wider flex-shrink-0">Tags:</span>
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-sm border border-forum-pink/10 bg-forum-pink/[0.04] px-2 py-0.5 text-[9px] font-mono font-medium text-forum-pink/70 hover:bg-forum-pink/10 hover:text-forum-pink hover:border-forum-pink/25 transition-forum cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Topic filter bar */}
        {category.topics && category.topics.length > 0 && (
          <div className="hud-panel px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Hash size={12} className="text-forum-pink flex-shrink-0" />
              <span className="text-[9px] font-mono font-semibold text-forum-pink uppercase tracking-wider flex-shrink-0">Topics:</span>
              <button
                onClick={() => { setSearchParams({}); setCurrentPage(1); }}
                className={`rounded-sm border px-2 py-0.5 text-[9px] font-mono font-medium transition-forum cursor-pointer ${!activeTopic
                  ? 'border-forum-pink/40 bg-forum-pink/15 text-forum-pink'
                  : 'border-forum-pink/10 bg-forum-pink/[0.04] text-forum-pink/70 hover:bg-forum-pink/10 hover:text-forum-pink hover:border-forum-pink/25'
                  }`}
              >
                All Topics
              </button>
              {category.topics.map((topic) => {
                // Calculate topic badges
                const isHotTopic = topic.threadCount > 10 && topic.postCount > 50;
                const isTrendingTopic = topic.threadCount > 5 && topic.postCount > 20;
                const isNewTopic = topic.threadCount < 5;
                
                let badgeIcon = null;
                let badgeClass = '';
                
                if (isHotTopic) {
                  badgeIcon = <Flame size={10} className="animate-pulse" />;
                  badgeClass = 'text-orange-400';
                } else if (isTrendingTopic) {
                  badgeIcon = <TrendingUp size={10} />;
                  badgeClass = 'text-emerald-400';
                } else if (isNewTopic) {
                  badgeIcon = <Sparkles size={10} className="animate-pulse" />;
                  badgeClass = 'text-purple-400';
                }
                
                return (
                  <button
                    key={topic.id}
                    onClick={() => { setSearchParams({ topic: topic.id }); setCurrentPage(1); }}
                    className={`rounded-sm border px-2.5 py-1.5 text-[9px] font-mono font-medium transition-forum cursor-pointer flex flex-col items-start gap-0.5 ${activeTopic === topic.id
                      ? 'border-forum-pink/40 bg-forum-pink/15 text-forum-pink'
                      : 'border-forum-pink/10 bg-forum-pink/[0.04] text-forum-pink/70 hover:bg-forum-pink/10 hover:text-forum-pink hover:border-forum-pink/25'
                      }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {topic.icon && (
                        <img 
                          src={topic.icon} 
                          alt="" 
                          className="w-5 h-5 rounded object-contain flex-shrink-0"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                      )}
                      <span>{topic.name}</span>
                      {badgeIcon && (
                        <span className={badgeClass}>
                          {badgeIcon}
                        </span>
                      )}
                    </div>
                    {topic.latestThreadTitle && topic.latestThreadAuthor && (
                      <span className="text-[8px] text-forum-muted/60 font-normal truncate max-w-[200px]">
                        Latest: {topic.latestThreadTitle} by @{topic.latestThreadAuthor}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Forum Rules Panel — only shown on the Rules & Guidelines category */}
        {category.id === 'cat-moderators' && (
          <ForumRules />
        )}

        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Controls bar */}
            <div className="mb-3 hud-panel px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <SortControls activeSort={activeSort} onSortChange={(s) => { setActiveSort(s); setCurrentPage(1); }} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-forum-muted/50 hidden sm:inline">
                  {filteredThreads.length} thread{filteredThreads.length !== 1 ? 's' : ''}
                </span>
                <div className="h-3 w-[1px] bg-forum-border hidden sm:block" />
                <FilterDropdown activeFilter={activeFilter} onFilterChange={(f) => { setActiveFilter(f); setCurrentPage(1); }} />
              </div>
            </div>

            {/* Thread list */}
            <div ref={threadListRef} className={`hud-panel overflow-hidden transition-all duration-200 ease-out ${isTransitioning ? 'opacity-40 translate-y-1' : 'opacity-100 translate-y-0'}`}>
              {/* Thread list header */}
              <div className="flex items-center px-4 py-2 border-b border-forum-border/40 bg-forum-bg/30">
                <div className="flex-1 flex items-center gap-2">
                  <MessageCircle size={11} className="text-forum-pink/50" />
                  <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-forum-muted/70">
                    Threads
                  </span>
                  {activeFilter !== 'all' && (
                    <span className="rounded bg-forum-pink/10 border border-forum-pink/20 px-1.5 py-[1px] text-[8px] font-mono font-semibold text-forum-pink">
                      {activeFilter === 'trending' ? 'Trending' : activeFilter === 'unanswered' ? 'Unanswered' : 'My Threads'}
                    </span>
                  )}
                  {activeTopic && activeTopicData && (
                    <span className="rounded bg-forum-pink/10 border border-forum-pink/20 px-1.5 py-[1px] text-[8px] font-mono font-semibold text-forum-pink">
                      {activeTopicData.name}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                  <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-forum-muted/50 min-w-[60px] text-center">Views</span>
                  <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-forum-muted/50 min-w-[60px] text-center">Replies</span>
                </div>
                <div className="hidden lg:block w-[130px] text-right flex-shrink-0">
                  <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-forum-muted/50">Last Post</span>
                </div>
              </div>

              {/* Thread rows */}
              {paginatedThreads.length > 0 ? (
                <div>
                  {paginatedThreads.map((thread) => (
                    <ThreadRow key={thread.id} thread={thread} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-20">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-forum-pink/5 border border-forum-pink/10 mb-4">
                    <SearchX size={28} className="text-forum-pink/40" />
                  </div>
                  <h3 className="text-[14px] font-bold text-forum-text font-mono mb-1.5">
                    No threads found
                  </h3>
                  <p className="text-[11px] text-forum-muted/60 font-mono text-center max-w-[300px] leading-relaxed">
                    {searchQuery
                      ? `No results for "${searchQuery}". Try a different search term.`
                      : activeFilter !== 'all'
                        ? 'No threads match the selected filter. Try changing your filter.'
                        : 'This category has no threads yet. Be the first to start a discussion!'}
                  </p>
                  {(searchQuery || activeFilter !== 'all') && (
                    <button
                      onClick={() => { setSearchQuery(''); setActiveFilter('all'); setCurrentPage(1); }}
                      className="mt-4 transition-forum rounded border border-forum-pink/30 bg-forum-pink/10 px-4 py-2 text-[10px] font-mono font-semibold text-forum-pink hover:bg-forum-pink/20 hover:border-forum-pink/50"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Thread count info + Pagination */}
            {paginatedThreads.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] text-forum-muted/50 font-mono">
                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredThreads.length)} of {filteredThreads.length} threads
                  </span>
                  <div className="flex items-center gap-3">
                    {/* Page size selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-forum-muted/50 font-mono">Per page:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="bg-forum-card border border-forum-border rounded px-1.5 py-0.5 text-[9px] font-mono text-forum-text focus:outline-none focus:border-forum-pink/40 hover:border-forum-pink/20 transition-forum cursor-pointer appearance-none"
                        style={{ backgroundImage: 'none' }}
                      >
                        {availablePageSizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="text-[10px] text-forum-muted/50 font-mono">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                </div>
                <ForumPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden w-[280px] flex-shrink-0 space-y-4 lg:block">
            {/* Category Info Card */}
            <div className="hud-panel p-4 space-y-3">
              <h4 className="text-[11px] font-mono font-bold text-forum-text uppercase tracking-wider flex items-center gap-2">
                <MessageCircle size={12} className="text-forum-pink" />
                Category Info
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-forum-muted">Total Threads</span>
                  <span className="text-[11px] font-mono font-bold text-forum-text">{category.threadCount.toLocaleString()}</span>
                </div>
                <div className="h-[1px] bg-forum-border" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-forum-muted">Total Posts</span>
                  <span className="text-[11px] font-mono font-bold text-forum-text">{category.postCount.toLocaleString()}</span>
                </div>
                <div className="h-[1px] bg-forum-border" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-forum-muted">Hot Threads</span>
                  <span className="text-[11px] font-mono font-semibold text-forum-text">{hotCount}</span>
                </div>
                <div className="h-[1px] bg-forum-border" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-forum-muted">Active Contributors</span>
                  <span className="text-[11px] font-mono font-semibold text-forum-text">
                    {new Set(category.threads.map((t) => t.author.id)).size}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Contributors in Category */}
            <div className="hud-panel p-4 space-y-3">
              <h4 className="text-[11px] font-mono font-bold text-forum-text uppercase tracking-wider flex items-center gap-2">
                <Users size={12} className="text-forum-pink" />
                Top Contributors
              </h4>
              <div className="space-y-2">
                {Array.from(
                  category.threads.reduce((map, t) => {
                    const key = t.author.id;
                    if (!map.has(key)) {
                      map.set(key, { user: t.author, count: 0 });
                    }
                    map.get(key)!.count += 1;
                    return map;
                  }, new Map<string, { user: typeof category.threads[0]['author']; count: number }>())
                )
                  .sort(([, a], [, b]) => b.count - a.count)
                  .slice(0, 5)
                  .map(([id, { user, count }], idx) => (
                    <div key={id} className="flex items-center gap-2.5 py-1">
                      <span className="text-[10px] font-mono font-bold text-forum-muted w-4">{idx + 1}.</span>
                      <img
                        src={getUserProfile(user.id).avatar || user.avatar}
                        alt={user.username}
                        className="h-6 w-6 rounded-full object-cover border border-forum-border"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-mono text-forum-text truncate block">{user.username}</span>
                      </div>
                      <span className="text-[10px] font-mono text-forum-pink font-bold">{count} threads</span>
                    </div>
                  ))}
              </div>
            </div>

            <RecentActivityFeed />
          </div>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[300px] overflow-y-auto border-l border-forum-border bg-forum-card p-4 space-y-4">
            <RecentActivityFeed />
          </div>
        </div>
      )}

      {/* Topic Selection Modal */}
      <SelectTopicModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
