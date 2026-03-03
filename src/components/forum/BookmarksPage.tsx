import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ForumHeader from '@/components/forum/ForumHeader';
import ThreadRow from '@/components/forum/ThreadRow';
import MobileBottomNav from '@/components/forum/MobileBottomNav';
import SidebarStatsPanel from '@/components/forum/SidebarStatsPanel';
import OnlineUsers from '@/components/forum/OnlineUsers';
import NewThreadModal from '@/components/forum/NewThreadModal';
import { useForumContext } from '@/context/ForumContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Thread } from '@/types/forum';
import { Home as HomeIcon, ChevronRight, Bookmark, Inbox, Loader2 } from 'lucide-react';

export default function BookmarksPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookmarkedThreads, setBookmarkedThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const { forumStats, currentUser } = useForumContext();
  const { user } = useAuth();

  // Fetch bookmarked threads from database
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchBookmarks = async () => {
      try {
        // Get bookmark records
        const { data: bookmarks, error: bookmarksError } = await supabase
          .from('thread_bookmarks')
          .select('thread_id')
          .eq('user_id', user.id);

        if (bookmarksError) {
          console.error('[BookmarksPage] Error fetching bookmarks:', bookmarksError);
          setLoading(false);
          return;
        }

        if (!bookmarks || bookmarks.length === 0) {
          setBookmarkedThreads([]);
          setLoading(false);
          return;
        }

        const threadIds = bookmarks.map(b => b.thread_id);

        // Fetch full thread details
        const { data: threads, error: threadsError } = await supabase
          .from('threads')
          .select(`
            id, title, excerpt, author_id, category_id, topic_id,
            created_at, last_reply_at, last_reply_by_id,
            reply_count, view_count, is_pinned, is_locked, is_hot,
            tags, upvotes, downvotes,
            author:forum_users!threads_author_id_fkey(id, username, avatar, banner, post_count, reputation, join_date, is_online, rank, role),
            last_reply_by:forum_users!threads_last_reply_by_id_fkey(id, username, avatar, banner, post_count, reputation, join_date, is_online, rank, role)
          `)
          .in('id', threadIds);

        if (threadsError) {
          console.error('[BookmarksPage] Error fetching threads:', threadsError);
          setLoading(false);
          return;
        }

        // Transform to Thread type
        const formattedThreads: Thread[] = (threads || []).map(t => {
          const authorData = Array.isArray(t.author) ? t.author[0] : t.author;
          const lastReplyByData = t.last_reply_by ? (Array.isArray(t.last_reply_by) ? t.last_reply_by[0] : t.last_reply_by) : null;

          return {
            id: t.id,
            title: t.title,
            excerpt: t.excerpt,
            author: {
              id: authorData.id,
              username: authorData.username,
              avatar: authorData.avatar,
              
              banner: authorData.banner || undefined,
              postCount: authorData.post_count,
              reputation: authorData.reputation,
              joinDate: authorData.join_date,
              isOnline: authorData.is_online,
              rank: authorData.rank || 'Newcomer',
              role: authorData.role || 'member',
            },
            categoryId: t.category_id,
            createdAt: t.created_at,
            lastReplyAt: t.last_reply_at,
            lastReplyBy: lastReplyByData ? {
              id: lastReplyByData.id,
              username: lastReplyByData.username,
              avatar: lastReplyByData.avatar,
              
              banner: lastReplyByData.banner || undefined,
              postCount: lastReplyByData.post_count,
              reputation: lastReplyByData.reputation,
              joinDate: lastReplyByData.join_date,
              isOnline: lastReplyByData.is_online,
              rank: lastReplyByData.rank || 'Newcomer',
              role: lastReplyByData.role || 'member',
            } : {
              id: authorData.id,
              username: authorData.username,
              avatar: authorData.avatar,
              
              banner: authorData.banner || undefined,
              postCount: authorData.post_count,
              reputation: authorData.reputation,
              joinDate: authorData.join_date,
              isOnline: authorData.is_online,
              rank: authorData.rank || 'Newcomer',
              role: authorData.role || 'member',
            },
            replyCount: t.reply_count,
            viewCount: t.view_count,
            isPinned: t.is_pinned,
            isLocked: t.is_locked,
            isHot: t.is_hot,
            hasUnread: false,
            tags: t.tags || [],
            upvotes: t.upvotes,
            downvotes: t.downvotes,
          };
        });

        setBookmarkedThreads(formattedThreads);
        setLoading(false);
      } catch (error) {
        console.error('[BookmarksPage] Error:', error);
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user?.id]);

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
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted">
          <HomeIcon size={11} className="text-primary" />
          <span className="text-forum-text hover:text-primary transition-forum cursor-pointer" onClick={() => navigate('/')}>
            Forums
          </span>
          <ChevronRight size={10} />
          <span className="text-primary">Bookmarks</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Header */}
            <div className="hud-panel p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10  bg-primary/10 flex items-center justify-center">
                  <Bookmark size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="text-[18px] font-bold text-forum-text font-mono">Your Bookmarks</h1>
                  <p className="text-[11px] text-forum-muted font-mono">
                    {bookmarkedThreads.length} {bookmarkedThreads.length === 1 ? 'thread' : 'threads'} bookmarked
                  </p>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-2 mt-4 border-t border-forum-border/30 pt-4">
                <button
                  className="px-4 py-2 text-[11px] font-mono font-semibold  bg-primary text-white border border-primary/50"
                >
                  Threads
                </button>
                <button
                  onClick={() => navigate('/bookmarks/posts')}
                  className="px-4 py-2 text-[11px] font-mono font-semibold  text-forum-muted hover:text-primary hover:bg-primary/5 border border-forum-border/30 transition-forum"
                >
                  Posts
                </button>
              </div>
            </div>

            {/* Bookmarked threads */}
            {loading ? (
              <div className="hud-panel p-12 text-center">
                <Loader2 size={32} className="text-primary animate-spin mx-auto mb-4" />
                <p className="text-[11px] text-forum-muted font-mono">Loading bookmarks...</p>
              </div>
            ) : bookmarkedThreads.length === 0 ? (
              <div className="hud-panel p-12 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16  bg-primary/10 flex items-center justify-center">
                    <Inbox size={32} className="text-forum-muted" />
                  </div>
                </div>
                <h3 className="text-[14px] font-bold text-forum-text font-mono mb-2">No Bookmarks Yet</h3>
                <p className="text-[11px] text-forum-muted font-mono mb-6 max-w-md mx-auto">
                  Bookmark threads to save them for later. Click the bookmark icon on any thread to add it here.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="transition-forum  bg-primary px-5 py-2.5 text-[11px] font-mono font-semibold text-white hover:shadow-brutal-sm active:scale-95 border border-primary/50"
                >
                  Browse Forums
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {bookmarkedThreads.map((thread) => (
                  <ThreadRow key={thread.id} thread={thread} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden w-[280px] flex-shrink-0 space-y-4 lg:block">
            <SidebarStatsPanel stats={forumStats} />
            <OnlineUsers />
          </div>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 " onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[300px] overflow-y-auto border-l border-forum-border bg-forum-card p-4 space-y-4">
            <SidebarStatsPanel stats={forumStats} />
            <OnlineUsers />
          </div>
        </div>
      )}

      <NewThreadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <MobileBottomNav />
    </div>
  );
}
