import { memo, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface QuoteData {
  author: string;
  content: string;
  postId?: string;
  timestamp?: string;
  nestedQuote?: QuoteData;
}

interface NestedQuoteBoxProps {
  quote: QuoteData;
  depth?: number;
  onViewPost?: (postId: string) => void;
}

const NestedQuoteBox = memo(({ quote, depth = 0, onViewPost }: NestedQuoteBoxProps) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  const maxDepth = 3; // Limit nesting to prevent excessive depth

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (!content) return '';
    
    // Check for media content
    const hasImages = /<img[^>]*>/i.test(content);
    const hasVideos = /<video[^>]*>/i.test(content);
    
    // Strip HTML tags for preview
    let plainText = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Add media indicators
    let mediaIndicator = '';
    if (hasImages && hasVideos) {
      mediaIndicator = ' [📷 Images & 🎥 Videos]';
    } else if (hasImages) {
      mediaIndicator = ' [📷 Images]';
    } else if (hasVideos) {
      mediaIndicator = ' [🎥 Videos]';
    }
    
    if (plainText.length <= maxLength) {
      return plainText + mediaIndicator;
    }
    return plainText.substring(0, maxLength).trim() + '...' + mediaIndicator;
  };

  const shouldTruncate = quote.content.length > 200;
  const displayContent = isExpanded ? quote.content : truncateContent(quote.content);

  // Calculate border and background intensity based on depth
  const borderOpacity = Math.max(40 - depth * 10, 20);
  const bgOpacity = Math.max(8 - depth * 2, 3);

  return (
    <div
      className="rounded-md overflow-hidden my-2"
      style={{
        borderLeft: `3px solid rgba(236, 72, 153, ${borderOpacity / 100})`,
        backgroundColor: `rgba(236, 72, 153, ${bgOpacity / 100})`,
        marginLeft: depth > 0 ? `${depth * 8}px` : '0',
      }}
    >
      {/* Quote Header */}
      <div className="px-3 py-1.5 bg-forum-bg/20 border-b border-forum-border/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-forum-muted">
            {depth > 0 ? '↳' : '↑'} Quote from
          </span>
          <span className="text-[10px] font-mono font-semibold text-forum-pink">
            @{quote.author}
          </span>
          {quote.timestamp && (
            <span className="text-[9px] font-mono text-forum-muted/60">
              {new Date(quote.timestamp).toLocaleDateString()}
            </span>
          )}
        </div>
        
        {quote.postId && onViewPost && (
          <button
            onClick={() => onViewPost(quote.postId!)}
            className="flex items-center gap-1 text-[9px] font-mono text-forum-pink/70 hover:text-forum-pink transition-colors px-1.5 py-0.5 rounded border border-forum-pink/20 hover:border-forum-pink/40"
          >
            <ExternalLink size={10} />
            View
          </button>
        )}
      </div>

      {/* Quote Content */}
      <div className="px-3 py-2">
        <div className="text-[11px] font-mono text-forum-text/80 leading-relaxed whitespace-pre-wrap">
          {displayContent}
        </div>

        {/* Nested Quote */}
        {quote.nestedQuote && depth < maxDepth && (
          <div className="mt-2">
            <NestedQuoteBox
              quote={quote.nestedQuote}
              depth={depth + 1}
              onViewPost={onViewPost}
            />
          </div>
        )}

        {/* Expand/Collapse Button */}
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-forum-pink hover:text-forum-pink/80 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp size={12} />
                Show less
              </>
            ) : (
              <>
                <ChevronDown size={12} />
                Show more
              </>
            )}
          </button>
        )}

        {/* Max depth warning */}
        {quote.nestedQuote && depth >= maxDepth && (
          <div className="mt-2 text-[9px] font-mono text-forum-muted/60 italic">
            [Additional nested quotes hidden]
          </div>
        )}
      </div>
    </div>
  );
});

NestedQuoteBox.displayName = 'NestedQuoteBox';

export default NestedQuoteBox;
export type { QuoteData };
