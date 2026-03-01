import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PostCard from './post/PostCard';
import { Users, RefreshCw } from 'lucide-react';
import { formatTimeAgo } from '@/lib/forumUtils';

interface Post {
  id: string;
  thread_id: string;
  content: string;
  created_at: string;
  author_id: string;
  upvotes: number;
  downvotes: number;
  author: {
    id: string;
    username: string;
    avatar: string;
    rank: string;
  };
  thread: {
    id: string;
    title: string;
    category_id: string;
  };
}

export function FollowingFeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchFollowingPosts();
    }
  }, [currentUserId, page]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchFollowingPosts = async () => {
    try {
      setLoading(true);

      // Get list of users the current user is following
      const { data: followingData, error: followingError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUserId)
        .eq('status', 'accepted');

      if (followingError) throw followingError;

      if (!followingData || followingData.length === 0) {
        setPosts([]);
        setHasMore(false);
        return;
      }

      const followingIds = followingData.map(f => f.following_id);

      // Fetch posts from followed users
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          thread_id,
          content,
          created_at,
          author_id,
          upvotes,
          downvotes,
          author:forum_users!posts_author_id_fkey (
            id,
            username,
            avatar,
            rank
          ),
          thread:threads!posts_thread_id_fkey (
            id,
            title,
            category_id
          )
        `)
        .in('author_id', followingIds)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (postsError) throw postsError;

      if (page === 0) {
        setPosts(postsData || []);
      } else {
        setPosts(prev => [...prev, ...(postsData || [])]);
      }

      setHasMore((postsData || []).length === pageSize);
    } catch (error) {
      console.error('Error fetching following posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setPage(0);
    fetchFollowingPosts();
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  if (loading && page === 0) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Following Feed</h1>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground">
            Follow users to see their posts in your feed
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <img
                    src={post.author.avatar}
                    alt={post.author.username}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="font-semibold">{post.author.username}</span>
                  <span>posted in</span>
                  <span className="font-semibold">{post.thread.title}</span>
                  <span>·</span>
                  <span>{formatTimeAgo(post.created_at)}</span>
                </div>
              </div>
              <PostCard
                post={{
                  ...post,
                  likes: 0,
                  is_answer: false,
                  reply_to: null,
                  signature: null,
                  edited_at: null,
                  reactions: [],
                  hasVoted: null,
                  hasBookmarked: false
                }}
                currentUserId={currentUserId}
                onReply={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                onReport={() => {}}
                onVote={() => {}}
                onBookmark={() => {}}
                depth={0}
              />
            </Card>
          ))}

          {hasMore && (
            <div className="text-center pt-4">
              <Button onClick={handleLoadMore} disabled={loading} variant="outline">
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
