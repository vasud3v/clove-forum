import { Activity, MessageSquare, Eye, Users, Zap } from 'lucide-react';
import { useForumContext } from '@/context/ForumContext';

export default function QuickStats() {
  const { forumStats } = useForumContext();
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="hud-panel px-4 py-3 flex items-center gap-3 group hover:border-primary/30 transition-forum cursor-default">
        <div className="flex h-9 w-9 items-center justify-center  bg-primary/10 border border-primary/20">
          <MessageSquare size={15} className="text-primary" />
        </div>
        <div>
          <div className="text-[15px] font-bold text-forum-text font-mono">
            {forumStats.newPostsToday}
          </div>
          <div className="text-[9px] text-forum-muted font-mono uppercase tracking-wider">Posts Today</div>
        </div>
      </div>

      <div className="hud-panel px-4 py-3 flex items-center gap-3 group transition-forum cursor-default">
        <div className="flex h-9 w-9 items-center justify-center  bg-forum-bg border border-forum-border">
          <Users size={15} className="text-forum-muted" />
        </div>
        <div>
          <div className="text-[15px] font-bold text-forum-text font-mono">
            {forumStats.onlineUsers}
          </div>
          <div className="text-[9px] text-forum-muted font-mono uppercase tracking-wider">Online Now</div>
        </div>
      </div>

      <div className="hud-panel px-4 py-3 flex items-center gap-3 group transition-forum cursor-default">
        <div className="flex h-9 w-9 items-center justify-center  bg-forum-bg border border-forum-border">
          <Eye size={15} className="text-forum-muted" />
        </div>
        <div>
          <div className="text-[15px] font-bold text-forum-text font-mono">
            {forumStats.activeUsers}
          </div>
          <div className="text-[9px] text-forum-muted font-mono uppercase tracking-wider">Active Today</div>
        </div>
      </div>

      <div className="hud-panel px-4 py-3 flex items-center gap-3 group transition-forum cursor-default">
        <div className="flex h-9 w-9 items-center justify-center  bg-forum-bg border border-forum-border">
          <Zap size={15} className="text-forum-muted" />
        </div>
        <div>
          <div className="text-[15px] font-bold text-forum-text font-mono">
            {forumStats.totalThreads.toLocaleString()}
          </div>
          <div className="text-[9px] text-forum-muted font-mono uppercase tracking-wider">Threads</div>
        </div>
      </div>
    </div>
  );
}
