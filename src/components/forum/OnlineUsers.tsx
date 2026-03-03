import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Crown, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUserAvatar } from '@/lib/avatar';
import { useForumContext } from '@/context/ForumContext';
import { User } from '@/types/forum';
import { cache, CacheKeys, CacheTTL, withCache } from '@/lib/cache';

export default function OnlineUsers() {
  const navigate = useNavigate();
  const { getUserProfile } = useForumContext();
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    // Fetch online users from Supabase with caching
    const fetchOnlineUsers = async () => {
      try {
        const users = await withCache(
          CacheKeys.onlineUsers(),
          CacheTTL.SHORT, // 30 seconds cache
          async () => {
            const { data, error } = await supabase
              .from('forum_users')
              .select('*')
              .eq('is_online', true)
              .order('reputation', { ascending: false })
              .limit(20);

            if (error) throw error;
            
            return data?.map(user => ({
              id: user.id,
              username: user.username,
              avatar: user.avatar,
              postCount: user.post_count,
              reputation: user.reputation,
              joinDate: user.join_date,
              isOnline: user.is_online,
              rank: user.rank,
              role: user.role || 'member',
            })) || [];
          }
        );
        
        setOnlineUsers(users);
      } catch (error) {
        console.error('Failed to fetch online users:', error);
      }
    };

    fetchOnlineUsers();

    // Poll every 30 seconds instead of realtime for better performance
    const interval = setInterval(fetchOnlineUsers, 30000);

    // Subscribe to realtime only for is_online changes (filtered)
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
          // Invalidate cache and refetch
          cache.invalidate(CacheKeys.onlineUsers());
          fetchOnlineUsers();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <Crown size={8} className="text-amber-600" />;
    if (role === 'moderator') return <Zap size={8} className="text-blue-600" />;
    return null;
  };

  return (
    <div className="hud-panel overflow-hidden">
      <div className="border-b border-forum-border px-3 py-2.5 flex items-center justify-between bg-gradient-to-r from-emerald-500/5 to-transparent">
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Wifi size={11} className="text-emerald-700 drop-shadow-[0_0_4px_rgba(52,211,153,0.4)]" />
            <div className="absolute inset-0 animate-ping opacity-20">
              <Wifi size={11} className="text-emerald-700" />
            </div>
          </div>
          <h4 className="text-[10px] font-bold text-forum-text font-mono uppercase tracking-wider">Online Now</h4>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex h-1.5 w-1.5  bg-emerald-600 animate-pulse shadow-[0_0_4px_rgba(5,150,105,0.6)]" />
          <span className="flex h-5 min-w-[20px] items-center justify-center  bg-gradient-to-r from-emerald-700/20 to-emerald-700/10 border border-emerald-700/30 px-1.5 text-[9px] font-bold text-black font-mono shadow-[inset_0_0_8px_rgba(5,150,105,0.1)]">
            {onlineUsers.length}
          </span>
        </div>
      </div>
      <div className="p-3">
        {onlineUsers.length === 0 ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-1.5">
              <div className="h-8 w-8  bg-forum-bg/50 border border-forum-border/50 flex items-center justify-center">
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
                className="inline-flex items-center gap-1  border border-emerald-700/20 bg-emerald-700/[0.04] px-2 py-0.5 text-[9px] font-mono font-medium text-black hover:bg-emerald-700/10 hover:text-black hover:border-emerald-700/30 transition-all cursor-pointer group active:scale-95"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Click detected! User:', user.username, 'ID:', user.id);
                  navigate(`/user/${user.id}`);
                }}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Online indicator */}
                <div className="flex h-1.5 w-1.5  bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)] flex-shrink-0" />
                
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
