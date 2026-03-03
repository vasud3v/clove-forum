import { memo } from 'react';
import { PostData } from '@/types/forum';
import PostContentRenderer from '@/components/forum/PostContentRenderer';
import { Clock, History } from 'lucide-react';
import PostAuthorSidebar from '@/components/forum/post/PostAuthorSidebar';
import PostActions from '@/components/forum/post/PostActions';
import InlineReplyForm from '@/components/forum/thread/InlineReplyForm';
import ViewParentButton from '@/components/forum/thread/ViewParentButton';
import ReplyCountBadge from '@/components/forum/thread/ReplyCountBadge';
import QuotedReplyBox from '@/components/forum/post/QuotedReplyBox';

interface PostCardProps {
  post: PostData;
  index: number;
  isOP: boolean;
  currentUserId: string;
  threadAuthorId: string;
  threadId: string;
  depth?: number;
  onQuote: (author: string, content: string) => void;
  onEdit: (postId: string, newContent: string, reason?: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onReport?: (postId: string, reason: string, details: string) => Promise<void>;
  onBookmark?: (postId: string) => Promise<void>;
  isBookmarked?: boolean;
  onReplyToPost?: (postId: string) => void;
  activeReplyFormId?: string | null;
  onInlineReply?: (postId: string, content: string) => Promise<void>;
  inlineReplySubmitting?: boolean;
  allPosts?: PostData[];
  replyCount?: number;
  onViewParent?: (parentId: string) => void;
  onAddToMultiQuote?: (post: PostData) => void;
}

const PostCard = memo(({
  post,
  index,
  isOP,
  currentUserId,
  threadAuthorId,
  threadId,
  depth = 0,
  onQuote,
  onEdit,
  onDelete,
  onReport,
  onBookmark,
  isBookmarked = false,
  onReplyToPost,
  activeReplyFormId,
  onInlineReply,
  inlineReplySubmitting = false,
  allPosts = [],
  replyCount = 0,
  onViewParent,
  onAddToMultiQuote,
}: PostCardProps) => {
  const isOwnPost = post.author.id === currentUserId;
  const postAge = Date.now() - new Date(post.createdAt).getTime();
  const requireEditReason = postAge > 5 * 60 * 1000; // 5 minutes

  // Calculate indentation based on depth
  const indentClass = depth > 0 ? `ml-${Math.min(depth, 3) * 6}` : '';
  const showReplyingToBadge = depth >= 3 && post.replyTo;

  // Find parent post
  const parentPost = post.replyTo ? allPosts.find(p => p.id === post.replyTo) : null;

  const handleViewParent = (parentId: string) => {
    const element = document.getElementById(parentId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-primary', 'ring-opacity-50');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50');
      }, 2000);
    }
  };

  return (
    <div
      id={post.id}
      className={`hud-panel scroll-mt-24 flex flex-col md:flex-row relative  ${indentClass}`}
      style={{ 
        marginLeft: depth > 0 ? `${Math.min(depth, 3) * 24}px` : '0',
      }}
    >
      {/* Enhanced connecting line for nested replies */}
      {depth > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 bg-forum-card via-forum-border/30 to-transparent rounded-l"
          style={{ left: '-12px' }}
        />
      )}

      {/* Author Sidebar */}
      <PostAuthorSidebar
        author={post.author || { 
          id: 'deleted', 
          username: '[Deleted User]', 
          avatar: '/default-avatar.png',
          postCount: 0,
          reputation: 0,
          joinDate: new Date().toISOString(),
          isOnline: false,
          rank: 'Guest',
          role: 'member'
        }}
        isOP={isOP}
        currentUserId={currentUserId}
      />

      {/* Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Post Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-forum-border/10 bg-forum-bg/20">
          <div className="flex items-center gap-2 flex-wrap">
            {replyCount > 0 && (
              <ReplyCountBadge count={replyCount} />
            )}
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
        <div className="px-5 pt-4 pb-2 flex-1 flex flex-col">
          {/* User's Reply Content First */}
          <div className="[&>div]:mb-0">
            <PostContentRenderer content={post.content} />
          </div>
          
          {/* Quoted Reply Box - Show AFTER the user's content */}
          {post.replyTo && parentPost && (
            <QuotedReplyBox 
              parentPost={parentPost} 
              onViewParent={handleViewParent}
            />
          )}
          
          {post.editedAt && (
            <div className="mt-4 text-[10px] font-mono italic text-forum-muted/70">
              Last edited: {new Date(post.editedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>
          )}
        </div>

        {/* Post Actions */}
        <PostActions
          post={post}
          isOwnPost={isOwnPost}
          isBookmarked={isBookmarked}
          requireEditReason={requireEditReason}
          threadId={threadId}
          currentUserId={currentUserId}
          onQuote={onQuote}
          onEdit={onEdit}
          onDelete={onDelete}
          onReport={onReport}
          onBookmark={onBookmark}
          onReplyToPost={onReplyToPost}
          onAddToMultiQuote={onAddToMultiQuote}
        />

        {/* Inline Reply Form */}
        {activeReplyFormId === post.id && onInlineReply && (
          <div className="px-4 pb-3">
            <InlineReplyForm
              parentAuthor={post.author.username}
              onSubmit={(content) => onInlineReply(post.id, content)}
              onCancel={() => onReplyToPost?.(null as any)}
              isSubmitting={inlineReplySubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;
