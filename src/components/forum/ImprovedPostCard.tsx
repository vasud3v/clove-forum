import { useState, useRef, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Quote, History, Pencil, Bookmark, Flag, Share2,
  ChevronUp, ChevronDown, Check, X,
  AlertTriangle, Trash2, Zap, Reply
} from 'lucide-react';
import { PostData, useForumContext } from '@/context/ForumContext';
import PostEditHistoryModal from './PostEditHistoryModal';
import { toast } from './Toast';
import { usePermissions } from '@/hooks/usePermissions';
import RoleBadge from './RoleBadge';
import PostContentRenderer from './PostContentRenderer';
import { UserRole } from '@/types/forum';
import ProfileHoverCard from './ProfileHoverCard';
import { getRankColorCompact, getRankIconCompact, getReputationColor, formatReputation, getVoteScoreColor, formatVoteScore } from '@/lib/forumUtils';
import { REPORT_REASONS } from '@/lib/forumConstants';
import { AdvancedEditor } from './editor/AdvancedEditor';

// ============================================================================
// Types
// ============================================================================

interface ImprovedPostCardProps {
  post: PostData;
  index: number;
  isOP: boolean;
  currentUserId: string;
  threadAuthorId: string;
  threadId: string;
  onQuote: (author: string, content: string) => void;
  onEdit: (postId: string, newContent: string, reason?: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onReport?: (postId: string, reason: string, details: string) => Promise<void>;
  onBookmark?: (postId: string) => Promise<void>;
  isBookmarked?: boolean;
  onThreadReply?: (postId: string) => void;
  depth?: number;
}

// ============================================================================
// Edit Modal Component
// ============================================================================

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (content: string, reason?: string) => Promise<void>;
  requireReason?: boolean;
}

const EditModal = memo(({ isOpen, onClose, initialContent, onSave, requireReason }: EditModalProps) => {
  const [content, setContent] = useState(initialContent);
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim() || content.trim().length < 5) return;
    if (requireReason && !reason.trim()) return;

    setIsSaving(true);
    try {
      await onSave(content.trim(), reason.trim() || undefined);
      onClose();
    } catch (error) {
      console.error('Failed to save edit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 " onClick={onClose} />
      <div className="relative hud-panel w-full max-w-3xl max-h-[90vh] flex flex-col" style={{ overflow: 'visible' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-forum-border/20">
          <span className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
            <Pencil size={13} className="text-primary" /> Edit Post
          </span>
          <button
            onClick={onClose}
            className="text-forum-muted hover:text-forum-text transition-forum"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div>
            <label className="text-[10px] font-mono text-forum-muted uppercase tracking-wider mb-1.5 block">
              Post Content
            </label>
            <AdvancedEditor
              value={content}
              onChange={setContent}
              placeholder="Write your post content..."
              minHeight="280px"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] font-mono text-forum-muted/50">
                {content.length} chars · Min 5 characters
              </span>
              <span className="text-[9px] font-mono text-forum-muted/50">
                ~{Math.ceil(content.split(/\s+/).length / 200)} min read
              </span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-forum-muted uppercase tracking-wider mb-1.5 block">
              Edit Reason {requireReason && <span className="text-red-400">*</span>}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-forum-bg border border-forum-border/30  px-3 py-2 text-[11px] font-mono text-forum-text placeholder:text-forum-muted/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary transition-forum"
              placeholder="Brief explanation of what you changed..."
            />
            {requireReason && (
              <p className="text-[9px] font-mono text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={9} />
                Edit reason required for posts older than 5 minutes
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-forum-border/20">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="transition-forum  px-4 py-2 text-[10px] font-mono text-forum-muted border border-forum-border/30 hover:text-forum-text hover:border-forum-border/50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !content.trim() || content.trim().length < 5 || (requireReason && !reason.trim())}
            className="transition-forum  bg-primary px-4 py-2 text-[10px] font-mono font-semibold text-black hover:shadow-brutal-sm active:scale-95 border border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <div className="inline-block animate-spin  h-3 w-3 border-b border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Check size={12} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});

EditModal.displayName = 'EditModal';

// ============================================================================
// Report Modal Component
// ============================================================================

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
}

const ReportModal = memo(({ isOpen, onClose, onSubmit }: ReportModalProps) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = REPORT_REASONS;

  const handleSubmit = async () => {
    if (!reason || !details.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(reason, details.trim());
      onClose();
      setReason('');
      setDetails('');
    } catch (error) {
      console.error('Failed to submit report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 " onClick={onClose} />
      <div className="relative hud-panel w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-forum-border/20">
          <span className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
            <Flag size={13} className="text-amber-600" /> Report Post
          </span>
          <button
            onClick={onClose}
            className="text-forum-muted hover:text-forum-text transition-forum"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] font-mono text-forum-muted uppercase tracking-wider mb-1.5 block">
              Reason for Report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-forum-bg border border-forum-border/30  px-3 py-2 text-[11px] font-mono text-forum-text focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary transition-forum"
            >
              <option value="">Select a reason...</option>
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-forum-muted uppercase tracking-wider mb-1.5 block">
              Additional Details
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full h-32 bg-forum-bg border border-forum-border/30  px-3 py-2.5 text-[11px] font-mono text-forum-text placeholder:text-forum-muted/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary transition-forum resize-none"
              placeholder="Please provide specific details about why you're reporting this post..."
            />
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20  px-3 py-2">
            <p className="text-[9px] font-mono text-amber-600 leading-relaxed">
              Reports are reviewed by moderators. False reports may result in account restrictions.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-forum-border/20">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="transition-forum  px-4 py-2 text-[10px] font-mono text-forum-muted border border-forum-border/30 hover:text-forum-text hover:border-forum-border/50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason || !details.trim()}
            className="transition-forum  bg-amber-500 px-4 py-2 text-[10px] font-mono font-semibold text-black hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] active:scale-95 border border-amber-500/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <div className="inline-block animate-spin  h-3 w-3 border-b border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <Flag size={12} />
                Submit Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});

ReportModal.displayName = 'ReportModal';

// ============================================================================
// Main Component
// ============================================================================

export const ImprovedPostCard = memo(({
  post,
  index,
  isOP,
  currentUserId,
  threadAuthorId,
  threadId,
  onQuote,
  onEdit,
  onDelete,
  onReport,
  onBookmark,
  isBookmarked = false,
  onThreadReply,
  depth = 0,
}: ImprovedPostCardProps) => {
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const { canManagePosts } = usePermissions();
  const { votePost, getPostVote, getUserProfile } = useForumContext();
  
  const isOwnPost = post.author.id === currentUserId;
  const canEditDelete = isOwnPost || canManagePosts;
  const currentVote = getPostVote(post.id);
  const voteScore = post.upvotes - post.downvotes;

  const authorProfile = getUserProfile(post.author.id);
  const displayAvatar = authorProfile.avatar || post.author.avatar;

  // Check if edit reason should be required (post older than 5 minutes)
  const postAge = Date.now() - new Date(post.createdAt).getTime();
  const requireEditReason = postAge > 5 * 60 * 1000; // 5 minutes

  const handleEdit = useCallback(() => {
    setShowEditModal(true);
  }, []);

  const handleSaveEdit = useCallback(async (content: string, reason?: string) => {
    await onEdit(post.id, content, reason);
    toast.success('Post updated successfully');
  }, [onEdit, post.id]);

  const handleDelete = useCallback(async () => {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      await onDelete?.(post.id);
      toast.success('Post deleted');
    }
  }, [onDelete, post.id]);

  const handleReport = useCallback(async (reason: string, details: string) => {
    await onReport?.(post.id, reason, details);
    toast.success('Report submitted. Our moderators will review it shortly.');
  }, [onReport, post.id]);

  const handleBookmark = useCallback(async () => {
    await onBookmark?.(post.id);
    toast.success(isBookmarked ? 'Bookmark removed' : 'Post bookmarked');
  }, [onBookmark, post.id, isBookmarked]);

  const handleQuote = useCallback(() => {
    onQuote(post.author.username, post.content);
  }, [onQuote, post.author.username, post.content]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/thread/${threadId}#${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  }, [threadId, post.id]);

  const handleViewHistory = useCallback(() => {
    setShowHistoryModal(true);
  }, []);

  return (
    <>
      <div
        id={post.id}
        className="hud-panel scroll-mt-20 flex flex-col md:flex-row relative "
        style={{ zIndex: 100 - (index % 100) }}
      >
        {/* Left Column: Author Sidebar */}
        <div className="md:w-[200px] flex-shrink-0 bg-forum-bg/30 border-b md:border-b-0 md:border-r border-forum-border/20 p-4 flex flex-col items-center md:items-center">
          <div className="flex flex-row md:flex-col items-center justify-center w-full gap-4 md:gap-3">
            
            <ProfileHoverCard user={post.author}>
              <img
                src={displayAvatar}
                alt={post.author.username}
                className="h-14 w-14 md:h-24 md:w-24  border border-forum-border/50 object-cover cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
                onClick={() => navigate(`/user/${post.author.id}`)}
              />
            </ProfileHoverCard>
            
            <div className="flex flex-col flex-1 md:w-full items-start md:items-center text-left md:text-center mt-0 md:mt-1">
              <ProfileHoverCard user={post.author}>
                <span
                  className="text-[14px] md:text-[16px] font-bold tracking-wide text-forum-text hover:text-primary transition-forum cursor-pointer leading-tight mb-1 md:mb-2 inline-block relative z-20"
                  onClick={() => navigate(`/user/${post.author.id}`)}
                >
                  {post.author.username}
                </span>
              </ProfileHoverCard>
              
              <div className="flex flex-col items-start md:items-center gap-1.5 mt-1 w-full max-w-[140px]">
                {post.author.role && post.author.role !== 'member' && (
                  <div className="w-full flex justify-center">
                    <RoleBadge role={(post.author.role as UserRole) || 'member'} size="md" />
                  </div>
                )}
                
                {post.author.rank && (
                  <span className={`w-full flex justify-center items-center gap-1.5 rounded border px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider ${getRankColorCompact(post.author.rank)}`}>
                    {getRankIconCompact(post.author.rank)}
                    {post.author.rank}
                  </span>
                )}

                {post.author.reputation !== undefined && (
                  <span className={`w-full flex justify-center items-center gap-1.5 rounded border px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider ${getReputationColor(post.author.reputation)}`}>
                    <Zap size={10} />
                    {formatReputation(post.author.reputation)} Rep
                  </span>
                )}
                
                {isOP && (
                  <span className="w-full text-center text-[9px] font-bold uppercase tracking-wider px-2 py-1 bg-primary/10 border border-primary/30 rounded text-primary">
                    Original Poster
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Author Stats (Hidden on mobile) */}
          <div className="hidden md:flex flex-col w-full mt-5 space-y-2 border-t border-forum-border/20 pt-4 px-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-forum-muted/60">Joined:</span>
              <span className="text-forum-text/90 font-medium">{new Date(post.author.joinDate || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-forum-muted/60">Messages:</span>
              <span className="text-forum-text/90 font-medium">{post.author.postCount || 0}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-forum-muted/60">Reputation:</span>
              <span className="text-forum-text/90 font-medium">{(post.author.reputation || 0) > 0 ? `+${post.author.reputation}` : post.author.reputation || 0}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Post Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-forum-border/10 bg-forum-bg/20">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-forum-muted flex items-center gap-1">
                <Clock size={10} />
                {new Date(post.createdAt).toLocaleString()}
              </span>
              
              {post.editedAt && (
                <span className="text-[9px] font-mono text-forum-muted/60 flex items-center gap-1">
                  <History size={9} />
                  edited
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-forum-muted">
                #{index + 1}
              </span>
            </div>
          </div>

          {/* Post Body */}
          <div className="px-5 py-4 flex-1 flex flex-col">
            <PostContentRenderer content={post.content} />
            
            {post.editedAt && (
              <div className="mt-4 text-[10px] font-mono italic text-forum-muted/70">
                Last edited: {new Date(post.editedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>

          {/* Post Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2 mt-auto border-t border-forum-border/10 bg-forum-bg/10 gap-2 sm:gap-0">
            {/* Left Actions (Voting & Report) */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0 border border-forum-border/20  bg-forum-bg/50">
                <button
                  onClick={async () => {
                    setIsVoting(true);
                    try {
                      await votePost(post.id, 'up');
                    } finally {
                      setIsVoting(false);
                    }
                  }}
                  disabled={isVoting || isOwnPost}
                  className={`transition-forum flex items-center gap-0.5 px-2.5 py-1 text-[11px] font-mono border-r border-forum-border/20 ${currentVote === 'up' ? 'text-primary bg-primary/10' : 'text-forum-muted hover:text-primary hover:bg-primary/10'} ${isOwnPost ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isOwnPost ? 'You cannot vote on your own post' : 'Upvote'}
                >
                  <ChevronUp size={13} strokeWidth={2.5} />
                </button>
                <span className={`px-2.5 py-1 text-[11px] font-mono font-bold min-w-[36px] text-center ${getVoteScoreColor(voteScore)}`}>
                  {formatVoteScore(voteScore)}
                </span>
                <button
                  onClick={async () => {
                    setIsVoting(true);
                    try {
                      await votePost(post.id, 'down');
                    } finally {
                      setIsVoting(false);
                    }
                  }}
                  disabled={isVoting || isOwnPost}
                  className={`transition-forum flex items-center gap-0.5 px-2.5 py-1 text-[11px] font-mono border-l border-forum-border/20 ${currentVote === 'down' ? 'text-red-400 bg-red-500/10' : 'text-forum-muted hover:text-red-400 hover:bg-red-500/10'} ${isOwnPost ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isOwnPost ? 'You cannot vote on your own post' : 'Downvote'}
                >
                  <ChevronDown size={13} strokeWidth={2.5} />
                </button>
              </div>

              {!canEditDelete && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-forum-muted hover:text-amber-600 transition-colors"
                >
                  <Flag size={11} />
                  <span className="hidden sm:inline">Report</span>
                </button>
              )}
            </div>

            {/* Right Actions (Reply, Edit, etc) */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              
              {post.version > 1 && (
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded hover:bg-forum-card transition-colors ${isBookmarked ? 'text-primary' : 'text-forum-muted hover:text-forum-text'}`}
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
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded text-forum-muted hover:text-black hover:bg-blue-600/40 transition-colors"
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
                onClick={() => onQuote('', '')} // Empty quote triggers standard reply
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold rounded text-primary hover:bg-primary/10 transition-colors"
                title="Reply to Post"
              >
                <Reply size={11} />
                Reply
              </button>

              <button
                onClick={handleQuote}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold rounded text-primary hover:bg-primary/10 transition-colors"
                title="Quote Post"
              >
                <Quote size={11} />
                Quote
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        initialContent={post.content}
        onSave={handleSaveEdit}
        requireReason={requireEditReason}
      />

      <ReportModal
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

ImprovedPostCard.displayName = 'ImprovedPostCard';

export default ImprovedPostCard;
