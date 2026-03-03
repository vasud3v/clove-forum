import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pin, Lock, Flame, Eye, MessageCircle, Clock,
  Share2, Bell, BellOff,
  CheckCircle2, TrendingUp, Edit,
} from 'lucide-react';
import RoleBadge from '@/components/forum/RoleBadge';
import { Thread, Category, UserRole } from '@/types/forum';
import { formatDate, getRankColor, getRankIcon } from '@/lib/forumUtils';
import { useForumContext } from '@/context/ForumContext';
import { getUserAvatar } from '@/lib/avatar';
import EditThreadModal from '@/components/forum/EditThreadModal';

interface ThreadHeaderProps {
  thread: Thread;
  category: Category;
  isWatching: boolean;
  onToggleWatch: () => void;
  onShare: () => void;
}

export default function ThreadHeader({
  thread,
  category,
  isWatching,
  onToggleWatch,
  onShare,
}: ThreadHeaderProps) {
  const navigate = useNavigate();
  const { getUserProfile, currentUser } = useForumContext();
  const isSolved = thread.tags?.some((t) => t.toLowerCase() === 'solved');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  // Check if banner is from Supabase Storage (which is broken)
  const isSupabaseStorageBanner = thread.banner?.includes('supabase.co/storage');

  useEffect(() => {
    setBannerError(false);
    // Auto-hide Supabase Storage banners since they don't work
    if (isSupabaseStorageBanner) {
      console.warn('Supabase Storage banner detected (broken):', thread.banner);
      setBannerError(true);
    }
  }, [thread.banner, isSupabaseStorageBanner]);
  
  // Check if current user is the thread author
  const isAuthor = currentUser.id === thread.author.id;

  return (
    <>
      <div className="hud-panel overflow-hidden">
        {/* Banner with overlaid content */}
        <div className="relative">
          {/* Banner Image Background */}
          {thread.banner && !bannerError ? (
            <>
              <div className="absolute inset-0 h-64 overflow-hidden">
                <img
                  src={thread.banner}
                  alt="Thread banner"
                  className="w-full h-full object-cover object-center"
                  style={{ objectPosition: 'center 35%' }}
                  onError={(e) => {
                    console.error('Banner image failed to load:', thread.banner);
                    setBannerError(true);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => console.log('Banner loaded successfully:', thread.banner)}
                />
              </div>
              {/* Dark gradient overlay for text readability */}
              <div className="absolute inset-0 h-64 bg-background via-black/30 to-forum-card pointer-events-none" />
            </>
          ) : thread.banner && bannerError ? (
            <>
              <div className="absolute inset-0 h-64 bg-gradient-to-br from-forum-card via-forum-bg to-forum-card" />
              <div className="absolute inset-0 h-64 flex items-center justify-center">
                <div className="text-center text-forum-muted/40">
                  <div className="text-[10px] font-mono mb-1">Banner unavailable</div>
                  {isAuthor && isSupabaseStorageBanner && (
                    <div className="text-[9px] font-mono text-primary/60">
                      Click "Edit" to upload a new banner
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* No banner - show gradient background */
            <div className="absolute inset-0 h-64 bg-gradient-to-br from-forum-card via-forum-bg to-forum-card" />
          )}
          
          {/* Content overlaid on banner - positioned at bottom */}
          <div className="relative px-5 py-5 min-h-[16rem] flex flex-col justify-end">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {thread.isPinned && (
                <span className="badge-shine inline-flex items-center gap-1.5  bg-primary to-forum-pink/10 border border-primary/40 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-primary badge-glow-pink">
                  <Pin size={11} className="drop-shadow-[0_0_3px_rgba(255,45,146,0.6)]" />
                  Pinned
                </span>
              )}
              {thread.isLocked && (
                <span className="badge-shine inline-flex items-center gap-1.5  bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/35 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 badge-glow-amber">
                  <Lock size={11} className="drop-shadow-[0_0_3px_rgba(245,158,11,0.6)]" />
                  Locked
                </span>
              )}
              {thread.isHot && (
                <span className="badge-shine inline-flex items-center gap-1.5  bg-gradient-to-br from-orange-500/35 via-red-500/28 to-amber-500/18 border border-orange-500/65 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-orange-300 badge-glow-orange shadow-brutal shadow-orange-500/35 hover:shadow-orange-500/55 transition-all duration-250">
                  <Flame size={12} className="animate-flame text-orange-300 drop-shadow-[0_0_5px_rgba(249,115,22,0.7)]" />
                  <span className="bg-gradient-to-r from-orange-300 via-red-300 to-orange-200 bg-clip-text text-transparent font-extrabold">
                    Hot
                  </span>
                </span>
              )}
              {isSolved && (
                <span className="badge-shine inline-flex items-center gap-1.5  bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 badge-glow-emerald">
                  <CheckCircle2 size={11} className="drop-shadow-[0_0_3px_rgba(52,211,153,0.6)]" />
                  Solved
                </span>
              )}
              {thread.replyCount > 100 && (
                <span className="badge-shine inline-flex items-center gap-1.5  bg-gradient-to-r from-cyan-500/15 to-blue-500/10 border border-cyan-500/35 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-600 badge-glow-cyan">
                  <TrendingUp size={11} className="drop-shadow-[0_0_3px_rgba(34,211,238,0.6)]" />
                  Popular
                </span>
              )}
            </div>

          {/* Title */}
          <h1 className="text-[20px] font-bold text-forum-text font-mono leading-tight mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {thread.title}
          </h1>

          {/* Thread meta */}
          <div className="flex items-center gap-3 flex-wrap drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-2">
              <img
                src={thread.author.avatar || getUserAvatar('', thread.author.username)}
                alt={thread.author.username}
                className="h-7 w-7  border border-forum-border object-cover"
              />
              <span className="text-[11px] font-mono font-semibold text-forum-text">
                {thread.author.username}
              </span>
              {thread.author.rank && (
                <span
                  className={`badge-shine inline-flex items-center gap-0.5  border px-1.5 py-[2px] text-[8px] font-mono font-bold uppercase tracking-wider ${getRankColor(thread.author.rank)}`}
                >
                  {getRankIcon(thread.author.rank)}
                  {thread.author.rank}
                </span>
              )}
              <RoleBadge role={(thread.author.role as UserRole) || 'member'} size="sm" />
            </div>
            <span className="text-forum-muted/30">·</span>
            <span className="text-[10px] text-forum-muted font-mono flex items-center gap-1">
              <Clock size={9} />
              {formatDate(thread.createdAt)}
            </span>
          </div>

          {/* Stats bar */}
          <div className="mt-4 flex items-center gap-4 flex-wrap drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted">
              <Eye size={11} className="text-forum-muted/60" />
              <span className="font-semibold text-forum-text">
                {thread.viewCount.toLocaleString()}
              </span>{' '}
              views
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted">
              <MessageCircle size={11} className="text-forum-muted/60" />
              <span className="font-semibold text-forum-text">
                {thread.replyCount}
              </span>{' '}
              replies
            </div>

            {/* Tags */}
            {thread.tags && thread.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {thread.tags.map((tag) => (
                  <span
                    key={tag}
                    className=" border border-primary/15 bg-primary/[0.05] px-2 py-0.5 text-[9px] font-mono font-medium text-black hover:bg-primary/10 hover:text-primary transition-forum cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 ml-auto flex-wrap">
              {isAuthor && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="transition-forum flex items-center gap-1  px-2.5 py-1 text-[10px] font-mono text-forum-muted border border-forum-border/30 hover:text-primary hover:bg-primary/5 hover:border-primary/25"
                >
                  <Edit size={11} />
                  Edit
                </button>
              )}
              
              <button
                onClick={onToggleWatch}
                className={`transition-forum flex items-center gap-1  px-2.5 py-1 text-[10px] font-mono border ${isWatching
                  ? 'text-primary bg-primary/10 border-primary/25'
                  : 'text-forum-muted hover:text-primary hover:bg-primary/5 border-forum-border/30'
                  }`}
              >
                {isWatching ? <BellOff size={11} /> : <Bell size={11} />}
                {isWatching ? 'Watching' : 'Watch'}
              </button>

              <button
                onClick={onShare}
                className="transition-forum flex items-center gap-1  px-2.5 py-1 text-[10px] font-mono text-forum-muted border border-forum-border/30 hover:text-primary hover:bg-primary/5"
              >
                <Share2 size={11} />
                Share
              </button>
            </div>
            </div>
          </div>
        </div>
        <div className="h-[1px] bg-gradient-to-r from-transparent via-forum-pink/40 to-transparent" />
      </div>
      
      {/* Edit Thread Modal */}
      <EditThreadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        threadId={thread.id}
      />
    </>
  );
}
