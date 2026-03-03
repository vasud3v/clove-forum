import { Reply, Quote, X, Eye, Edit3, Maximize2 } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import ImageUploadButton from '@/components/forum/ImageUploadButton';
import PostContentRenderer from '../PostContentRenderer';
import { useDraftAutoSave } from '@/hooks/forum/useDraftAutoSave';
import { AdvancedEditor } from '../editor/AdvancedEditor';
import QuickReplyTemplates from './QuickReplyTemplates';
import CharacterCounter from './CharacterCounter';

interface ReplyEditorProps {
  isLocked: boolean;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  quotedPost?: { author: string; content: string };
  onClearQuote: () => void;
  onSubmitReply: () => void;
  isSubmitting: boolean;
  replyBoxRef?: React.RefObject<HTMLTextAreaElement | null>;
  threadId?: string;
}

export default function ReplyEditor({
  isLocked,
  replyText,
  onReplyTextChange,
  quotedPost,
  onClearQuote,
  onSubmitReply,
  isSubmitting,
  replyBoxRef,
  threadId,
}: ReplyEditorProps) {
  const [previewMode, setPreviewMode] = useState<'write' | 'preview'>('write');
  const MAX_CHARS = 50000;

  const { draftRestored, clearDraft } = useDraftAutoSave(
    threadId ? `reply-${threadId}` : 'reply-new',
    replyText,
    onReplyTextChange,
  );

  const handleSubmit = () => {
    onSubmitReply();
    clearDraft();
  };

  const handleDiscard = () => {
    onClearQuote();
    onReplyTextChange('');
    clearDraft();
  };

  if (isLocked) {
    return (
      <div className="hud-panel px-4 py-3 flex items-center gap-3 border-amber-500/20 bg-amber-500/[0.04]">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 flex-shrink-0"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span className="text-[11px] font-mono text-amber-600">
          This thread is locked. No new replies can be posted.
        </span>
      </div>
    );
  }

  return (
    <div className="hud-panel overflow-hidden" id="reply-box">
      <div className="px-4 py-2 border-b border-forum-border/20 bg-forum-card-alt/30 flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold text-forum-text flex items-center gap-2">
          <Reply size={12} className="text-primary" />
          Post a Reply
          {draftRestored && (
            <span className="text-[9px] font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-0.5">
              Draft restored
            </span>
          )}
        </span>

        {/* Write/Preview Toggle */}
        <div className="flex items-center gap-1 border border-forum-border/30  overflow-hidden">
          <button
            onClick={() => setPreviewMode('write')}
            className={`px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-forum flex items-center gap-1 ${
              previewMode === 'write'
                ? 'bg-primary text-white'
                : 'text-forum-muted hover:text-forum-text'
            }`}
          >
            <Edit3 size={9} />
            Write
          </button>
          <button
            onClick={() => setPreviewMode('preview')}
            className={`px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-forum flex items-center gap-1 ${
              previewMode === 'preview'
                ? 'bg-primary text-white'
                : 'text-forum-muted hover:text-forum-text'
            }`}
          >
            <Eye size={9} />
            Preview
          </button>
        </div>
      </div>

      <div className="p-4">
        {previewMode === 'write' ? (
          <AdvancedEditor
            value={replyText}
            onChange={onReplyTextChange}
            placeholder="Write your reply... (Rich text supported)"
            minHeight="180px"
          />
        ) : (
          <div className="min-h-[180px] bg-forum-bg border border-forum-border/30  px-3 py-2.5">
            {replyText.trim() ? (
              <PostContentRenderer content={replyText} />
            ) : (
              <div className="text-[12px] font-mono text-forum-muted/40 italic">
                Nothing to preview yet. Write something in the Write tab.
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[9px] font-mono text-forum-muted/50">
              Rich text editor with full formatting support
            </span>
            <CharacterCounter count={replyText.length} maxCount={MAX_CHARS} />
          </div>
          <div className="flex items-center gap-2">
            {replyText.trim() && (
              <button
                onClick={handleDiscard}
                className="transition-forum  px-3 py-2 text-[10px] font-mono text-forum-muted border border-forum-border/30 hover:text-forum-text hover:border-forum-border/50"
              >
                Discard
              </button>
            )}
            <button
              onClick={handleSubmit}
              className="transition-forum  bg-primary px-4 py-2 text-[11px] font-mono font-semibold text-white hover:shadow-brutal-sm active:scale-95 border border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={!replyText.trim() || isSubmitting || replyText.length > 50000}
            >
              {isSubmitting ? (
                <>
                  <div className="inline-block animate-spin  h-3 w-3 border-b-2 border-white"></div>
                  Posting...
                </>
              ) : (
                'Post Reply'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
