import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, X, Check, AlertTriangle } from 'lucide-react';
import { AdvancedEditor } from '../editor/AdvancedEditor';

interface PostEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (content: string, reason?: string) => Promise<void>;
  requireReason?: boolean;
}

const PostEditModal = memo(({ 
  isOpen, 
  onClose, 
  initialContent, 
  onSave, 
  requireReason 
}: PostEditModalProps) => {
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
            className="transition-forum  bg-primary px-4 py-2 text-[10px] font-mono font-semibold text-white hover:shadow-brutal-sm active:scale-95 border border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
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

PostEditModal.displayName = 'PostEditModal';

export default PostEditModal;
