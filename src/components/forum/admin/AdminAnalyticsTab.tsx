import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, TrendingUp, Users, MessageSquare, Eye, Activity, Calendar, Award } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalThreads: number;
  totalPosts: number;
  totalViews: number;
  activeUsers24h: number;
  newUsers7d: number;
  newThreads7d: number;
  newPosts7d: number;
  topCategories: Array<{ name: string; threadCount: number; postCount: number }>;
  topUsers: Array<{ username: string; postCount: number; reputation: number }>;
  activityByDay: Array<{ date: string; posts: number; threads: number; users: number }>;
}

export default function AdminAnalyticsTab() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const rangeMs = timeRange === '7d' ? 7 * 24 * 60 * 60 * 1000 : timeRange === '30d' ? 30 * 24 * 60 * 60 * 1000 : 90 * 24 * 60 * 60 * 1000;
      const rangeStart = new Date(now.getTime() - rangeMs).toISOString();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Fetch all stats in parallel
      const [
        { count: totalUsers },
        { count: totalThreads },
        { count: totalPosts },
        { data: threadsData },
        { count: activeUsers24h },
        { count: newUsers7d },
        { count: newThreads7d },
        { count: newPosts7d },
        { data: categoriesData },
        { data: topUsersData },
      ] = await Promise.all([
        supabase.from('forum_users').select('*', { count: 'exact', head: true }),
        supabase.from('threads').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('threads').select('view_count'),
        supabase.from('forum_users').select('*', { count: 'exact', head: true }).gte('last_seen', oneDayAgo),
        supabase.from('forum_users').select('*', { count: 'exact', head: true }).gte('join_date', rangeStart),
        supabase.from('threads').select('*', { count: 'exact', head: true }).gte('created_at', rangeStart),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', rangeStart),
        supabase.from('categories').select('id, name, thread_count, post_count').order('thread_count', { ascending: false }).limit(10),
        supabase.from('forum_users').select('username, post_count, reputation').order('post_count', { ascending: false }).limit(10),
      ]);

      const totalViews = threadsData?.reduce((sum, t) => sum + (t.view_count || 0), 0) || 0;

      // Get activity by day
      const { data: postsActivity } = await supabase
        .from('posts')
        .select('created_at')
        .gte('created_at', rangeStart)
        .order('created_at');

      const { data: threadsActivity } = await supabase
        .from('threads')
        .select('created_at')
        .gte('created_at', rangeStart)
        .order('created_at');

      const { data: usersActivity } = await supabase
        .from('forum_users')
        .select('join_date')
        .gte('join_date', rangeStart)
        .order('join_date');

      // Group by day
      const activityMap = new Map<string, { posts: number; threads: number; users: number }>();
      const days = parseInt(timeRange);
      for (let i = 0; i < days; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        activityMap.set(dateStr, { posts: 0, threads: 0, users: 0 });
      }

      postsActivity?.forEach(p => {
        const dateStr = p.created_at.split('T')[0];
        const entry = activityMap.get(dateStr);
        if (entry) entry.posts++;
      });

      threadsActivity?.forEach(t => {
        const dateStr = t.created_at.split('T')[0];
        const entry = activityMap.get(dateStr);
        if (entry) entry.threads++;
      });

      usersActivity?.forEach(u => {
        const dateStr = u.join_date.split('T')[0];
        const entry = activityMap.get(dateStr);
        if (entry) entry.users++;
      });

      const activityByDay = Array.from(activityMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .reverse();

      setAnalytics({
        totalUsers: totalUsers || 0,
        totalThreads: totalThreads || 0,
        totalPosts: totalPosts || 0,
        totalViews,
        activeUsers24h: activeUsers24h || 0,
        newUsers7d: newUsers7d || 0,
        newThreads7d: newThreads7d || 0,
        newPosts7d: newPosts7d || 0,
        topCategories: categoriesData?.map(c => ({
          name: c.name,
          threadCount: c.thread_count || 0,
          postCount: c.post_count || 0,
        })) || [],
        topUsers: topUsersData?.map(u => ({
          username: u.username,
          postCount: u.post_count || 0,
          reputation: u.reputation || 0,
        })) || [],
        activityByDay,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !analytics) {
    return (
      <div className="hud-panel flex items-center justify-center py-20">
        <Activity size={20} className="text-primary animate-spin" />
        <span className="ml-3 text-[12px] font-mono text-forum-muted">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-primary" />
        <span className="text-[10px] font-mono text-forum-muted">Time Range:</span>
        {(['7d', '30d', '90d'] as const).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`transition-forum  px-3 py-1 text-[10px] font-mono ${
              timeRange === range
                ? 'bg-primary text-black'
                : 'text-forum-muted hover:text-forum-text hover:bg-forum-hover'
            }`}
          >
            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="hud-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-blue-600" />
            <span className="text-[10px] font-mono text-forum-muted uppercase">Total Users</span>
          </div>
          <div className="text-[20px] font-mono font-bold text-forum-text">{analytics.totalUsers.toLocaleString()}</div>
          <div className="text-[9px] font-mono text-emerald-700 mt-1">+{analytics.newUsers7d} this week</div>
        </div>

        <div className="hud-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={14} className="text-primary" />
            <span className="text-[10px] font-mono text-forum-muted uppercase">Total Threads</span>
          </div>
          <div className="text-[20px] font-mono font-bold text-forum-text">{analytics.totalThreads.toLocaleString()}</div>
          <div className="text-[9px] font-mono text-black mt-1">+{analytics.newThreads7d} this week</div>
        </div>

        <div className="hud-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={14} className="text-purple-600" />
            <span className="text-[10px] font-mono text-forum-muted uppercase">Total Posts</span>
          </div>
          <div className="text-[20px] font-mono font-bold text-forum-text">{analytics.totalPosts.toLocaleString()}</div>
          <div className="text-[9px] font-mono text-emerald-700 mt-1">+{analytics.newPosts7d} this week</div>
        </div>

        <div className="hud-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={14} className="text-amber-600" />
            <span className="text-[10px] font-mono text-forum-muted uppercase">Total Views</span>
          </div>
          <div className="text-[20px] font-mono font-bold text-forum-text">{analytics.totalViews.toLocaleString()}</div>
          <div className="text-[9px] font-mono text-black mt-1">{analytics.activeUsers24h} active today</div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="hud-panel p-4">
        <h3 className="text-[12px] font-mono font-bold text-forum-text mb-4 flex items-center gap-2">
          <TrendingUp size={12} className="text-primary" /> Activity Over Time
        </h3>
        <div className="space-y-2">
          {analytics.activityByDay.map((day, idx) => {
            const maxValue = Math.max(...analytics.activityByDay.map(d => d.posts + d.threads + d.users));
            const total = day.posts + day.threads + day.users;
            const percentage = maxValue > 0 ? (total / maxValue) * 100 : 0;
            
            return (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-forum-muted w-20">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <div className="flex-1 h-6 bg-forum-hover  overflow-hidden relative">
                  <div
                    className="h-full bg-primary to-forum-pink/20 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-2 gap-3 text-[8px] font-mono">
                    <span className="text-forum-text">{day.posts}p</span>
                    <span className="text-forum-text">{day.threads}t</span>
                    <span className="text-forum-text">{day.users}u</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Categories & Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="hud-panel p-4">
          <h3 className="text-[12px] font-mono font-bold text-forum-text mb-3 flex items-center gap-2">
            <BarChart3 size={12} className="text-primary" /> Top Categories
          </h3>
          <div className="space-y-2">
            {analytics.topCategories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-forum-text">{cat.name}</span>
                <div className="flex items-center gap-3 text-forum-muted">
                  <span>{cat.threadCount} threads</span>
                  <span>{cat.postCount} posts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hud-panel p-4">
          <h3 className="text-[12px] font-mono font-bold text-forum-text mb-3 flex items-center gap-2">
            <Award size={12} className="text-primary" /> Top Contributors
          </h3>
          <div className="space-y-2">
            {analytics.topUsers.map((user, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-forum-text">{user.username}</span>
                <div className="flex items-center gap-3 text-forum-muted">
                  <span>{user.postCount} posts</span>
                  <span className="text-primary">{user.reputation} rep</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
