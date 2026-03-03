import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ForumHeader from '@/components/forum/ForumHeader';
import MobileBottomNav from '@/components/forum/MobileBottomNav';
import SidebarStatsPanel from '@/components/forum/SidebarStatsPanel';
import OnlineUsers from '@/components/forum/OnlineUsers';
import NewThreadModal from '@/components/forum/NewThreadModal';
import { useForumContext } from '@/context/ForumContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getUserAvatar } from '@/lib/avatar';
import { PostData } from '@/types/forum';
import { Home as HomeIcon, ChevronRight, Bookmark, Inbox, Loader2, MessageCircle } from 'lucide-react';
import { formatTimeAgo } from '@/lib/forumUtils';

export default function PostBookmarksPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const { forumStats, currentUser } = useForumContext();
  const { user } = useAuth();

  // Fetch bookmarked posts from database
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchBookmarks = async () => {
      try {
        // Get bookmark records
        const { data: bookmarks, error: bookmarksError } = await supabase
          .from('post_bookmarks')
          .select('post_id')
          .eq('user_id', user.id);

        if (bookmarksError) {
          console.error('[PostBookmarksPage] Error fetching bookmarks:', bookmarksError);
          setLoading(false);
          return;
        }

        if (!bookmarks || bookmarks.length === 0) {
          setBookmarkedPosts([]);
          setLoading(false);
          return;
        }

        const postIds = bookmarks.map(b => b.post_id);
        console.log('[PostBookmarksPage] Fetching posts for IDs:', postIds);

        // Fetch posts first
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .in('id', postIds);

        console.log('[PostBookmarksPage] Posts query result:', { posts, postsError });

        if (postsError) {
          console.error('[PostBookmarksPage] Error fetching posts:', postsError);
          setLoading(false);
          return;
        }

        if (!posts || posts.length === 0) {
          setBookmarkedPosts([]);
          setLoading(false);
          return;
        }

        // Fetch authors separately
        const authorIds = [...new Set(posts.map(p => p.author_id))];
        const { data: authors } = await supabase
          .from('forum_users')
          .select('id, username, avatar, banner, post_count, reputation, join_date, is_online, rank, role')
          .in('id', authorIds);

        // Fetch threads separately
        const threadIds = [...new Set(posts.map(p => p.thread_id))];
        const { data: threads } = await supabase
          .from('threads')
          .select('id, title')
          .in('id', threadIds);

        // Create lookup maps
        const authorsMap = new Map(authors?.map(a => [a.id, a]) || []);
        const threadsMap = new Map(threads?.map(t => [t.id, t]) || []);

        // Transform to PostData type
        const formattedPosts: PostData[] = posts.map(p => {
          const author = authorsMap.get(p.author_id);
          const thread = threadsMap.get(p.thread_id);

          return {
            id: p.id,
            threadId: p.thread_id,
            content: p.content,
            author: author ? {
              id: author.id,
              username: author.username,
              avatar: author.avatar,
              
              banner: author.banner || undefined,
              postCount: author.post_count,
              reputation: author.reputation,
              joinDate: author.join_date,
              isOnline: author.is_online,
              rank: author.rank || 'Newcomer',
              role: author.role || 'member',
            } : {
              id: 'unknown',
              username: 'Unknown',
              avatar: '',
              postCount: 0,
              reputation: 0,
              joinDate: new Date().toISOString(),
              isOnline: false,
              rank: 'Newcomer',
              role: 'member',
            },
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            likes: p.likes || 0,
            isAnswer: p.is_answer || false,
            upvotes: p.upvotes,
            downvotes: p.downvotes,
            reactions: [],
            threadTitle: thread?.title || 'Unknown Thread',
          };
        });

        setBookmarkedPosts(formattedPosts);
        setLoading(false);
      } catch (error) {
        console.error('[PostBookmarksPage] Error:', error);
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
                    {bookmarkedPosts.length} {bookmarkedPosts.length === 1 ? 'post' : 'posts'} bookmarked
                  </p>
                </div>
              </div>
            </div>

            {/* Bookmarked posts */}
            {loading ? (
              <div className="hud-panel p-12 text-center">
                <Loader2 size={32} className="text-primary animate-spin mx-auto mb-4" />
                <p className="text-[11px] text-forum-muted font-mono">Loading bookmarks...</p>
              </div>
            ) : bookmarkedPosts.length === 0 ? (
              <div className="hud-panel p-12 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16  bg-primary/10 flex items-center justify-center">
                    <Inbox size={32} className="text-forum-muted" />
                  </div>
                </div>
                <h3 className="text-[14px] font-bold text-forum-text font-mono mb-2">No Bookmarked Posts Yet</h3>
                <p className="text-[11px] text-forum-muted font-mono mb-6 max-w-md mx-auto">
                  Bookmark posts to save them for later. Click the bookmark icon on any post to add it here.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="transition-forum  bg-primary px-5 py-2.5 text-[11px] font-mono font-semibold text-white hover:shadow-brutal-sm active:scale-95 border border-primary/50"
                >
                  Browse Forums
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookmarkedPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className="hud-panel p-4 hover:border-primary/20 transition-forum cursor-pointer" 
                    onClick={() => navigate(`/thread/${post.threadId}#${post.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <img src={post.author.avatar} alt={post.author.username} className="h-10 w-10  border border-forum-border object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-mono font-semibold text-forum-text">{post.author.username}</span>
                          <span className="text-[9px] font-mono text-forum-muted">{formatTimeAgo(post.createdAt)}</span>
                        </div>
                        <div className="text-[10px] font-mono text-forum-muted mb-2 flex items-center gap-1">
                          <MessageCircle size={9} />
                          <span>in thread:</span>
                          <span className="text-primary">{post.threadTitle}</span>
                        </div>
                        <div className="text-[11px] text-forum-text/90 line-clamp-3 leading-relaxed">
                          {post.content}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[9px] font-mono text-forum-muted">
                            ↑ {post.upvotes} ↓ {post.downvotes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
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
