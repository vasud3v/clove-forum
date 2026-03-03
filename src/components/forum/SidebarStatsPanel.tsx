import { ForumStats } from '@/types/forum';
import { MessageSquare, FileText, Users, TrendingUp, Activity, Sparkles } from 'lucide-react';

interface SidebarStatsPanelProps {
  stats: ForumStats;
}

export default function SidebarStatsPanel({ stats }: SidebarStatsPanelProps) {
  const statItems = [
    { icon: FileText, label: 'Threads', value: stats.totalThreads },
    { icon: MessageSquare, label: 'Posts', value: stats.totalPosts },
    { icon: Users, label: 'Members', value: stats.totalUsers },
    { icon: TrendingUp, label: 'Online', value: stats.onlineUsers },
  ];

  // Calculate engagement metrics
  const postsPerThread = stats.totalThreads > 0 ? (stats.totalPosts / stats.totalThreads).toFixed(1) : '0';
  const onlinePercentage = stats.totalUsers > 0 ? Math.round((stats.onlineUsers / stats.totalUsers) * 100) : 0;

  return (
    <div className="hud-panel overflow-hidden">
      {/* Header */}
      <div className="border-b border-forum-border px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Activity size={11} className="text-primary" />
          <h4 className="text-[10px] font-bold text-forum-text font-mono uppercase tracking-wider">Statistics</h4>
        </div>
        <div className="flex items-center gap-1 text-[8px] font-mono text-forum-muted">
          <span className="flex h-1.5 w-1.5  bg-emerald-400 animate-dot-pulse" />
          Live
        </div>
      </div>

      {/* Stats List */}
      <div className="p-3 space-y-2">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={12} className="text-forum-muted" />
                <span className="text-[10px] text-forum-muted">{item.label}</span>
              </div>
              <span className="text-[12px] font-bold text-forum-text font-mono">
                {item.value.toLocaleString()}
              </span>
            </div>
          );
        })}

        {/* Engagement Insights */}
        <div className="pt-2 border-t border-forum-border/50 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-forum-muted">Engagement</span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-cyan-600 font-mono">{postsPerThread}</span>
              <span className="text-[8px] text-forum-muted">posts/thread</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-forum-muted">Activity Rate</span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-black font-mono">{onlinePercentage}%</span>
              <span className="text-[8px] text-forum-muted">online</span>
            </div>
          </div>
        </div>

        {/* Today's Posts */}
        {stats.newPostsToday > 0 && (
          <div className="pt-2 border-t border-forum-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Sparkles size={10} className="text-primary" />
                <span className="text-[9px] text-forum-muted">Today's Posts</span>
              </div>
              <span className="text-[12px] font-bold text-primary font-mono">
                +{stats.newPostsToday}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
