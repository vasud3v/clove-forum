import { useNavigate } from 'react-router-dom';
import { User } from '@/types/forum';
import { MessageSquare, Settings, ChevronRight, Zap, Bookmark, Bell, TrendingUp, LogIn } from 'lucide-react';
import { useForumContext } from '@/context/ForumContext';
import { useAuth } from '@/context/AuthContext';
import { getUserAvatar } from '@/lib/avatar';

interface UserProfileMiniCardProps {
  user: User;
}

export default function UserProfileMiniCard({ user }: UserProfileMiniCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    getUserProfile, 
    getCalculatedReputation, 
    getReputationChange24h,
    getAllThreads
  } = useForumContext();
  const profileCustom = getUserProfile(user.id);
  // Use custom profile data if available (for current user), otherwise use user prop data
  const displayAvatar = user.avatar;
  const displayBanner = profileCustom.banner || user.banner;
  const calculatedRep = getCalculatedReputation(user.id);
  const repChange = getReputationChange24h(user.id);
  
  // Calculate real counts
  const allThreads = getAllThreads();
  const myThreadsCount = allThreads.filter(t => t.author.id === user.id).length;
  // Note: Bookmarks are for posts, not threads, so we can't easily count them here
  // This would require fetching all posts which is expensive
  const bookmarksCount = 0; // TODO: Implement post bookmarks count when needed
  
  // TODO: Implement badges and notifications systems
  const badgesCount = 0; // Will be implemented when badges system is added
  const notificationsCount = 0; // Will be implemented when notifications system is added

  // Show login prompt when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="hud-panel overflow-hidden">
        <div className="relative h-14 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-forum-pink/20 via-forum-card to-forum-pink/10" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,45,146,0.15) 2px, rgba(255,45,146,0.15) 4px)',
            }}
          />
        </div>
        <div className="px-3 py-4 text-center -mt-3">
          <div className="h-12 w-12  border-2 border-forum-border bg-forum-bg mx-auto mb-3 flex items-center justify-center">
            <LogIn size={18} className="text-forum-muted" />
          </div>
          <p className="text-[11px] text-forum-muted font-mono mb-3">
            Sign in to access your profile
          </p>
          <button
            onClick={() => navigate('/login')}
            className="transition-forum w-full flex items-center justify-center gap-1.5  bg-primary px-3 py-2 text-[11px] font-mono font-bold text-white hover:bg-primary/90 hover:shadow-brutal-sm"
          >
            <LogIn size={12} />
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="transition-forum w-full mt-2 flex items-center justify-center gap-1.5  border border-forum-border px-3 py-2 text-[11px] font-mono font-medium text-forum-muted hover:border-primary/40 hover:text-primary hover:bg-forum-hover"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hud-panel overflow-hidden">
      {/* Top banner */}
      <div
        className="relative h-14 overflow-hidden cursor-pointer"
        onClick={() => navigate(`/user/${user.id}`)}
      >
        {displayBanner ? (
          <>
            <img
              src={displayBanner}
              alt="Profile banner"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                console.error('Mini card banner failed to load:', displayBanner);
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-forum-card/30" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-forum-pink/20 via-forum-card to-forum-pink/10" />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,45,146,0.15) 2px, rgba(255,45,146,0.15) 4px)',
              }}
            />
          </>
        )}
        <button className="absolute top-2 right-2 p-1 rounded text-forum-muted/50 hover:text-primary transition-forum hover:bg-forum-bg/50">
          <Settings size={11} />
        </button>
      </div>

      {/* Avatar overlapping banner */}
      <div className="px-3 -mt-6 relative z-10">
        <div className="flex items-end gap-2.5">
          <div className="relative flex-shrink-0">
            <img
              src={displayAvatar}
              alt={user.username}
              className="h-12 w-12  border-2 border-primary/30 object-cover shadow-brutal-sm"
            />
            {user.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3  border-2 border-forum-card bg-emerald-400" />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-0.5">
            <h3
              className="text-[12px] font-bold text-forum-text font-mono truncate hover:text-primary transition-forum cursor-pointer"
              onClick={() => navigate(`/user/${user.id}`)}
            >
              {user.username}
            </h3>
            {user.rank && (
              <span className="badge-shine inline-flex items-center gap-1  border border-primary/30 bg-primary to-forum-pink/5 px-1.5 py-[3px] text-[8px] font-mono font-bold text-primary uppercase tracking-wider badge-glow-pink">
                <Zap size={8} className="drop-shadow-[0_0_3px_rgba(255,45,146,0.5)]" />
                {user.rank}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-[1px] mx-3 mt-3 mb-2.5 rounded overflow-hidden border border-forum-border">
        <div className="bg-forum-bg/80 px-2 py-1.5 text-center">
          <div className="text-[11px] font-bold text-forum-text font-mono">{user.postCount.toLocaleString()}</div>
          <div className="text-[7px] text-forum-muted font-mono uppercase tracking-wider">Posts</div>
        </div>
        <div className="bg-forum-bg/80 px-2 py-1.5 text-center border-x border-forum-border">
          <div className="flex items-center justify-center gap-0.5">
            <div className="text-[11px] font-bold text-primary font-mono">{calculatedRep.toLocaleString()}</div>
            {repChange > 0 && (
              <TrendingUp size={8} className="text-emerald-400" />
            )}
          </div>
          <div className="text-[7px] text-forum-muted font-mono uppercase tracking-wider">
            Rep
            {repChange > 0 && (
              <span className="text-emerald-400 ml-0.5">+{repChange}</span>
            )}
          </div>
        </div>
        <div className="bg-forum-bg/80 px-2 py-1.5 text-center">
          <div className="text-[11px] font-bold text-forum-text font-mono">{badgesCount}</div>
          <div className="text-[7px] text-forum-muted font-mono uppercase tracking-wider">Badges</div>
        </div>
      </div>

      {/* XenForo-style public metadata */}
      <div className="px-4 py-3 bg-forum-bg/50 border-t border-forum-border/30 flex flex-col gap-1.5 mt-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-forum-muted/70">Joined:</span>
          <span className="text-forum-text/90 font-medium">
            {new Date(user.joinDate || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-forum-muted/70">Messages:</span>
          <span className="text-forum-text/90 font-medium">{user.postCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-forum-muted/70">Last Activity:</span>
          <span className="text-forum-text/90 font-medium flex items-center gap-1">
            {user.isOnline ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5  bg-emerald-400 animate-pulse"></span>
                Viewing now
              </span>
            ) : (
              'Recently'
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
