import { useState, useEffect } from 'react';
import { Trophy, Crown, ChevronRight, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForumContext } from '@/context/ForumContext';
import { supabase } from '@/lib/supabase';
import { getUserAvatar } from '@/lib/avatar';
import { User } from '@/types/forum';
import { cache, CacheKeys, CacheTTL, withCache } from '@/lib/cache';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { getCalculatedReputation, getUserProfile } = useForumContext();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Fetch top users from Supabase with caching
    const fetchTopUsers = async () => {
      try {
        const users = await withCache(
          CacheKeys.leaderboard(10),
          CacheTTL.MEDIUM, // 5 minutes cache
          async () => {
            const { data, error } = await supabase
              .from('forum_users')
              .select('*')
              .order('reputation', { ascending: false })
              .limit(10);

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

        setUsers(users);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    };

    fetchTopUsers();

    // Refresh every 5 minutes instead of realtime
    const interval = setInterval(fetchTopUsers, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const leaderboard = [...users]
    .sort((a, b) => getCalculatedReputation(b.id) - getCalculatedReputation(a.id))
    .slice(0, 5);

  return (
    <div className="hud-panel overflow-hidden">
      <div className="border-b border-forum-border px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Trophy size={11} className="text-primary" />
          <h4 className="text-[10px] font-bold text-forum-text font-mono uppercase tracking-wider">
            Top Contributors
          </h4>
        </div>
        <a href="#" className="text-[8px] font-mono text-forum-muted hover:text-primary transition-forum flex items-center gap-0.5">
          All <ChevronRight size={8} />
        </a>
      </div>
      <div className="p-2 space-y-[2px]">
        {leaderboard.map((user, idx) => (
          <div
            key={user.id}
            onClick={() => navigate(`/user/${user.id}`)}
            className={`flex items-center gap-2.5 rounded px-2 py-1.5 hover:bg-forum-hover transition-forum cursor-pointer group ${idx === 0 ? 'bg-primary/5' : ''
              }`}
          >
            {/* Rank */}
            <span className={`text-[10px] font-mono font-bold w-5 text-center flex-shrink-0 ${idx === 0 ? 'text-primary' : idx === 1 ? 'text-white' : idx === 2 ? 'text-white' : 'text-forum-muted/50'
              }`}>
              {idx === 0 ? (
                <div className="flex h-5 w-5 items-center justify-center  bg-gradient-to-br from-forum-pink/25 to-forum-pink/10 border border-primary/40 animate-featured-glow">
                  <Crown size={10} className="text-primary drop-shadow-[0_0_3px_rgba(255,45,146,0.6)]" />
                </div>
              ) : idx === 1 ? (
                <div className="flex h-5 w-5 items-center justify-center  bg-cyan-500/10 border border-cyan-500/25">
                  <span className="text-[9px]">2</span>
                </div>
              ) : idx === 2 ? (
                <div className="flex h-5 w-5 items-center justify-center  bg-amber-500/10 border border-amber-500/25">
                  <span className="text-[9px]">3</span>
                </div>
              ) : `#${idx + 1}`}
            </span>

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={user.avatar || getUserAvatar('', user.username)}
                alt={user.username}
                className={`h-6 w-6 rounded object-cover border ${idx === 0 ? 'border-primary/40' : 'border-forum-border'
                  }`}
              />
              {user.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5  border border-forum-card bg-emerald-400" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono font-semibold text-forum-text truncate group-hover:text-primary transition-forum">
                {user.username}
              </div>
            </div>

            {/* Reputation */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Flame size={8} className={idx === 0 ? 'text-primary' : 'text-forum-muted/40'} />
              <span className={`text-[10px] font-mono font-semibold ${idx === 0 ? 'text-primary' : 'text-forum-text'
                }`}>
                {getCalculatedReputation(user.id).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
