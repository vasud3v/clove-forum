import { memo, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PostData } from '@/types/forum';
import PostCard from '../post/PostCard';
import { buildPostTree, flattenTree, countDescendants } from '@/lib/threadTree';

interface ThreadedPostListProps {
  posts: PostData[];
  currentUserId: string;
  threadAuthorId: string;
  threadId: string;
  onQuote: (author: string, content: string) => void;
  onEdit: (postId: string, newContent: string, reason?: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onReport?: (postId: string, reason: string, details: string) => Promise<void>;
  onBookmark?: (postId: string) => Promise<void>;
  isBookmarked?: (postId: string) => boolean;
  onReplyToPost?: (postId: string) => void;
  activeReplyFormId?: string | null;
  onInlineReply?: (postId: string, content: string) => Promise<void>;
  inlineReplySubmitting?: boolean;
  onAddToMultiQuote?: (post: PostData) => void;
}

const ThreadedPostList = memo(({
  posts,
  currentUserId,
  threadAuthorId,
  threadId,
  onQuote,
  onEdit,
  onDelete,
  onReport,
  onBookmark,
  isBookmarked,
  onReplyToPost,
  activeReplyFormId,
  onInlineReply,
  inlineReplySubmitting = false,
  onAddToMultiQuote,
}: ThreadedPostListProps) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Build the tree structure
  const postTree = useMemo(() => {
    return buildPostTree(posts);
  }, [posts]);

  // Flatten the tree for rendering with depth info
  const flattenedPosts = useMemo(() => {
    return flattenTree(postTree, collapsedNodes);
  }, [postTree, collapsedNodes]);

  const toggleCollapse = (postId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const getChildCount = (postId: string): number => {
    const findNode = (nodes: any[]): any => {
      for (const node of nodes) {
        if (node.post.id === postId) return node;
        const found = findNode(node.children);
        if (found) return found;
      }
      return null;
    };

    const node = findNode(postTree);
    if (!node) return 0;

    const countChildren = (n: any): number => {
      let count = n.children.length;
      for (const child of n.children) {
        count += countChildren(child);
      }
      return count;
    };

    return countChildren(node);
  };

  return (
    <div className="space-y-3">
      {flattenedPosts.map(({ post, depth }, index) => {
        const childCount = getChildCount(post.id);
        const isCollapsed = collapsedNodes.has(post.id);
        const hasChildren = childCount > 0;

        return (
          <div key={post.id} className="relative">
            {/* Collapse/Expand Button - Only show if has children */}
            {hasChildren && (
              <button
                onClick={() => toggleCollapse(post.id)}
                className="absolute -left-6 top-4 z-10 flex items-center gap-1 text-[10px] font-mono text-forum-muted hover:text-primary transition-colors"
                title={isCollapsed ? `Show ${childCount} replies` : `Hide ${childCount} replies`}
              >
                {isCollapsed ? (
                  <ChevronRight size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
                <span className="hidden sm:inline">
                  {isCollapsed ? `${childCount}` : ''}
                </span>
              </button>
            )}

            <PostCard
              post={post}
              index={index}
              isOP={post.author.id === threadAuthorId}
              currentUserId={currentUserId}
              threadAuthorId={threadAuthorId}
              threadId={threadId}
              depth={depth}
              onQuote={onQuote}
              onEdit={onEdit}
              onDelete={onDelete}
              onReport={onReport}
              onBookmark={onBookmark}
              isBookmarked={isBookmarked?.(post.id) || false}
              onReplyToPost={onReplyToPost}
              activeReplyFormId={activeReplyFormId}
              onInlineReply={onInlineReply}
              inlineReplySubmitting={inlineReplySubmitting}
              replyCount={childCount}
              allPosts={posts}
              onAddToMultiQuote={onAddToMultiQuote}
            />
          </div>
        );
      })}
    </div>
  );
});

ThreadedPostList.displayName = 'ThreadedPostList';

export default ThreadedPostList;
