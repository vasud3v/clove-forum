import { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import type { ReportReason } from '@/types/forum';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => Promise<void>;
  targetType: 'thread' | 'post';
  targetTitle?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'spam', label: 'Spam', description: 'Unsolicited promotion or repetitive content' },
  { value: 'harassment', label: 'Harassment', description: 'Bullying, threats, or targeted abuse' },
  { value: 'off_topic', label: 'Off Topic', description: 'Content irrelevant to the discussion' },
  { value: 'inappropriate', label: 'Inappropriate', description: 'Explicit, offensive, or NSFW content' },
  { value: 'other', label: 'Other', description: 'Another reason not listed above' },
];

export default function ReportModal({ isOpen, onClose, onSubmit, targetType, targetTitle }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setIsSubmitting(true);
    try {
      await onSubmit(selectedReason, details);
      setSelectedReason(null);
      setDetails('');
      onClose();
    } catch {
      // error handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 " onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 hud-panel p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-forum-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Flag size={14} className="text-primary" />
            <h3 className="text-[13px] font-mono font-bold text-forum-text">
              Report {targetType === 'thread' ? 'Thread' : 'Post'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="transition-forum rounded p-1 text-forum-muted hover:text-forum-text hover:bg-forum-hover"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {targetTitle && (
            <div className=" border border-forum-border/30 bg-forum-bg/50 px-3 py-2">
              <span className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">Reporting</span>
              <p className="text-[11px] font-mono text-forum-text mt-0.5 truncate">{targetTitle}</p>
            </div>
          )}

          {/* Reason selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-semibold text-forum-text uppercase tracking-wider">
              Reason
            </label>
            <div className="space-y-1">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setSelectedReason(reason.value)}
                  className={`transition-forum w-full text-left  border px-3 py-2 ${
                    selectedReason === reason.value
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-forum-border/30 bg-forum-bg/30 hover:border-forum-border'
                  }`}
                >
                  <div className="text-[11px] font-mono font-semibold text-forum-text">{reason.label}</div>
                  <div className="text-[9px] font-mono text-forum-muted">{reason.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-semibold text-forum-text uppercase tracking-wider">
              Additional Details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide more context about why you're reporting this content..."
              className="transition-forum w-full  border border-forum-border bg-forum-bg px-3 py-2 text-[11px] font-mono text-forum-text placeholder-forum-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-20"
              maxLength={500}
            />
            <div className="text-right text-[8px] font-mono text-forum-muted">{details.length}/500</div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2  border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <AlertTriangle size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-[9px] font-mono text-forum-muted">
              False reports may result in action against your account. Please only report genuine violations.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-forum-border px-5 py-3">
          <button
            onClick={onClose}
            className="transition-forum  border border-forum-border px-4 py-1.5 text-[10px] font-mono font-semibold text-forum-muted hover:text-forum-text hover:bg-forum-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="transition-forum  bg-primary px-4 py-1.5 text-[10px] font-mono font-bold text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
