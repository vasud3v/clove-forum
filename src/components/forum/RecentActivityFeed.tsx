import { MessageSquare, UserPlus, ThumbsUp, Pin, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useForumContext } from '@/context/ForumContext';

interface ActivityItem {
  id: string;
  type: 'reply' | 'new_member' | 'like' | 'pin';
  user: { username: string; avatar: string };
  target: string;
  time: string;
}

const iconMap = {
  reply: { icon: MessageSquare, color: 'text-forum-text', bg: 'bg-forum-bg border-forum-border' },
  new_member: { icon: UserPlus, color: 'text-forum-text', bg: 'bg-forum-bg border-forum-border' },
  like: { icon: ThumbsUp, color: 'text-forum-text', bg: 'bg-forum-bg border-forum-border' },
  pin: { icon: Pin, color: 'text-forum-text', bg: 'bg-forum-bg border-forum-border' },
};

function getActivityText(item: ActivityItem): string {
  switch (item.type) {
    case 'reply':
      return `replied to "${item.target}"`;
    case 'new_member':
      return 'joined the forum';
    case 'like':
      return `liked "${item.target}"`;
    case 'pin':
      return `pinned "${item.target}"`;
  }
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function RecentActivityFeed() {
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const { getUserProfile } = useForumContext();

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        // Fetch recent posts (replies)
        const { data: recentPosts } = await supabase
          .from('posts')
          .select(`
            id,
            created_at,
            thread_id,
            author:forum_users!posts_author_id_fkey(username, avatar),
            thread:threads!posts_thread_id_fkey(title)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch recent users (new members)
        const { data: recentUsers } = await supabase
          .from('forum_users')
          .select('id, username, avatar, join_date')
          .order('join_date', { ascending: false })
          .limit(3);

        const activities: ActivityItem[] = [];

        // Add posts as reply activities
        if (recentPosts) {
          for (const post of recentPosts) {
            const author = Array.isArray(post.author) ? post.author[0] : post.author;
            const thread = Array.isArray(post.thread) ? post.thread[0] : post.thread;

            if (author && thread) {
              activities.push({
                id: post.id,
                type: 'reply',
                user: {
                  username: author.username,
                  avatar: author.avatar, // We will replace this with live avatar in render
                },
                target: thread.title.length > 30 ? thread.title.slice(0, 30) + '...' : thread.title,
                time: getTimeAgo(post.created_at),
              });
            }
          }
        }

        // Add new members
        if (recentUsers) {
          for (const user of recentUsers) {
            activities.push({
              id: `user-${user.id}`,
              type: 'new_member',
              user: {
                username: user.username,
                avatar: user.avatar, // We will replace this with live avatar in render
              },
              target: '',
              time: getTimeAgo(user.join_date),
            });
          }
        }

        // Sort by time (most recent first) and limit to 10 items
        activities.sort((a, b) => {
          const timeA = a.time.includes('just now') ? 0 : parseInt(a.time);
          const timeB = b.time.includes('just now') ? 0 : parseInt(b.time);
          return timeA - timeB;
        });

        setActivityFeed(activities.slice(0, 10));
      } catch (error) {
        console.error('Failed to fetch recent activity:', error);
      }
    };

    fetchRecentActivity();

    // Refresh every 60 seconds (increased from 30s)
    const interval = setInterval(fetchRecentActivity, 60000);

    return () => clearInterval(interval);
  }, []);

  if (activityFeed.length === 0) {
    return (
      <div className="hud-panel overflow-hidden">
        <div className="flex items-stretch">
          {/* Label */}
          <div className="flex items-center gap-1.5 bg-forum-pink/10 border-r border-forum-border px-4 py-2.5 flex-shrink-0">
            <Clock size={12} className="text-forum-pink" />
            <span className="text-[10px] font-mono font-bold text-forum-pink uppercase tracking-wider whitespace-nowrap">
              Live Feed
            </span>
          </div>

          {/* Empty state */}
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
        {/* Label */}
        <div className="flex items-center gap-1.5 bg-forum-pink/10 border-r border-forum-border px-4 py-2.5 flex-shrink-0">
          <Clock size={12} className="text-forum-pink" />
          <span className="text-[10px] font-mono font-bold text-forum-pink uppercase tracking-wider whitespace-nowrap">
            Live Feed
          </span>
        </div>

        {/* Scrolling content */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center gap-6 px-4 py-2.5 animate-scroll-right">
            {[...activityFeed, ...activityFeed].map((item, idx) => {
              const { icon: Icon } = iconMap[item.type];
              return (
                <a
                  key={`${item.id}-${idx}`}
                  href="#"
                  className="flex items-center gap-2 whitespace-nowrap group transition-forum"
                >
                  <Icon size={10} className="text-forum-muted flex-shrink-0" />
                  <span className="text-[11px] font-mono text-forum-muted group-hover:text-forum-pink transition-forum">
                    <span className="font-semibold text-forum-text group-hover:text-forum-pink">
                      {item.user.username}
                    </span>
                    {' '}
                    {getActivityText(item)}
                  </span>
                  <span className="text-[9px] font-mono text-forum-muted/50">
                    {item.time}
                  </span>
                </a>
              );
            })}
          </div>
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-forum-card to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-forum-card to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
