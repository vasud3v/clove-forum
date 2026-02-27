import { useState, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pin,
  Lock,
  Eye,
  MessageCircle,
  Share2,
  Flag,
  Clock,
  Zap,
  Star,
} from 'lucide-react';
import { Thread } from '@/types/forum';
import { useForumContext } from '@/context/ForumContext';
import { formatTimeAgo } from '@/lib/forumUtils';
import { toast } from '@/components/forum/Toast';

interface ThreadRowProps {
  thread: Thread;
}

function ThreadRow({ thread }: ThreadRowProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const { voteThread, getThreadVote, getUserProfile } = useForumContext();
  const threadVote = getThreadVote(thread.id);
  const voteScore = thread.upvotes - thread.downvotes;

  const authorProfile = getUserProfile(thread.author.id);
  const displayAvatar = authorProfile.avatar || thread.author.avatar;

  const lastReplyByProfile = getUserProfile(thread.lastReplyBy.id);
  const displayLastReplyByAvatar = lastReplyByProfile.avatar || thread.lastReplyBy.avatar;

  const handleVote = async (direction: 'up' | 'down') => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      voteThread(thread.id, direction);
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/thread/${thread.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="transition-forum group relative border-b border-forum-border/20 cursor-pointer last:border-b-0 bg-transparent hover:bg-forum-card-alt/30"
    >
      {/* Left accent bar for pinned */}
      {thread.isPinned && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-forum-pink/40" />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 min-h-[64px]">

        {/* Mobile top row: Avatar + Title + Badges */}
        <div className="flex items-start gap-3 flex-1 min-w-0">

          {/* Avatar Area */}
          <div className="relative flex-shrink-0 mt-0.5">
            <img
              src={displayAvatar}
              alt={thread.author.username}
              className={`h-10 w-10 sm:h-11 sm:w-11 rounded-md border object-cover transition-colors cursor-pointer ${isHovered ? 'border-forum-pink/50' : 'border-forum-border/40'
                }`}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/user/${thread.author.id}`);
              }}
              title={`View ${thread.author.username}'s profile`}
            />
            {thread.author.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-[2px] border-forum-card bg-emerald-400" />
            )}
            {/* Unread indicator overlaid or nearby */}
            {thread.hasUnread && (
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-forum-card bg-forum-pink" title="Unread posts" />
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">

            <div className="flex items-center gap-2 flex-wrap mb-1">
              {/* Badges */}
              {thread.isPinned && (
                <span className="inline-flex items-center gap-1 rounded bg-forum-pink/10 px-1.5 py-[2px] text-[9px] font-mono font-bold text-forum-pink">
                  <Pin size={10} />
                  Pinned
                </span>
              )}
              {thread.isLocked && (
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-[2px] text-[9px] font-mono font-bold text-amber-500">
                  <Lock size={10} />
                  Locked
                </span>
              )}
              {thread.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-[2px] text-[9px] font-mono font-bold text-emerald-400">
                  <Star size={10} />
                  Featured
                </span>
              )}

              {/* Thread title */}
              <h4 className="text-[14px] sm:text-[15px] font-semibold text-forum-text flex-1 min-w-0 truncate group-hover:text-forum-pink transition-colors">
                {thread.title}
              </h4>
            </div>

            {/* Meta Info Line */}
            <div className="flex items-center flex-wrap gap-2 text-[11px] font-mono text-forum-muted">
              <span
                className="hover:text-forum-pink transition-colors cursor-pointer text-forum-text/80"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/user/${thread.author.id}`);
                }}
              >
                {thread.author.username}
              </span>
              <span className="text-forum-border/60">•</span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {formatTimeAgo(thread.createdAt)}
              </span>

              {/* Tags inline */}
              {thread.tags && thread.tags.length > 0 && (
                <>
                  <span className="text-forum-border/60 hidden sm:inline">•</span>
                  <div className="hidden sm:flex items-center gap-1.5">
                    {thread.tags.filter(t => t.toLowerCase() !== 'solved').map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-forum-pink/70 hover:text-forum-pink transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          // navigate(`/tag/${tag}`);
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Mobile Stats (Hidden on desktop) */}
            <div className="flex sm:hidden items-center gap-3 mt-1.5 text-[10px] font-mono text-forum-muted">
              <span className="flex items-center gap-1"><MessageCircle size={10} />{thread.replyCount}</span>
              <span className="flex items-center gap-1"><Eye size={10} />{thread.viewCount.toLocaleString()}</span>
              {thread.lastReplyAt && (
                <span className="flex items-center gap-1 ml-auto">
                  <Zap size={10} /> {formatTimeAgo(thread.lastReplyAt)}
                </span>
              )}
            </div>

          </div>
        </div>

        {/* Desktop Columns: Stats & Last Post */}
        <div className="hidden sm:flex items-center gap-6 flex-shrink-0">

          {/* Stats Column */}
          <div className="flex flex-col items-end justify-center w-[80px] text-right">
            <div className="text-[12px] font-mono font-medium text-forum-text/90">
              Replies: <span className={`${thread.replyCount > 50 ? 'text-forum-pink' : ''}`}>{thread.replyCount}</span>
            </div>
            <div className="text-[11px] font-mono text-forum-muted">
              Views: {thread.viewCount.toLocaleString()}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-forum-border/30" />

          {/* Last Post Column */}
          <div className="flex items-center gap-2.5 w-[160px] pl-1">
            <img
              src={displayLastReplyByAvatar}
              alt={thread.lastReplyBy.username}
              className="h-8 w-8 rounded-md object-cover border border-forum-border/40 cursor-pointer hidden md:block"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/user/${thread.lastReplyBy.id}`);
              }}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-mono text-forum-text/80 truncate">
                {formatTimeAgo(thread.lastReplyAt)}
              </span>
              <span
                className="text-[11px] font-mono font-medium text-forum-text truncate hover:text-forum-pink cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/user/${thread.lastReplyBy.id}`);
                }}
              >
                {thread.lastReplyBy.username}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Quick actions (visible on hover) */}
      <div
        className="flex items-center gap-0.5 transition-forum absolute right-3 top-3 bg-forum-card/95 backdrop-blur-sm border border-forum-border/50 rounded-md px-1 py-0.5 shadow-lg"
        style={{
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateX(0)' : 'translateX(8px)',
          pointerEvents: isHovered ? 'auto' : 'none',
        }}
      >
        <button
          onClick={(e) => e.stopPropagation()}
          className="transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-pink/10 hover:text-forum-pink"
          title="Share"
        >
          <Share2 size={12} />
        </button>
        <button
          onClick={(e) => e.stopPropagation()}
          className="transition-forum rounded p-1.5 text-forum-muted hover:bg-red-500/10 hover:text-red-400"
          title="Report"
        >
          <Flag size={12} />
        </button>
      </div>
    </div>
  );
}

export default memo(ThreadRow);
