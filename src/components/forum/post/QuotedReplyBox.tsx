import { memo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PostData } from '@/types/forum';
import PostContentRenderer from '../PostContentRenderer';

interface QuotedReplyBoxProps {
  parentPost: PostData;
  onViewParent: (parentId: string) => void;
}

const QuotedReplyBox = memo(({ parentPost, onViewParent }: QuotedReplyBoxProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract all images/videos for preview
  const getMediaPreview = (content: string) => {
    const imgMatches = Array.from(content.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/gi));
    const videoMatches = Array.from(content.matchAll(/<video[^>]+src="([^"]+)"[^>]*>/gi));
    
    const images = imgMatches.map(match => match[1]);
    const videos = videoMatches.map(match => match[1]);
    
    return {
      images,
      videos,
      totalMedia: images.length + videos.length,
      hasMultiple: (images.length + videos.length) > 1,
    };
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (!content) return '';
    
    // Strip HTML tags for preview
    const plainText = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + '...';
  };

  const shouldTruncate = parentPost.content.length > 150;
  const previewText = truncateContent(parentPost.content);
  const mediaPreview = getMediaPreview(parentPost.content);

  return (
    <div className="mt-1.5 mb-0 rounded-md border-l-4 border-forum-pink/40 bg-forum-bg/30 overflow-hidden">
      {/* Header with navigation */}
      <div className="px-3 py-2 bg-forum-pink/[0.03] border-b border-forum-border/10 flex items-center justify-between">
        <button
          onClick={() => onViewParent(parentPost.id)}
          className="text-[10px] font-mono text-forum-pink hover:underline font-semibold flex items-center gap-1.5"
        >
          <span className="text-forum-muted">↑ In reply to</span>
          <span>{parentPost.author.username}</span>
        </button>
        <button
          onClick={() => onViewParent(parentPost.id)}
          className="text-[9px] font-mono text-forum-pink/70 hover:text-forum-pink transition-colors px-2 py-0.5 rounded border border-forum-pink/20 hover:border-forum-pink/40"
        >
          View Post →
        </button>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5">
        {isExpanded ? (
          <div className="text-[11px] font-mono text-forum-muted/80">
            <PostContentRenderer content={parentPost.content} />
          </div>
        ) : (
          <div className="flex gap-2">
            {/* Media thumbnails preview */}
            {mediaPreview.totalMedia > 0 && (
              <div className="flex-shrink-0 flex gap-1">
                {/* Show first image */}
                {mediaPreview.images.length > 0 && (
                  <div className="relative">
                    <img 
                      src={mediaPreview.images[0]} 
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded border border-forum-border/30"
                    />
                    {mediaPreview.images.length > 1 && (
                      <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">+{mediaPreview.images.length - 1}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show first video or video count */}
                {mediaPreview.videos.length > 0 && (
                  <div className="relative w-16 h-16 bg-forum-bg rounded border border-forum-border/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-forum-muted" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    {mediaPreview.videos.length > 1 && (
                      <div className="absolute top-0.5 right-0.5 bg-black/80 rounded px-1 py-0.5">
                        <span className="text-white text-[8px] font-bold">{mediaPreview.videos.length}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Text preview */}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono text-forum-muted/80 italic line-clamp-2">
                "{previewText}"
              </div>
              {mediaPreview.totalMedia > 0 && (
                <div className="text-[9px] font-mono text-forum-muted/60 mt-1 flex items-center gap-2">
                  {mediaPreview.images.length > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      {mediaPreview.images.length} {mediaPreview.images.length === 1 ? 'image' : 'images'}
                    </span>
                  )}
                  {mediaPreview.videos.length > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      {mediaPreview.videos.length} {mediaPreview.videos.length === 1 ? 'video' : 'videos'}
                    </span>
                  )}
                </div>
              )}
            </div>
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
      </div>
    </div>
  );
});

QuotedReplyBox.displayName = 'QuotedReplyBox';

export default QuotedReplyBox;
