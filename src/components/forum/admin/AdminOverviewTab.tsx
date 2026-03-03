import { useState, useEffect } from 'react';
import { Users, FileText, MessageSquare, Eye, Shield, Clock, TrendingUp, AlertTriangle, Activity, Award, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ModerationLog } from '@/types/forum';

interface AdminStats {
  totalUsers: number;
  totalThreads: number;
  totalPosts: number;
  onlineUsers: number;
  pendingReports: number;
  bannedUsers: number;
  staffCount: number;
  newUsersToday: number;
}

interface AdminOverviewTabProps {
  stats: AdminStats;
  recentLogs: ModerationLog[];
  onNavigateTab: (tab: string) => void;
  formatDate: (d: string) => string;
}

interface GrowthMetrics {
  usersGrowth: number;
  threadsGrowth: number;
  postsGrowth: number;
  engagementRate: number;
}

export default function AdminOverviewTab({ stats, recentLogs, onNavigateTab, formatDate }: AdminOverviewTabProps) {
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics>({
    usersGrowth: 0,
    threadsGrowth: 0,
    postsGrowth: 0,
    engagementRate: 0,
  });
  const [topContributors, setTopContributors] = useState<Array<{ username: string; postCount: number }>>([]);

  useEffect(() => {
    loadGrowthMetrics();
    loadTopContributors();
  }, []);

  const loadGrowthMetrics = async () => {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: usersToday },
        { count: usersYesterday },
        { count: threadsToday },
        { count: threadsYesterday },
        { count: postsToday },
        { count: postsYesterday },
      ] = await Promise.all([
        supabase.from('forum_users').select('*', { count: 'exact', head: true }).gte('join_date', yesterday),
        supabase.from('forum_users').select('*', { count: 'exact', head: true }).gte('join_date', weekAgo).lt('join_date', yesterday),
        supabase.from('threads').select('*', { count: 'exact', head: true }).gte('created_at', yesterday),
        supabase.from('threads').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo).lt('created_at', yesterday),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', yesterday),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo).lt('created_at', yesterday),
      ]);

      const usersGrowth = usersYesterday ? ((usersToday || 0) - (usersYesterday || 0)) / (usersYesterday || 1) * 100 : 0;
      const threadsGrowth = threadsYesterday ? ((threadsToday || 0) - (threadsYesterday || 0)) / (threadsYesterday || 1) * 100 : 0;
      const postsGrowth = postsYesterday ? ((postsToday || 0) - (postsYesterday || 0)) / (postsYesterday || 1) * 100 : 0;
      const engagementRate = stats.totalUsers > 0 ? (stats.onlineUsers / stats.totalUsers) * 100 : 0;

      setGrowthMetrics({
        usersGrowth: Math.round(usersGrowth),
        threadsGrowth: Math.round(threadsGrowth),
        postsGrowth: Math.round(postsGrowth),
        engagementRate: Math.round(engagementRate * 10) / 10,
      });
    } catch (error) {
      console.error('Failed to load growth metrics:', error);
    }
  };

  const loadTopContributors = async () => {
    try {
      const { data } = await supabase
        .from('forum_users')
        .select('username, post_count')
        .order('post_count', { ascending: false })
        .limit(5);

      setTopContributors(data?.map(u => ({ username: u.username, postCount: u.post_count })) || []);
    } catch (error) {
      console.error('Failed to load top contributors:', error);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-white', growth: growthMetrics.usersGrowth },
    { label: 'Total Threads', value: stats.totalThreads, icon: FileText, color: 'text-primary', growth: growthMetrics.threadsGrowth },
    { label: 'Total Posts', value: stats.totalPosts, icon: MessageSquare, color: 'text-white', growth: growthMetrics.postsGrowth },
    { label: 'Online Now', value: stats.onlineUsers, icon: Eye, color: 'text-amber-600', growth: null },
    { label: 'Pending Reports', value: stats.pendingReports, icon: AlertTriangle, color: 'text-red-600', growth: null, alert: stats.pendingReports > 0 },
    { label: 'Banned Users', value: stats.bannedUsers, icon: Shield, color: 'text-red-500', growth: null },
    { label: 'Staff Members', value: stats.staffCount, icon: Shield, color: 'text-black', growth: null },
    { label: 'New Users (24h)', value: stats.newUsersToday, icon: TrendingUp, color: 'text-black', growth: null },
  ];

  const quickActions = [
    { label: 'Quick Setup', tab: 'quicksetup', icon: Zap, color: 'text-primary' },
    { label: 'Manage Categories', tab: 'categories', icon: FileText, color: 'text-black' },
    { label: 'Manage Threads', tab: 'threads', icon: FileText, color: 'text-black' },
    { label: 'Manage Users', tab: 'users', icon: Users, color: 'text-black' },
    { label: 'View Reports', tab: 'reports', icon: AlertTriangle, color: 'text-red-600', badge: stats.pendingReports },
    { label: 'Analytics', tab: 'analytics', icon: TrendingUp, color: 'text-black' },
  ];

  const healthScore = Math.round(
    (stats.onlineUsers / Math.max(stats.totalUsers, 1)) * 30 +
    (stats.pendingReports === 0 ? 30 : Math.max(0, 30 - stats.pendingReports * 5)) +
    (stats.newUsersToday > 0 ? 20 : 0) +
    (stats.totalPosts > stats.totalThreads * 2 ? 20 : 10)
  );

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-black';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Health Score */}
      <div className="hud-panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
              <Activity size={13} className="text-primary" /> Forum Health Score
            </h3>
            <p className="text-[9px] font-mono text-forum-muted mt-1">Overall forum performance and engagement</p>
          </div>
          <div className="text-right">
            <div className={`text-[32px] font-mono font-bold ${getHealthColor(healthScore)}`}>{healthScore}</div>
            <div className="text-[9px] font-mono text-forum-muted">/ 100</div>
          </div>
        </div>
        <div className="mt-3 h-2 bg-forum-hover  overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${healthScore >= 80 ? 'bg-emerald-400' : healthScore >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
            style={{ width: `${healthScore}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[8px] font-mono text-forum-muted">
          <span>Engagement: {growthMetrics.engagementRate}%</span>
          <span>Reports: {stats.pendingReports}</span>
          <span>Growth: {growthMetrics.usersGrowth > 0 ? '+' : ''}{growthMetrics.usersGrowth}%</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <div key={stat.label} className={`hud-panel p-4 ${stat.alert ? 'border-red-500/30' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className={stat.color} />
              <span className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-[24px] font-mono font-bold text-forum-text">{stat.value.toLocaleString()}</div>
              {stat.growth !== null && stat.growth !== 0 && (
                <div className={`text-[10px] font-mono font-bold ${stat.growth > 0 ? 'text-black' : 'text-red-600'}`}>
                  {stat.growth > 0 ? '+' : ''}{stat.growth}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Top Contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <div className="hud-panel p-4">
          <h3 className="text-[12px] font-mono font-bold text-forum-text mb-3 flex items-center gap-2">
            <Zap size={13} className="text-primary" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.tab}
                onClick={() => onNavigateTab(action.tab)}
                className="transition-forum flex items-center gap-2  border border-forum-border/30 bg-forum-bg/50 px-3 py-2.5 text-[10px] font-mono text-forum-muted hover:text-primary hover:border-primary/30 relative"
              >
                <action.icon size={12} className={action.color} /> {action.label}
                {action.badge && action.badge > 0 && (
                  <span className="absolute -top-1 -right-1  bg-red-500 px-1.5 py-[1px] text-[8px] text-black">
                    {action.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Top Contributors */}
        <div className="hud-panel p-4">
          <h3 className="text-[12px] font-mono font-bold text-forum-text mb-3 flex items-center gap-2">
            <Award size={13} className="text-primary" /> Top Contributors
          </h3>
          <div className="space-y-2">
            {topContributors.map((user, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold ${idx === 0 ? 'text-amber-600' : idx === 1 ? 'text-gray-600' : idx === 2 ? 'text-orange-700' : 'text-forum-muted'}`}>
                    #{idx + 1}
                  </span>
                  <span className="text-forum-text">{user.username}</span>
                </div>
                <span className="text-forum-muted">{user.postCount} posts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Mod Actions */}
      <div className="hud-panel overflow-hidden">
        <div className="border-b border-forum-border px-4 py-3">
          <h3 className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
            <Clock size={13} className="text-primary" /> Recent Moderation Actions
          </h3>
        </div>
        <div className="divide-y divide-forum-border/20 max-h-[300px] overflow-y-auto">
          {recentLogs.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Clock size={24} className="text-forum-muted/20 mx-auto mb-2" />
              <p className="text-[11px] font-mono text-forum-muted">No moderation actions yet</p>
            </div>
          ) : (
            recentLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 text-[10px] font-mono hover:bg-forum-hover/30 transition-forum">
                <Shield size={10} className="text-primary flex-shrink-0" />
                <span className="text-forum-text font-semibold">{log.moderatorName || 'Staff'}</span>
                <span className="text-forum-muted">{log.action.replace(/_/g, ' ')}</span>
                {log.targetUserName && (
                  <span className="text-forum-text">→ {log.targetUserName}</span>
                )}
                <span className="text-forum-muted ml-auto flex-shrink-0">{formatDate(log.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
