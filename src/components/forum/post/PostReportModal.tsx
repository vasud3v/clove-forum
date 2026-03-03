import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Flag, X } from 'lucide-react';
import { REPORT_REASONS } from '@/lib/forumConstants';

interface PostReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
}

const PostReportModal = memo(({ isOpen, onClose, onSubmit }: PostReportModalProps) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
              {REPORT_REASONS.map((r) => (
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
            className="transition-forum  bg-amber-500 px-4 py-2 text-[10px] font-mono font-semibold text-white hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] active:scale-95 border border-amber-500/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
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

PostReportModal.displayName = 'PostReportModal';

export default PostReportModal;
