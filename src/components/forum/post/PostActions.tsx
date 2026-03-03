import { memo, useState, useCallback, useRef, useEffect } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Flag,
  History,
  Bookmark,
  Share2,
  Pencil,
  Trash2,
  Reply,
  Quote,
  Plus,
  ChevronDown as DropdownIcon,
} from 'lucide-react';
import { PostData } from '@/types/forum';
import { useForumContext } from '@/context/ForumContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '../Toast';
import PostEditModal from './PostEditModal';
import PostReportModal from './PostReportModal';
import PostEditHistoryModal from '../PostEditHistoryModal';
import { getVoteScoreColor, formatVoteScore } from '@/lib/forumUtils';

interface PostActionsProps {
  post: PostData;
  isOwnPost: boolean;
  isBookmarked: boolean;
  requireEditReason: boolean;
  threadId: string;
  currentUserId: string;
  onQuote: (author: string, content: string) => void;
  onEdit: (postId: string, newContent: string, reason?: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onReport?: (postId: string, reason: string, details: string) => Promise<void>;
  onBookmark?: (postId: string) => Promise<void>;
  onReplyToPost?: (postId: string) => void;
  onAddToMultiQuote?: (post: PostData) => void;
}

const PostActions = memo(({
  post,
  isOwnPost,
  isBookmarked,
  requireEditReason,
  threadId,
  currentUserId,
  onQuote,
  onEdit,
  onDelete,
  onReport,
  onBookmark,
  onReplyToPost,
  onAddToMultiQuote,
}: PostActionsProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [showQuoteMenu, setShowQuoteMenu] = useState(false);
  const quoteMenuRef = useRef<HTMLDivElement>(null);

  // Close quote menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quoteMenuRef.current && !quoteMenuRef.current.contains(event.target as Node)) {
        setShowQuoteMenu(false);
      }
    };

    if (showQuoteMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showQuoteMenu]);

  const { canManagePosts } = usePermissions();
  const { votePost, getPostVote } = useForumContext();
  
  const canEditDelete = isOwnPost || canManagePosts;
  const currentVote = getPostVote(post.id);
  const voteScore = post.upvotes - post.downvotes;

  const handleEdit = useCallback(() => {
    // Check if user is authenticated
    if (currentUserId === 'guest') {
      toast.error('Please log in to edit posts');
      return;
    }
    
    setShowEditModal(true);
  }, [currentUserId]);

  const handleSaveEdit = useCallback(async (content: string, reason?: string) => {
    await onEdit(post.id, content, reason);
    setShowEditModal(false);
  }, [onEdit, post.id]);

  const handleDelete = useCallback(async () => {
    // Check if user is authenticated
    if (currentUserId === 'guest') {
      toast.error('Please log in to delete posts');
      return;
    }
    
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      await onDelete?.(post.id);
      // Toast is handled by parent component (ThreadDetailPage)
    }
  }, [onDelete, post.id, currentUserId]);

  const handleReport = useCallback(async (reason: string, details: string) => {
    await onReport?.(post.id, reason, details);
    toast.success('Report submitted. Our moderators will review it shortly.');
    setShowReportModal(false);
  }, [onReport, post.id]);

  const handleBookmark = useCallback(async () => {
    // Check if user is authenticated
    if (currentUserId === 'guest') {
      toast.error('Please log in to bookmark posts');
      return;
    }
    
    // Toast is handled by parent component (ThreadDetailPage)
    await onBookmark?.(post.id);
  }, [onBookmark, post.id, currentUserId]);

  const handleQuote = useCallback(() => {
    // Check if user is authenticated
    if (currentUserId === 'guest') {
      toast.error('Please log in to quote posts');
      return;
    }
    
    // Check for text selection
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      onQuote(post.author.username, selectedText);
    } else {
      onQuote(post.author.username, post.content);
    }
    
    setShowQuoteMenu(false);
  }, [onQuote, post.author.username, post.content, currentUserId]);

  const handleAddToMultiQuote = useCallback(() => {
    // Check if user is authenticated
    if (currentUserId === 'guest') {
      toast.error('Please log in to use multi-quote');
      return;
    }
    
    if (onAddToMultiQuote) {
      onAddToMultiQuote(post);
      // Toast is shown in parent component
    }
    
    setShowQuoteMenu(false);
  }, [onAddToMultiQuote, post, currentUserId]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/thread/${threadId}#${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  }, [threadId, post.id]);

  const handleViewHistory = useCallback(() => {
    setShowHistoryModal(true);
  }, []);

  const handleReply = useCallback(() => {
    // Check if user is authenticated
    if (currentUserId === 'guest') {
      toast.error('Please log in to reply to posts');
      return;
    }
    
    if (onReplyToPost) {
      onReplyToPost(post.id);
    } else {
      onQuote('', ''); // Fallback to standard reply
    }
  }, [onReplyToPost, post.id, onQuote, currentUserId]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2 mt-auto border-t border-forum-border/10 bg-forum-bg/10 gap-2 sm:gap-0">
        {/* Left Actions (Voting & Report) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0 border border-forum-border/20  bg-forum-bg/50">
            <button
              onClick={async () => {
                if (currentUserId === 'guest') {
                  toast.error('Please log in to vote on posts');
                  return;
                }
                setIsVoting(true);
                try {
                  await votePost(post.id, 'up');
                } finally {
                  setIsVoting(false);
                }
              }}
              disabled={isVoting || isOwnPost}
              className={`transition-forum flex items-center gap-0.5 px-2.5 py-1 text-[11px] font-mono border-r border-forum-border/20 ${
                currentVote === 'up' 
                  ? 'text-primary bg-primary/10' 
                  : 'text-forum-muted hover:text-primary hover:bg-primary/10'
              } ${isOwnPost ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isOwnPost ? 'You cannot vote on your own post' : 'Upvote'}
            >
              <ChevronUp size={13} strokeWidth={2.5} />
            </button>
            <span className={`px-2.5 py-1 text-[11px] font-mono font-bold min-w-[36px] text-center ${getVoteScoreColor(voteScore)}`}>
              {formatVoteScore(voteScore)}
            </span>
            <button
              onClick={async () => {
                if (currentUserId === 'guest') {
                  toast.error('Please log in to vote on posts');
                  return;
                }
                setIsVoting(true);
                try {
                  await votePost(post.id, 'down');
                } finally {
                  setIsVoting(false);
                }
              }}
              disabled={isVoting || isOwnPost}
              className={`transition-forum flex items-center gap-0.5 px-2.5 py-1 text-[11px] font-mono border-l border-forum-border/20 ${
                currentVote === 'down' 
                  ? 'text-red-400 bg-red-500/10' 
                  : 'text-forum-muted hover:text-red-400 hover:bg-red-500/10'
              } ${isOwnPost ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isOwnPost ? 'You cannot vote on your own post' : 'Downvote'}
            >
              <ChevronDown size={13} strokeWidth={2.5} />
            </button>
          </div>

          {!canEditDelete && (
            <button
              onClick={() => {
                if (currentUserId === 'guest') {
                  toast.error('Please log in to report posts');
                  return;
                }
                setShowReportModal(true);
              }}
              className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-forum-muted hover:text-amber-600 transition-colors"
            >
              <Flag size={11} />
              <span className="hidden sm:inline">Report</span>
            </button>
          )}
        </div>

        {/* Right Actions (Reply, Edit, etc) */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          
          {post.version && post.version > 1 && (
            <button
              onClick={handleViewHistory}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded text-forum-muted hover:text-forum-text hover:bg-forum-card transition-colors"
              title="View Edit History"
            >
              <History size={11} />
              <span className="hidden lg:inline">History ({post.version})</span>
            </button>
          )}

          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded hover:bg-forum-card transition-colors ${
              isBookmarked ? 'text-primary' : 'text-forum-muted hover:text-forum-text'
            }`}
            title="Bookmark Post"
          >
            <Bookmark size={11} fill={isBookmarked ? 'currentColor' : 'none'} />
            <span className="hidden lg:inline">Bookmark</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded text-forum-muted hover:text-forum-text hover:bg-forum-card transition-colors"
            title="Share Post"
          >
            <Share2 size={11} />
            <span className="hidden lg:inline">Share</span>
          </button>

          {canEditDelete && (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded text-forum-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                title="Edit Post"
              >
                <Pencil size={11} />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded text-forum-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete Post"
              >
                <Trash2 size={11} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </>
          )}

          <div className="w-px h-3 bg-forum-border/30 mx-1 lg:mx-2" />

          <button
            onClick={handleReply}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold rounded text-primary hover:bg-primary/10 transition-colors"
            title="Reply to Post"
          >
            <Reply size={11} />
            Reply
          </button>

          {/* Quote Button with Dropdown */}
          <div className="relative" ref={quoteMenuRef}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowQuoteMenu(!showQuoteMenu);
              }}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold rounded text-primary hover:bg-primary/10 transition-colors"
              title="Quote Options"
            >
              <Quote size={11} />
              Quote
              <DropdownIcon size={9} />
            </button>

            {/* Dropdown Menu */}
            {showQuoteMenu && (
              <div className="absolute bottom-full mb-1 right-0 z-50 w-48 hud-panel  shadow-brutal border border-forum-border/30 overflow-hidden animate-in fade-in zoom-in duration-150">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuote();
                  }}
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-mono text-forum-text hover:bg-primary/10 transition-colors text-left"
                >
                  <Quote size={12} className="text-primary" />
                  <div>
                    <div className="font-semibold">Quote & Reply</div>
                    <div className="text-[9px] text-forum-muted">Reply with quote</div>
                  </div>
                </button>

                {onAddToMultiQuote && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddToMultiQuote();
                    }}
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-mono text-forum-text hover:bg-primary/10 transition-colors border-t border-forum-border/10 text-left"
                  >
                    <Plus size={12} className="text-primary" />
                    <div>
                      <div className="font-semibold">Add to Multi-Quote</div>
                      <div className="text-[9px] text-forum-muted">Collect multiple quotes</div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <PostEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        initialContent={post.content}
        onSave={handleSaveEdit}
        requireReason={requireEditReason}
      />

      <PostReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
      />

      <PostEditHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        postId={post.id}
        currentContent={post.content}
        currentVersion={post.version || 1}
      />
    </>
  );
});

PostActions.displayName = 'PostActions';

export default PostActions;
