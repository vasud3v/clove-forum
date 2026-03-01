import { memo, useState, useEffect, useRef } from 'react';
import { PostData } from '@/types/forum';

interface ReplyChainHighlightProps {
  posts: PostData[];
  hoveredPostId: string | null;
}

const ReplyChainHighlight = memo(({ posts, hoveredPostId }: ReplyChainHighlightProps) => {
  const [chainIds, setChainIds] = useState<Set<string>>(new Set());
  const previousChainRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!hoveredPostId) {
      setChainIds(new Set());
      return;
    }

    const chain = new Set<string>();
    const postMap = new Map(posts.map(p => [p.id, p]));
    const visited = new Set<string>(); // Prevent infinite loops

    // Find all ancestors
    let currentId: string | undefined = hoveredPostId;
    let depth = 0;
    const MAX_DEPTH = 50; // Prevent infinite loops

    while (currentId && depth < MAX_DEPTH) {
      if (visited.has(currentId)) {
        console.warn(`Circular reference detected in reply chain at post ${currentId}`);
        break;
      }
      
      visited.add(currentId);
      chain.add(currentId);
      const post = postMap.get(currentId);
      currentId = post?.replyTo;
      depth++;
    }

    // Find all descendants
    const findDescendants = (postId: string, currentDepth: number = 0) => {
      if (currentDepth > MAX_DEPTH) return;
      
      posts.forEach(post => {
        if (post.replyTo === postId && !chain.has(post.id)) {
          chain.add(post.id);
          findDescendants(post.id, currentDepth + 1);
        }
      });
    };
    findDescendants(hoveredPostId);

    setChainIds(chain);
  }, [hoveredPostId, posts]);

  useEffect(() => {
    // Remove highlight from previous chain
    previousChainRef.current.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.remove('reply-chain-highlight');
      }
    });

    // Apply highlight to current chain
    chainIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.add('reply-chain-highlight');
      }
    });

    previousChainRef.current = chainIds;

    return () => {
      // Cleanup on unmount
      chainIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.classList.remove('reply-chain-highlight');
        }
      });
    };
  }, [chainIds]);

  return null;
});

ReplyChainHighlight.displayName = 'ReplyChainHighlight';

export default ReplyChainHighlight;
