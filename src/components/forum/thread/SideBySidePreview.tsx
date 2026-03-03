import { memo } from 'react';
import PostContentRenderer from '../PostContentRenderer';

interface SideBySidePreviewProps {
  content: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}

const SideBySidePreview = memo(({
  content,
  textareaRef,
  onContentChange,
  onKeyDown,
  placeholder = 'Write your reply...',
}: SideBySidePreviewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Editor */}
      <div className="flex flex-col">
        <div className="text-[9px] font-mono font-bold text-forum-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-2 h-2  bg-primary"></span>
          Write
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={onContentChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full h-36 bg-forum-bg border border-forum-border/30  px-3 py-2.5 text-[12px] font-mono text-forum-text placeholder:text-forum-muted/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary transition-forum resize-none"
          aria-label="Reply editor"
        />
      </div>

      {/* Preview */}
      <div className="flex flex-col">
        <div className="text-[9px] font-mono font-bold text-forum-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-2 h-2  bg-emerald-400"></span>
          Preview
        </div>
        <div className="h-36 bg-forum-bg border border-forum-border/30  px-3 py-2.5 overflow-y-auto" aria-label="Reply preview">
          {content.trim() ? (
            <PostContentRenderer content={content} />
          ) : (
            <div className="text-[12px] font-mono text-forum-muted/40 italic">
              Preview will appear here...
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SideBySidePreview.displayName = 'SideBySidePreview';

export default SideBySidePreview;
