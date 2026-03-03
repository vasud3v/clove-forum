import { MessageSquare, UserPlus, Zap, Clock, TrendingUp, Pin, Lock, Eye, Award, UserCheck, ThumbsUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface ActivityItem {
  id: string;
  type: 'reply' | 'new_member' | 'thread' | 'hot_thread' | 'pinned_thread' | 
        'locked_thread' | 'popular_thread' | 'achievement' | 'follow' | 'upvote';
  user: { username: string; avatar: string; id?: string };
  target: string;
  targetId?: string;
  time: string;
  timestamp: number;
  metadata?: any;
}

const iconMap = {
  reply: { icon: MessageSquare, color: 'text-cyan-600' },
  new_member: { icon: UserPlus, color: 'text-emerald-700' },
  thread: { icon: Zap, color: 'text-primary' },
  hot_thread: { icon: TrendingUp, color: 'text-orange-700' },
  pinned_thread: { icon: Pin, color: 'text-amber-600' },
  locked_thread: { icon: Lock, color: 'text-red-600' },
  popular_thread: { icon: Eye, color: 'text-purple-600' },
  achievement: { icon: Award, color: 'text-yellow-700' },
  follow: { icon: UserCheck, color: 'text-blue-600' },
  upvote: { icon: ThumbsUp, color: 'text-emerald-700' },
};

function getActivityText(item: ActivityItem): string {
  try {
    switch (item.type) {
      case 'reply':
        return `replied to "${item.target || 'a thread'}"`;
      case 'new_member':
        return 'joined the forum';
      case 'thread':
        return `created "${item.target || 'a thread'}"`;
      case 'hot_thread':
        return `started trending: "${item.target || 'a thread'}"`;
      case 'pinned_thread':
        return `pinned "${item.target || 'a thread'}"`;
      case 'locked_thread':
        return `locked "${item.target || 'a thread'}"`;
      case 'popular_thread':
        return `"${item.target || 'a thread'}" reached ${item.metadata?.views || 0} views`;
      case 'achievement':
        return `earned ${item.metadata?.achievement || 'an achievement'}`;
      case 'follow':
        return `started following ${item.target || 'someone'}`;
      case 'upvote':
        return `upvoted "${item.target || 'a thread'}"`;
      default:
        return 'did something';
    }
  } catch (error) {
    console.error('Error generating activity text:', error);
    return 'did something';
  }
}

function getTimeAgo(dateString: string): string {
  try {
    if (!dateString) return 'recently';
    
    const now = new Date();
    const past = new Date(dateString);
    
    // Validate date
    if (isNaN(past.getTime())) {
      return 'recently';
    }

    const diffMs = now.getTime() - past.getTime();
    
    // Handle future dates (clock skew)
    if (diffMs < 0) {
      return 'just now';
    }

    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return `${Math.floor(diffDays / 7)}w ago`;
  } catch (error) {
    console.error('Error calculating time ago:', error);
    return 'recently';
  }
}

// Sanitize and truncate text safely
function sanitizeText(text: string | null | undefined, maxLength: number = 40): string {
  if (!text || typeof text !== 'string') return 'Untitled';
  
  const cleaned = text.trim();
  if (cleaned.length === 0) return 'Untitled';
  
  if (cleaned.length > maxLength) {
    return cleaned.slice(0, maxLength) + '...';
  }
  return cleaned;
}

export default function RecentActivityFeed() {
  const navigate = useNavigate();
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setIsLoading(true);
        const activities: ActivityItem[] = [];
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Fetch recent posts (try 24h first, fallback to 7 days)
        let { data: recentPosts } = await supabase
          .from('posts')
          .select(`
            id,
            created_at,
            thread_id,
            author:forum_users!posts_author_id_fkey(username, avatar),
            thread:threads!posts_thread_id_fkey(id, title)
          `)
          .gte('created_at', oneDayAgo)
          .order('created_at', { ascending: false })
          .limit(15);

        // If no posts in last 24h, try last week
        if (!recentPosts || recentPosts.length === 0) {
          const result = await supabase
            .from('posts')
            .select(`
              id,
              created_at,
              thread_id,
              author:forum_users!posts_author_id_fkey(username, avatar),
              thread:threads!posts_thread_id_fkey(id, title)
            `)
            .gte('created_at', oneWeekAgo)
            .order('created_at', { ascending: false })
            .limit(15);
          recentPosts = result.data;
        }

        // Fetch recent threads (try 24h first, fallback to 7 days)
        let { data: recentThreads, error: threadsError } = await supabase
          .from('threads')
          .select('id, title, created_at, view_count, reply_count, is_hot, is_pinned, is_locked, author_id')
          .gte('created_at', oneDayAgo)
          .order('created_at', { ascending: false })
          .limit(12);

        if (threadsError) {
          console.error('Error fetching recent threads:', threadsError);
        }

        // If no threads in last 24h, try last week
        if (!recentThreads || recentThreads.length === 0) {
          const result = await supabase
            .from('threads')
            .select('id, title, created_at, view_count, reply_count, is_hot, is_pinned, is_locked, author_id')
            .gte('created_at', oneWeekAgo)
            .order('created_at', { ascending: false })
            .limit(12);
          recentThreads = result.data;
        }

        // Fetch popular threads (any time, just need high view count)
        const { data: popularThreads, error: popularError } = await supabase
          .from('threads')
          .select('id, title, last_reply_at, view_count, author_id')
          .gte('view_count', 50) // Lowered threshold from 100 to 50
          .order('view_count', { ascending: false })
          .limit(5);

        if (popularError) {
          console.error('Error fetching popular threads:', popularError);
        }

        // Fetch recent users (try 24h first, fallback to 7 days)
        let { data: recentUsers } = await supabase
          .from('forum_users')
          .select('id, username, avatar, join_date, reputation')
          .gte('join_date', oneDayAgo)
          .order('join_date', { ascending: false })
          .limit(8);

        // If no users in last 24h, try last week
        if (!recentUsers || recentUsers.length === 0) {
          const result = await supabase
            .from('forum_users')
            .select('id, username, avatar, join_date, reputation')
            .gte('join_date', oneWeekAgo)
            .order('join_date', { ascending: false })
            .limit(8);
          recentUsers = result.data;
        }

        // Fetch recent follows (try 24h first, fallback to 7 days)
        let { data: recentFollows } = await supabase
          .from('user_follows')
          .select(`
            created_at,
            follower:forum_users!user_follows_follower_id_fkey(id, username, avatar),
            following:forum_users!user_follows_following_id_fkey(id, username, avatar)
          `)
          .gte('created_at', oneDayAgo)
          .order('created_at', { ascending: false })
          .limit(8);

        // If no follows in last 24h, try last week
        if (!recentFollows || recentFollows.length === 0) {
          const result = await supabase
            .from('user_follows')
            .select(`
              created_at,
              follower:forum_users!user_follows_follower_id_fkey(id, username, avatar),
              following:forum_users!user_follows_following_id_fkey(id, username, avatar)
            `)
            .gte('created_at', oneWeekAgo)
            .order('created_at', { ascending: false })
            .limit(8);
          recentFollows = result.data;
        }

        // Process posts
        if (recentPosts) {
          for (const post of recentPosts) {
            try {
              const author = Array.isArray(post.author) ? post.author[0] : post.author;
              const thread = Array.isArray(post.thread) ? post.thread[0] : post.thread;

              if (author?.username && thread?.id && thread?.title) {
                activities.push({
                  id: `post-${post.id}`,
                  type: 'reply',
                  user: {
                    username: author.username,
                    avatar: author.avatar || '',
                  },
                  target: sanitizeText(thread.title),
                  targetId: thread.id,
                  time: getTimeAgo(post.created_at),
                  timestamp: new Date(post.created_at).getTime(),
                });
              }
            } catch (err) {
              console.warn('Error processing post:', err);
            }
          }
        }

        // Process threads
        if (recentThreads && recentThreads.length > 0) {
          // Fetch author data for these threads
          const authorIds = [...new Set(recentThreads.map(t => t.author_id))];
          const { data: authors } = await supabase
            .from('forum_users')
            .select('id, username, avatar')
            .in('id', authorIds);

          const authorMap = new Map(authors?.map(a => [a.id, a]) || []);

          for (const thread of recentThreads) {
            try {
              const author = authorMap.get(thread.author_id);

              if (author?.username && thread?.id && thread?.title) {
                let type: ActivityItem['type'] = 'thread';
                
                if (thread.is_pinned) {
                  type = 'pinned_thread';
                } else if (thread.is_locked) {
                  type = 'locked_thread';
                } else if (thread.is_hot || (thread.view_count || 0) > 200 || (thread.reply_count || 0) > 15) {
                  type = 'hot_thread';
                }
                
                activities.push({
                  id: `thread-${thread.id}`,
                  type,
                  user: {
                    username: author.username,
                    avatar: author.avatar || '',
                  },
                  target: sanitizeText(thread.title),
                  targetId: thread.id,
                  time: getTimeAgo(thread.created_at),
                  timestamp: new Date(thread.created_at).getTime(),
                });
              }
            } catch (err) {
              console.warn('Error processing thread:', err);
            }
          }
        }

        // Process popular threads
        if (popularThreads && popularThreads.length > 0) {
          // Fetch author data for popular threads
          const authorIds = [...new Set(popularThreads.map(t => t.author_id))];
          const { data: authors } = await supabase
            .from('forum_users')
            .select('id, username, avatar')
            .in('id', authorIds);

          const authorMap = new Map(authors?.map(a => [a.id, a]) || []);

          for (const thread of popularThreads) {
            try {
              const author = authorMap.get(thread.author_id);

              if (author?.username && thread?.id && thread?.title && (thread.view_count || 0) >= 100) {
                activities.push({
                  id: `popular-${thread.id}`,
                  type: 'popular_thread',
                  user: {
                    username: author.username,
                    avatar: author.avatar || '',
                  },
                  target: sanitizeText(thread.title, 35),
                  targetId: thread.id,
                  time: getTimeAgo(thread.last_reply_at),
                  timestamp: new Date(thread.last_reply_at).getTime(),
                  metadata: { views: thread.view_count },
                });
              }
            } catch (err) {
              console.warn('Error processing popular thread:', err);
            }
          }
        }

        // Process new members
        if (recentUsers) {
          for (const user of recentUsers) {
            try {
              if (user?.id && user?.username) {
                activities.push({
                  id: `user-${user.id}`,
                  type: 'new_member',
                  user: {
                    id: user.id,
                    username: user.username,
                    avatar: user.avatar || '',
                  },
                  target: '',
                  targetId: user.id,
                  time: getTimeAgo(user.join_date),
                  timestamp: new Date(user.join_date).getTime(),
                });

                if ((user.reputation || 0) >= 100) {
                  activities.push({
                    id: `achievement-${user.id}`,
                    type: 'achievement',
                    user: {
                      id: user.id,
                      username: user.username,
                      avatar: user.avatar || '',
                    },
                    target: '',
                    targetId: user.id,
                    time: getTimeAgo(user.join_date),
                    timestamp: new Date(user.join_date).getTime(),
                    metadata: { achievement: '100+ Reputation' },
                  });
                }
              }
            } catch (err) {
              console.warn('Error processing user:', err);
            }
          }
        }

        // Process follows
        if (recentFollows) {
          for (const follow of recentFollows) {
            try {
              const follower = Array.isArray(follow.follower) ? follow.follower[0] : follow.follower;
              const following = Array.isArray(follow.following) ? follow.following[0] : follow.following;

              if (follower?.id && follower?.username && following?.id && following?.username) {
                activities.push({
                  id: `follow-${follower.id}-${following.id}-${follow.created_at}`,
                  type: 'follow',
                  user: {
                    id: follower.id,
                    username: follower.username,
                    avatar: follower.avatar || '',
                  },
                  target: following.username,
                  targetId: following.id,
                  time: getTimeAgo(follow.created_at),
                  timestamp: new Date(follow.created_at).getTime(),
                });
              }
            } catch (err) {
              console.warn('Error processing follow:', err);
            }
          }
        }

        // Sort and diversify
        activities.sort((a, b) => b.timestamp - a.timestamp);

        const diverseActivities: ActivityItem[] = [];
        const typeCount: Record<string, number> = {};
        const seenIds = new Set<string>();
        
        for (const activity of activities) {
          if (diverseActivities.length >= 25) break;
          
          // Skip duplicates
          if (seenIds.has(activity.id)) continue;
          seenIds.add(activity.id);
          
          const count = typeCount[activity.type] || 0;
          if (count < 6) {
            diverseActivities.push(activity);
            typeCount[activity.type] = count + 1;
          }
        }

        setActivityFeed(diverseActivities);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch recent activity:', error);
        setIsLoading(false);
      }
    };

    fetchRecentActivity();
    const interval = setInterval(fetchRecentActivity, 10000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="hud-panel overflow-hidden">
        <div className="flex items-stretch">
          <div className="flex items-center gap-1.5 bg-emerald-600 border-r border-forum-border px-4 py-2.5 flex-shrink-0 w-[140px]">
            <Clock size={12} className="text-white font-bold" />
            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider whitespace-nowrap">
              Live Feed
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 py-2.5">
            <span className="text-[10px] font-mono text-forum-muted">
              Loading activity...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (activityFeed.length === 0) {
    return (
      <div className="hud-panel overflow-hidden">
        <div className="flex items-stretch">
          <div className="flex items-center gap-1.5 bg-emerald-600 border-r border-forum-border px-4 py-2.5 flex-shrink-0 w-[140px]">
            <Clock size={12} className="text-white font-bold" />
            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider whitespace-nowrap">
              Live Feed
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 py-2.5">
            <span className="text-[10px] font-mono text-forum-muted">
              No recent activity yet. Be the first to post!
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hud-panel overflow-hidden">
      <div className="flex items-stretch">
        <div className="flex items-center gap-1.5 bg-emerald-600 border-r border-forum-border px-4 py-2.5 flex-shrink-0 w-[140px]">
          <Clock size={12} className="text-white font-bold" />
          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider whitespace-nowrap">
            Live Feed
          </span>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center gap-6 px-4 py-2.5 animate-scroll-right">
            {[...activityFeed, ...activityFeed].map((item, idx) => {
              const { icon: Icon, color } = iconMap[item.type];
              return (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => {
                    if (item.targetId) {
                      if (item.type === 'follow' || item.type === 'new_member' || item.type === 'achievement') {
                        navigate(`/user/${item.targetId}`);
                      } else {
                        navigate(`/thread/${item.targetId}`);
                      }
                    }
                  }}
                  className="flex items-center gap-2 whitespace-nowrap group transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                  <Icon size={10} className={`${color} flex-shrink-0`} />
                  <span className="text-[11px] font-mono text-forum-muted group-hover:text-primary transition-colors">
                    <span className="font-semibold text-forum-text group-hover:text-primary">
                      {item.user.username}
                    </span>
                    {' '}
                    {getActivityText(item)}
                  </span>
                  <span className="text-[9px] font-mono text-forum-muted/60">
                    {item.time}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-forum-card to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-forum-card to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </div>
  );
}