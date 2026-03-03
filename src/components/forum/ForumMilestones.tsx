import { Target, Users, MessageSquare, Star, TrendingUp } from 'lucide-react';
import { useForumContext } from '@/context/ForumContext';

export default function ForumMilestones() {
  const { forumStats, getAllThreads } = useForumContext();
  const allThreads = getAllThreads();
  
  // Calculate milestones from real data
  const milestones = [
    { 
      id: 1, 
      label: 'Members', 
      current: forumStats.totalUsers, 
      target: forumStats.totalUsers === 0 ? 100 : Math.ceil(forumStats.totalUsers / 100) * 100 + 100,
      icon: Users 
    },
    { 
      id: 2, 
      label: 'Posts', 
      current: forumStats.totalPosts, 
      target: forumStats.totalPosts === 0 ? 500 : Math.ceil(forumStats.totalPosts / 500) * 500 + 500,
      icon: MessageSquare 
    },
    { 
      id: 3, 
      label: 'Threads', 
      current: forumStats.totalThreads, 
      target: forumStats.totalThreads === 0 ? 50 : Math.ceil(forumStats.totalThreads / 50) * 50 + 50,
      icon: Star 
    },
    { 
      id: 4, 
      label: 'Active', 
      current: forumStats.activeUsers, 
      target: forumStats.activeUsers === 0 ? 10 : Math.ceil(forumStats.activeUsers / 10) * 10 + 10,
      icon: TrendingUp 
    },
  ];

  return (
    <div className="hud-panel overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-forum-border">
        <Target size={11} className="text-primary" />
        <h4 className="text-[10px] font-mono font-bold text-forum-text uppercase tracking-wider">
          Milestones
        </h4>
      </div>

      <div className="p-2.5 space-y-2.5">
        {milestones.map((m) => {
          const Icon = m.icon;
          const pct = Math.min(100, (m.current / m.target) * 100);
          return (
            <div key={m.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon size={9} className="text-forum-muted" />
                  <span className="text-[9px] font-mono font-semibold text-forum-text">
                    {m.label}
                  </span>
                </div>
                <span className="text-[8px] font-mono text-forum-muted">
                  <span className="text-primary font-semibold">{m.current.toLocaleString()}</span>
                  /{m.target.toLocaleString()}
                </span>
              </div>
              <div className="relative h-1.5  bg-forum-bg border border-forum-border overflow-hidden">
                <div
                  className="h-full  bg-primary to-forum-pink transition-all duration-1000 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
