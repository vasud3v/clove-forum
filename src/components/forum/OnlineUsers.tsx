import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Crown, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUserAvatar } from '@/lib/avatar';
import { useForumContext } from '@/context/ForumContext';
import { User } from '@/types/forum';

export default function OnlineUsers() {
  const navigate = useNavigate();
  const { getUserProfile } = useForumContext();
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    // Fetch online users from Supabase
    const fetchOnlineUsers = async () => {
      const { data, error } = await supabase
        .from('forum_users')
        .select('*')
        .eq('is_online', true)
        .order('reputation', { ascending: false })
        .limit(20);

      if (!error && data) {
        setOnlineUsers(data.map(user => ({
          id: user.id,
          username: user.username,
          avatar: getUserAvatar(user.custom_avatar || user.avatar, user.username),
          postCount: user.post_count,
          reputation: user.reputation,
          joinDate: user.join_date,
          isOnline: user.is_online,
          rank: user.rank,
          role: user.role || 'member',
        })));
      }
    };

    fetchOnlineUsers();

    // Subscribe to real-time updates for only online status changes
    const channel = supabase
      .channel('online-users-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'forum_users',
          filter: 'is_online=eq.true'
        },
        () => {
          // Refetch online users when someone comes online
          fetchOnlineUsers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'forum_users',
          filter: 'is_online=eq.false'
        },
        () => {
          // Refetch online users when someone goes offline
          fetchOnlineUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <Crown size={8} className="text-amber-400" />;
    if (role === 'moderator') return <Zap size={8} className="text-blue-400" />;
    return null;
  };

  return (
    <div className="hud-panel overflow-hidden">
      <div className="border-b border-forum-border px-3 py-2.5 flex items-center justify-between bg-gradient-to-r from-emerald-500/5 to-transparent">
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Wifi size={11} className="text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.4)]" />
            <div className="absolute inset-0 animate-ping opacity-20">
              <Wifi size={11} className="text-emerald-400" />
            </div>
          </div>
          <h4 className="text-[10px] font-bold text-forum-text font-mono uppercase tracking-wider">Online Now</h4>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_4px_rgba(52,211,153,0.6)]" />
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-emerald-400/20 to-emerald-400/10 border border-emerald-400/30 px-1.5 text-[9px] font-bold text-emerald-400 font-mono shadow-[inset_0_0_8px_rgba(52,211,153,0.1)]">
            {onlineUsers.length}
          </span>
        </div>
      </div>
      <div className="p-3">
        {onlineUsers.length === 0 ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-1.5">
              <div className="h-8 w-8 rounded-full bg-forum-bg/50 border border-forum-border/50 flex items-center justify-center">
                <Wifi size={14} className="text-forum-muted/30" />
              </div>
            </div>
            <p className="text-[9px] font-mono text-forum-muted">No users online</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {onlineUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className="inline-flex items-center gap-1 rounded-sm border border-emerald-400/20 bg-emerald-400/[0.04] px-2 py-0.5 text-[9px] font-mono font-medium text-emerald-400/90 hover:bg-emerald-400/10 hover:text-emerald-400 hover:border-emerald-400/30 transition-all cursor-pointer group active:scale-95"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Click detected! User:', user.username, 'ID:', user.id);
                  navigate(`/user/${user.id}`);
                }}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Online indicator */}
                <div className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)] flex-shrink-0" />
                
                {/* Username */}
                <span className="truncate max-w-[120px]">
                  {user.username}
                </span>
                
                {/* Role badge */}
                {(user.role === 'admin' || user.role === 'moderator') && (
                  <div className="flex-shrink-0">
                    {getRoleIcon(user.role)}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
