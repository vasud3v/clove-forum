import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, History, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useForumContext } from '@/context/ForumContext';
import { getUserAvatar } from '@/lib/avatar';

interface PostEditHistory {
  id: string;
  post_id: string;
  content: string;
  edited_by: string;
  edit_reason: string | null;
  edited_at: string;
  version: number;
  word_count: number;
  editor: {
    username: string;
    avatar: string;
  };
}

interface PostEditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  currentContent: string;
  currentVersion: number;
}

export default function PostEditHistoryModal({
  isOpen,
  onClose,
  postId,
  currentContent,
  currentVersion,
}: PostEditHistoryModalProps) {
  const [history, setHistory] = useState<PostEditHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const { getUserProfile } = useForumContext();

  useEffect(() => {
    if (!isOpen || !postId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('post_edit_history')
          .select(`
            *,
            editor:forum_users!post_edit_history_edited_by_fkey(
              username,
              avatar
            )
          `)
          .eq('post_id', postId)
          .order('version', { ascending: false });

        if (error) throw error;

        setHistory(data || []);
      } catch (error) {
        console.error('Failed to fetch edit history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, postId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVersionContent = (version: number) => {
    if (version === currentVersion) {
      return currentContent;
    }
    const historyEntry = history.find((h) => h.version === version);
    return historyEntry?.content || '';
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 "
        onClick={onClose}
      />
      <div className="relative hud-panel w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-forum-border/20">
          <span className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
            <History size={13} className="text-primary" /> Edit History
            <span className="text-forum-muted">({currentVersion} versions)</span>
          </span>
          <button
            onClick={onClose}
            className="text-forum-muted hover:text-forum-text transition-forum"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin  h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History size={32} className="text-forum-muted/50 mb-3" />
              <p className="text-[11px] font-mono text-forum-muted">
                No edit history available
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Current version */}
              <div className="border border-primary/30  overflow-hidden bg-primary/5">
                <div className="flex items-center justify-between px-4 py-2.5 bg-primary/10 border-b border-primary/20">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider">
                      Current Version (v{currentVersion})
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-forum-muted">
                    Latest
                  </span>
                </div>
                <div className="px-4 py-3">
                  <div className="text-[11px] font-mono text-forum-text/90 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {currentContent}
                  </div>
                </div>
              </div>

              {/* Previous versions */}
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className={`border  overflow-hidden transition-forum ${selectedVersion === entry.version
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-forum-border/30 bg-forum-bg/50'
                    }`}
                >
                  <div className="flex items-center justify-between px-4 py-2.5 bg-forum-card-alt/30 border-b border-forum-border/20">
                    <div className="flex items-center gap-3">
                      <img
                        src={entry.editor.avatar || getUserAvatar('', entry.editor.username)}
                        alt={entry.editor.username}
                        className="h-6 w-6 rounded border border-forum-border object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-semibold text-forum-text">
                            {entry.editor.username}
                          </span>
                          <span className="text-[9px] font-mono text-forum-muted">
                            v{entry.version}
                          </span>
                        </div>
                        {entry.edit_reason && (
                          <div className="text-[9px] font-mono text-forum-muted/80 italic">
                            "{entry.edit_reason}"
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-forum-muted flex items-center gap-1">
                        <Clock size={9} />
                        {formatDate(entry.edited_at)}
                      </span>
                      <button
                        onClick={() =>
                          setSelectedVersion(
                            selectedVersion === entry.version ? null : entry.version
                          )
                        }
                        className="text-[9px] font-mono text-primary hover:text-primary/80 transition-forum"
                      >
                        {selectedVersion === entry.version ? 'Hide' : 'View'}
                      </button>
                    </div>
                  </div>

                  {selectedVersion === entry.version && (
                    <div className="px-4 py-3 border-t border-forum-border/10">
                      <div className="text-[11px] font-mono text-forum-text/90 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {entry.content}
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-forum-border/10">
                        <span className="text-[9px] font-mono text-forum-muted">
                          {entry.word_count} words
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-forum-border/20">
          <span className="text-[9px] font-mono text-forum-muted">
            Showing {history.length + 1} version{history.length !== 0 ? 's' : ''}
          </span>
          <button
            onClick={onClose}
            className="transition-forum  px-4 py-2 text-[10px] font-mono text-forum-muted border border-forum-border/30 hover:text-forum-text hover:border-forum-border/50"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
