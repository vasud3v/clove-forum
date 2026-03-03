import { AlertCircle, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Thread } from '@/types/forum';

interface SimilarThreadsAlertProps {
  threads: Array<Thread & { similarity: number }>;
  onDismiss: () => void;
}

export function SimilarThreadsAlert({ threads, onDismiss }: SimilarThreadsAlertProps) {
  if (threads.length === 0) return null;

  return (
    <div className=" border border-yellow-500/50 bg-yellow-500/10 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2">
          <AlertCircle size={18} className="text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-[12px] font-mono font-bold text-yellow-400">Similar Threads Found</h4>
            <p className="text-[10px] font-mono text-yellow-400/70 mt-0.5">
              These threads might already cover your topic. Consider reading them first or adding to the discussion.
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-yellow-700/50 hover:text-yellow-700 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {threads.map((thread) => (
          <Link
            key={thread.id}
            to={`/thread/${thread.id}`}
            target="_blank"
            className="block rounded border border-yellow-500/30 bg-yellow-500/5 p-3 hover:bg-yellow-500/10 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h5 className="text-[11px] font-mono font-bold text-forum-text group-hover:text-yellow-700 transition-colors truncate">
                  {thread.title}
                </h5>
                {thread.excerpt && (
                  <p className="text-[9px] font-mono text-forum-muted mt-1 line-clamp-2">
                    {thread.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-[8px] font-mono text-forum-muted">
                  <span>{thread.replyCount} replies</span>
                  <span>•</span>
                  <span>by {thread.author.username}</span>
                  <span>•</span>
                  <span className="text-yellow-700">{Math.round(thread.similarity * 100)}% similar</span>
                </div>
              </div>
              <ExternalLink size={12} className="text-yellow-700/50 group-hover:text-yellow-700 transition-colors flex-shrink-0 mt-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
