import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pin,
  Lock,
  Flame,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { Thread } from '@/types/forum';
import { useForumContext } from '@/context/ForumContext';
import { getUserAvatar } from '@/lib/avatar';
import { formatTimeAgo } from '@/lib/forumUtils';

interface ThreadRowProps {
  thread: Thread;
}

export default function ThreadRow({ thread }: ThreadRowProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  // Use avatars directly from thread data - they're already loaded from forum_users table
  const displayAvatar = thread.author.avatar || getUserAvatar('', thread.author.username);
  const displayLastReplyByAvatar = thread.lastReplyBy.avatar || getUserAvatar('', thread.lastReplyBy.username);

  // Calculate total pages (assuming 20 posts per page)
  const postsPerPage = 20;
  const totalPages = Math.ceil((thread.replyCount + 1) / postsPerPage);
  
  // Get last 3 pages to display
  const pagesToShow = totalPages > 3 
    ? [totalPages - 2, totalPages - 1, totalPages]
    : Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div
      onClick={() => navigate(`/thread/${thread.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="transition-all duration-150 group relative border-b border-forum-border/20 cursor-pointer last:border-b-0 bg-transparent hover:bg-forum-hover/30"
    >
      {/* Left accent bar for pinned */}
      {thread.isPinned && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary" />
      )}

      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Thread Thumbnail - 75x50 - Only show if uploaded */}
        {thread.thumbnail && (
          <div className="relative flex-shrink-0">
            <img
              src={thread.thumbnail}
              alt={thread.title}
              className="w-[75px] h-[50px] rounded object-cover border border-forum-border/40"
              style={{
                backgroundColor: '#1a1a1a'
              }}
            />
            {thread.hasUnread && (
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5  bg-primary" />
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Title Row */}
          <div className="flex items-center gap-2">
            {/* Thread Title */}
            <h3 className="text-[17px] font-normal text-forum-text group-hover:text-primary transition-colors truncate flex-1">
              {thread.title}
            </h3>

            {/* Status Icons */}
            {thread.isPinned && (
              <Pin size={14} className="text-forum-muted flex-shrink-0" />
            )}
            {thread.isLocked && (
              <Lock size={14} className="text-amber-500 flex-shrink-0" />
            )}
            {thread.isHot && (
              <Flame size={14} className="text-orange-700 flex-shrink-0" />
            )}
          </div>

          {/* Meta Info Row */}
          <div className="flex items-center gap-2 text-[13px] text-forum-muted">
            {/* Author */}
            <span
              className="text-amber-600 hover:text-amber-500 transition-colors cursor-pointer flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/user/${thread.author.id}`);
              }}
            >
              {thread.author.username}
              {thread.author.role === 'admin' && (
                <Shield size={11} className="text-amber-600" />
              )}
            </span>

            <span className="text-forum-border/60">·</span>

            {/* Created Date */}
            <time className="text-[13px]">
              {formatTimeAgo(thread.createdAt)}
            </time>
            
            {/* Page Numbers - Show last 3 pages */}
            {totalPages > 1 && (
              <>
                <span className="text-forum-border/60 hidden sm:inline">·</span>
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/thread/${thread.id}?page=1`);
                    }}
                    className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded text-[11px] font-medium bg-forum-card/50 border border-forum-border/30 text-forum-text hover:bg-primary hover:text-white hover:border-primary transition-all"
                  >
                    1
                  </button>
                  {totalPages > 4 && (
                    <span className="text-[11px] text-forum-muted px-0.5">...</span>
                  )}
                  {pagesToShow.map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/thread/${thread.id}?page=${pageNum}`);
                      }}
                      className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded text-[11px] font-medium bg-forum-card/50 border border-forum-border/30 text-forum-text hover:bg-primary hover:text-white hover:border-primary transition-all"
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/thread/${thread.id}?page=${totalPages + 1}`);
                    }}
                    className="flex items-center gap-0.5 px-2 h-[20px] rounded text-[11px] font-medium bg-forum-card/50 border border-forum-border/30 text-forum-text hover:bg-primary hover:text-white hover:border-primary transition-all"
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="hidden md:flex flex-col items-end gap-0.5 min-w-[80px] flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-forum-muted">
            <span>Replies:</span>
            <span className="text-forum-text font-semibold">{thread.replyCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-forum-muted">
            <span>Views:</span>
            <span className="text-forum-text font-semibold">
              {thread.viewCount >= 1000 ? `${(thread.viewCount / 1000).toFixed(0)}K` : thread.viewCount}
            </span>
          </div>
        </div>

        {/* Last Activity Section */}
        <div className="hidden lg:flex items-center gap-2.5 w-[140px] flex-shrink-0 pl-3 border-l border-forum-border/30">
          <div className="flex flex-col min-w-0 flex-1 text-right">
            <time className="text-[11px] text-forum-muted">
              {formatTimeAgo(thread.lastReplyAt)}
            </time>
            <span
              className="text-[13px] text-forum-text truncate hover:text-primary cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/user/${thread.lastReplyBy.id}`);
              }}
            >
              {thread.lastReplyBy.username}
            </span>
          </div>
          <img
            src={displayLastReplyByAvatar}
            alt={thread.lastReplyBy.username}
            className="h-9 w-9  object-cover border border-forum-border/40 cursor-pointer flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/user/${thread.lastReplyBy.id}`);
            }}
          />
        </div>

        {/* Mobile Stats */}
        <div className="flex md:hidden flex-col items-end gap-0.5 text-[11px] text-forum-muted">
          <div className="flex items-center gap-1">
            <span className="text-[10px]">R:</span>
            <span className="text-forum-text font-semibold">{thread.replyCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">V:</span>
            <span className="text-forum-text font-semibold">
              {thread.viewCount >= 1000 ? `${(thread.viewCount / 1000).toFixed(0)}K` : thread.viewCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
