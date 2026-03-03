import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { 
  Home as HomeIcon, 
  ChevronRight, 
  MessageSquare, 
  PenSquare,
  Search,
  Filter,
  Clock,
  MessageCircle,
  Eye,
  Flame,
  Pin,
  Star,
  ArrowUpDown
} from 'lucide-react';
import ForumHeader from './ForumHeader';
import ThreadRow from './ThreadRow';
import MobileBottomNav from './MobileBottomNav';
import SelectTopicModal from './SelectTopicModal';
import { useForumContext } from '@/context/ForumContext';
import { useAuth } from '@/context/AuthContext';
import { getUserAvatar } from '@/lib/avatar';
import { supabase } from '@/lib/supabase';
import { Thread, User } from '@/types/forum';

interface Topic {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category_id: string;
  thread_count: number;
  post_count: number;
}

type SortOption = 'latest' | 'popular' | 'trending' | 'oldest' | 'most-replies' | 'most-views';
type FilterOption = 'all' | 'pinned' | 'locked' | 'hot' | 'unanswered';

export default function TopicThreadsPage() {
  const { categoryId, topicId } = useParams<{ categoryId: string; topicId: string }>();
  const navigate = useNavigate();
  const { categories } = useForumContext();
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const threadsPerPage = 20;

  const category = categories.find(c => c.id === categoryId);

  useEffect(() => {
    loadTopicAndThreads();
  }, [topicId]);

  const loadTopicAndThreads = async () => {
    if (!topicId) return;

    setLoading(true);
    try {
      // Load topic details
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single();

      if (topicError) throw topicError;
      setTopic(topicData);

      // Load threads for this topic
      const { data: threadsData, error: threadsError } = await supabase
        .from('threads')
        .select(`
          *,
          author:forum_users!threads_author_id_fkey(*),
          last_reply_by:forum_users!threads_last_reply_by_id_fkey(*)
        `)
        .eq('topic_id', topicId)
        .order('is_pinned', { ascending: false })
        .order('last_reply_at', { ascending: false });

      if (threadsError) throw threadsError;

      // Transform threads data
      const transformedThreads: Thread[] = (threadsData || []).map(t => {
        const tAuthor = Array.isArray(t.author) ? t.author[0] : t.author;
        const tLast = t.last_reply_by ? (Array.isArray(t.last_reply_by) ? t.last_reply_by[0] : t.last_reply_by) : null;

        return {
          id: t.id,
          title: t.title,
          excerpt: t.excerpt,
          author: {
            id: tAuthor.id,
            username: tAuthor.username,
            avatar: tAuthor.avatar,
            
            banner: tAuthor.banner || undefined,
            postCount: tAuthor.post_count,
            reputation: tAuthor.reputation,
            joinDate: tAuthor.join_date,
            isOnline: tAuthor.is_online,
            rank: tAuthor.rank || 'Newcomer',
            role: tAuthor.role || 'member',
          },
          categoryId: t.category_id,
          topicId: t.topic_id,
          createdAt: t.created_at,
          lastReplyAt: t.last_reply_at,
          lastReplyBy: tLast ? {
            id: tLast.id,
            username: tLast.username,
            avatar: tLast.avatar,
            
            banner: tLast.banner || undefined,
            postCount: tLast.post_count,
            reputation: tLast.reputation,
            joinDate: tLast.join_date,
            isOnline: tLast.is_online,
            rank: tLast.rank || 'Newcomer',
            role: tLast.role || 'member',
          } : tAuthor as User,
          replyCount: t.reply_count,
          viewCount: t.view_count,
          isPinned: t.is_pinned,
          isLocked: t.is_locked,
          isHot: t.is_hot,
          hasUnread: false,
          tags: t.tags || [],
          upvotes: t.upvotes,
          downvotes: t.downvotes,
          banner: t.banner,
          thumbnail: t.thumbnail,
        };
      });

      setThreads(transformedThreads);
    } catch (error) {
      console.error('Error loading topic:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort threads
  const filteredAndSortedThreads = useMemo(() => {
    let result = [...threads];

    // Apply local search filter
    if (localSearchQuery.trim()) {
      const query = localSearchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.excerpt?.toLowerCase().includes(query) ||
        t.author.username.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply filter
    switch (filterBy) {
      case 'pinned':
        result = result.filter(t => t.isPinned);
        break;
      case 'locked':
        result = result.filter(t => t.isLocked);
        break;
      case 'hot':
        result = result.filter(t => t.isHot);
        break;
      case 'unanswered':
        result = result.filter(t => t.replyCount === 0);
        break;
    }

    // Apply sort
    switch (sortBy) {
      case 'latest':
        result.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.lastReplyAt).getTime() - new Date(a.lastReplyAt).getTime();
        });
        break;
      case 'oldest':
        result.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        break;
      case 'popular':
        result.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
        });
        break;
      case 'trending':
        result.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          const aScore = a.replyCount * 2 + a.viewCount * 0.1 + (a.upvotes - a.downvotes) * 5;
          const bScore = b.replyCount * 2 + b.viewCount * 0.1 + (b.upvotes - b.downvotes) * 5;
          return bScore - aScore;
        });
        break;
      case 'most-replies':
        result.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return b.replyCount - a.replyCount;
        });
        break;
      case 'most-views':
        result.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return b.viewCount - a.viewCount;
        });
        break;
    }

    return result;
  }, [threads, localSearchQuery, filterBy, sortBy]);

  // Paginate threads
  const totalPages = Math.ceil(filteredAndSortedThreads.length / threadsPerPage);
  
  // Separate sticky and normal threads
  const stickyThreads = filteredAndSortedThreads.filter(t => t.isPinned);
  const normalThreads = filteredAndSortedThreads.filter(t => !t.isPinned);
  
  const paginatedThreads = normalThreads.slice(
    (currentPage - 1) * threadsPerPage,
    currentPage * threadsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [localSearchQuery, filterBy, sortBy]);

  // Calculate filter counts
  const stats = useMemo(() => {
    const pinnedCount = threads.filter(t => t.isPinned).length;
    const hotCount = threads.filter(t => t.isHot).length;
    const unansweredCount = threads.filter(t => t.replyCount === 0).length;

    return {
      pinnedCount,
      hotCount,
      unansweredCount,
    };
  }, [threads]);

  if (loading) {
    return (
      <div className="min-h-screen bg-forum-bg flex items-center justify-center">
        <div className="text-forum-muted">Loading...</div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-forum-bg flex items-center justify-center">
        <div className="text-forum-muted">Topic not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forum-bg pb-20 lg:pb-0">
      <ForumHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted">
            <Link to="/" className="hover:text-primary transition-forum">
              <HomeIcon size={11} className="text-primary" />
            </Link>
            <ChevronRight size={10} />
            <Link to="/" className="hover:text-primary transition-forum">
              Forums
            </Link>
            <ChevronRight size={10} />
            {category && (
              <>
                <Link to={`/category/${categoryId}`} className="hover:text-primary transition-forum">
                  {category.name}
                </Link>
                <ChevronRight size={10} />
              </>
            )}
            <span className="text-forum-text">{topic?.name}</span>
          </div>
          
          {/* Create Thread Button - Only show for authenticated users */}
          {user && (
            <button
              onClick={() => setShowTopicModal(true)}
              className="transition-forum  border border-primary/50 bg-transparent px-3 py-1.5 text-[10px] font-mono font-bold text-primary hover:bg-primary/10 hover:border-primary active:scale-95 flex items-center gap-1.5"
            >
              <PenSquare size={12} />
              <span className="hidden sm:inline">Create Thread</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        {/* Topic Header */}
        <div className="mb-6">
          <h1 className="text-[24px] font-semibold text-forum-text mb-2">
            {topic.name}
          </h1>
          {topic.description && (
            <p className="text-[13px] text-forum-muted">
              {topic.description}
            </p>
          )}
        </div>

        {/* Top Pagination */}
        {totalPages > 1 && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`min-w-[32px] h-[32px] rounded border text-[11px] font-mono transition-forum ${
                  currentPage === 1
                    ? 'border-primary bg-primary text-white'
                    : 'border-forum-border/40 bg-forum-card text-forum-text hover:bg-forum-hover hover:border-primary/40'
                }`}
              >
                1
              </button>
              
              {currentPage > 3 && (
                <span className="text-forum-muted px-1">...</span>
              )}
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(pageNum => {
                  if (pageNum === 1 || pageNum === totalPages) return false;
                  if (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) return true;
                  return false;
                })
                .map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-[32px] rounded border text-[11px] font-mono transition-forum ${
                      currentPage === pageNum
                        ? 'border-primary bg-primary text-white'
                        : 'border-forum-border/40 bg-forum-card text-forum-text hover:bg-forum-hover hover:border-primary/40'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              
              {currentPage < totalPages - 2 && (
                <span className="text-forum-muted px-1">...</span>
              )}
              
              {totalPages > 1 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`min-w-[32px] h-[32px] rounded border text-[11px] font-mono transition-forum ${
                    currentPage === totalPages
                      ? 'border-primary bg-primary text-white'
                      : 'border-forum-border/40 bg-forum-card text-forum-text hover:bg-forum-hover hover:border-primary/40'
                  }`}
                >
                  {totalPages}
                </button>
              )}
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="ml-1 px-3 py-1.5 rounded border border-forum-border/40 bg-forum-card text-[11px] font-mono text-forum-text hover:bg-forum-hover hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-forum"
              >
                Next →
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="transition-forum  border px-3 py-1.5 text-[11px] font-mono font-semibold flex items-center gap-2 border-forum-border/40 bg-forum-card text-forum-muted hover:text-primary hover:border-primary/40"
            >
              <Filter size={14} />
              Filters
            </button>
          </div>
        )}

        {/* Search and Filters Bar */}
        <div className="hud-panel p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Local Search */}
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forum-muted" />
              <input
                type="text"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                placeholder="Search threads in this topic..."
                className="w-full pl-9 pr-3 py-2 bg-forum-bg border border-forum-border/40  text-[11px] font-mono text-forum-text placeholder:text-forum-muted/40 focus:border-primary/40 focus:ring-1 focus:ring-primary outline-none transition-forum"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none pl-3 pr-8 py-2 bg-forum-bg border border-forum-border/40  text-[11px] font-mono text-forum-text focus:border-primary/40 focus:ring-1 focus:ring-primary outline-none transition-forum cursor-pointer"
              >
                <option value="latest">Latest Activity</option>
                <option value="trending">Trending</option>
                <option value="popular">Most Popular</option>
                <option value="most-replies">Most Replies</option>
                <option value="most-views">Most Views</option>
                <option value="oldest">Oldest First</option>
              </select>
              <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-forum-muted pointer-events-none" />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`transition-forum  border px-3 py-2 text-[11px] font-mono font-semibold flex items-center gap-2 ${
                filterBy !== 'all'
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-forum-border/40 bg-forum-bg text-forum-muted hover:text-primary hover:border-primary/40'
              }`}
            >
              <Filter size={14} />
              Filter
              {filterBy !== 'all' && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary/20 rounded text-[9px]">1</span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-forum-border/30 flex flex-wrap gap-2">
              <button
                onClick={() => setFilterBy('all')}
                className={`transition-forum  border px-3 py-1.5 text-[10px] font-mono font-semibold ${
                  filterBy === 'all'
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-forum-border/30 bg-forum-bg/50 text-forum-muted hover:text-forum-text hover:border-forum-border/50'
                }`}
              >
                All Threads ({threads.length})
              </button>
              <button
                onClick={() => setFilterBy('pinned')}
                className={`transition-forum  border px-3 py-1.5 text-[10px] font-mono font-semibold flex items-center gap-1.5 ${
                  filterBy === 'pinned'
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-forum-border/30 bg-forum-bg/50 text-forum-muted hover:text-forum-text hover:border-forum-border/50'
                }`}
              >
                <Pin size={10} />
                Pinned ({stats.pinnedCount})
              </button>
              <button
                onClick={() => setFilterBy('hot')}
                className={`transition-forum  border px-3 py-1.5 text-[10px] font-mono font-semibold flex items-center gap-1.5 ${
                  filterBy === 'hot'
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-forum-border/30 bg-forum-bg/50 text-forum-muted hover:text-forum-text hover:border-forum-border/50'
                }`}
              >
                <Flame size={10} />
                Hot ({stats.hotCount})
              </button>
              <button
                onClick={() => setFilterBy('unanswered')}
                className={`transition-forum  border px-3 py-1.5 text-[10px] font-mono font-semibold flex items-center gap-1.5 ${
                  filterBy === 'unanswered'
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-forum-border/30 bg-forum-bg/50 text-forum-muted hover:text-forum-text hover:border-forum-border/50'
                }`}
              >
                <MessageSquare size={10} />
                Unanswered ({stats.unansweredCount})
              </button>
              <button
                onClick={() => setFilterBy('locked')}
                className={`transition-forum  border px-3 py-1.5 text-[10px] font-mono font-semibold flex items-center gap-1.5 ${
                  filterBy === 'locked'
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-forum-border/30 bg-forum-bg/50 text-forum-muted hover:text-forum-text hover:border-forum-border/50'
                }`}
              >
                <Star size={10} />
                Locked
              </button>
            </div>
          )}

          {/* Active Filters Summary */}
          {(localSearchQuery || filterBy !== 'all') && (
            <div className="mt-3 pt-3 border-t border-forum-border/30 flex items-center justify-between">
              <div className="text-[10px] font-mono text-forum-muted">
                Showing {filteredAndSortedThreads.length} of {threads.length} threads
              </div>
              <button
                onClick={() => {
                  setLocalSearchQuery('');
                  setFilterBy('all');
                }}
                className="text-[10px] font-mono text-primary hover:text-primary/80 transition-forum"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Threads List */}
        <div className="hud-panel overflow-hidden">
          {/* Header */}
          <div className="flex items-center px-4 py-2 border-b border-forum-border bg-forum-bg/50">
            <div className="flex-1 text-[9px] font-mono font-semibold uppercase tracking-widest text-forum-muted">
              Thread
            </div>
            <div className="hidden sm:flex items-center gap-4 w-[180px] justify-end">
              <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-forum-muted w-16 text-center">
                Views
              </span>
              <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-forum-muted w-16 text-center">
                Replies
              </span>
            </div>
            <div className="hidden lg:block w-28 text-right">
              <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-forum-muted">
                Last Post
              </span>
            </div>
          </div>

          {/* Sticky Threads Section */}
          {stickyThreads.length > 0 && (
            <>
              <div className="bg-forum-bg/30 px-4 py-2 border-b border-forum-border/50">
                <h3 className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <Pin size={12} />
                  Sticky Threads
                </h3>
              </div>
              <div>
                {stickyThreads.map((thread) => (
                  <ThreadRow key={thread.id} thread={thread} />
                ))}
              </div>
            </>
          )}

          {/* Normal Threads Section */}
          {stickyThreads.length > 0 && paginatedThreads.length > 0 && (
            <div className="bg-forum-bg/30 px-4 py-2 border-b border-forum-border/50">
              <h3 className="text-[10px] font-mono font-bold text-forum-text uppercase tracking-wider">
                Normal Threads
              </h3>
            </div>
          )}

          {/* Threads */}
          {paginatedThreads.length > 0 ? (
            <div>
              {paginatedThreads.map((thread) => (
                <ThreadRow key={thread.id} thread={thread} />
              ))}
            </div>
          ) : stickyThreads.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare size={32} className="mx-auto mb-3 text-forum-muted" />
              <p className="text-[12px] text-forum-muted mb-2">
                {localSearchQuery || filterBy !== 'all' 
                  ? 'No threads match your filters'
                  : 'No threads in this topic yet. Be the first to start a discussion!'
                }
              </p>
              {(localSearchQuery || filterBy !== 'all') && (
                <button
                  onClick={() => {
                    setLocalSearchQuery('');
                    setFilterBy('all');
                  }}
                  className="text-[11px] font-mono text-primary hover:text-primary/80 transition-forum"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : null}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            {/* Page Numbers on Left */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`min-w-[32px] h-[32px] rounded border text-[11px] font-mono transition-forum ${
                  currentPage === 1
                    ? 'border-primary bg-primary text-white'
                    : 'border-forum-border/40 bg-forum-card text-forum-text hover:bg-forum-hover hover:border-primary/40'
                }`}
              >
                1
              </button>
              
              {currentPage > 3 && (
                <span className="text-forum-muted px-1">...</span>
              )}
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(pageNum => {
                  if (pageNum === 1 || pageNum === totalPages) return false;
                  if (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) return true;
                  return false;
                })
                .map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-[32px] rounded border text-[11px] font-mono transition-forum ${
                      currentPage === pageNum
                        ? 'border-primary bg-primary text-white'
                        : 'border-forum-border/40 bg-forum-card text-forum-text hover:bg-forum-hover hover:border-primary/40'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              
              {currentPage < totalPages - 2 && (
                <span className="text-forum-muted px-1">...</span>
              )}
              
              {totalPages > 1 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`min-w-[32px] h-[32px] rounded border text-[11px] font-mono transition-forum ${
                    currentPage === totalPages
                      ? 'border-primary bg-primary text-white'
                      : 'border-forum-border/40 bg-forum-card text-forum-text hover:bg-forum-hover hover:border-primary/40'
                  }`}
                >
                  {totalPages}
                </button>
              )}
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="ml-1 px-3 py-1.5 rounded border border-forum-border/40 bg-forum-card text-[11px] font-mono text-forum-text hover:bg-forum-hover hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-forum"
              >
                Next →
              </button>
            </div>
            
            {/* Login/Register Message on Right */}
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="hud-panel px-4 py-2 hover:bg-forum-hover transition-forum cursor-pointer"
              >
                <p className="text-[11px] text-forum-muted whitespace-nowrap hover:text-primary transition-colors">
                  You must log in or register to post here.
                </p>
              </button>
            )}
          </div>
        )}

        {/* Login message when no pagination */}
        {totalPages <= 1 && !user && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => navigate('/login')}
              className="hud-panel px-4 py-2 hover:bg-forum-hover transition-forum cursor-pointer"
            >
              <p className="text-[11px] text-forum-muted whitespace-nowrap hover:text-primary transition-colors">
                You must log in or register to post here.
              </p>
            </button>
          </div>
        )}
      </div>

      <MobileBottomNav />
      
      {/* Topic Selection Modal */}
      <SelectTopicModal 
        isOpen={showTopicModal} 
        onClose={() => setShowTopicModal(false)} 
      />
    </div>
  );
}
