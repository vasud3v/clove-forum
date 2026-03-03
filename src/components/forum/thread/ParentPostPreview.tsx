import { memo } from 'react';
import { X, Reply } from 'lucide-react';
import { PostData } from '@/types/forum';

interface ParentPostPreviewProps {
  parentPost: PostData;
  onClose: () => void;
}

const ParentPostPreview = memo(({ parentPost, onClose }: ParentPostPreviewProps) => {
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
    };
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (!content) return '';
    
    // Strip HTML tags for preview
    const plainText = content
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + '...';
  };

  if (!parentPost) {
    console.warn('ParentPostPreview: parentPost is null or undefined');
    return null;
  }

  const mediaPreview = getMediaPreview(parentPost.content);
  const previewText = truncateContent(parentPost.content);

  return (
    <div className="mb-2  border border-primary/20 bg-forum-card/80 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-primary/[0.04] border-b border-forum-border/15">
        <span className="text-[9px] font-mono text-forum-muted flex items-center gap-1.5">
          <Reply size={10} className="text-primary" />
          Replying to <span className="text-primary font-semibold">@{parentPost.author?.username || 'Unknown'}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-forum-muted hover:text-forum-text transition-forum"
          aria-label="Close preview"
        >
          <X size={10} />
        </button>
      </div>
      <div className="px-3 py-2">
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
                    className="w-12 h-12 object-cover rounded border border-forum-border/30"
                  />
                  {mediaPreview.images.length > 1 && (
                    <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">+{mediaPreview.images.length - 1}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Show video indicator */}
              {mediaPreview.videos.length > 0 && (
                <div className="relative w-12 h-12 bg-forum-bg rounded border border-forum-border/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-forum-muted" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  {mediaPreview.videos.length > 1 && (
                    <div className="absolute top-0.5 right-0.5 bg-black/80 rounded px-1">
                      <span className="text-white text-[7px] font-bold">{mediaPreview.videos.length}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Text preview */}
          <p className="text-[10px] font-mono text-forum-muted/80 line-clamp-2 flex-1">
            {previewText}
          </p>
        </div>
      </div>
    </div>
  );
});

ParentPostPreview.displayName = 'ParentPostPreview';

export default ParentPostPreview;
