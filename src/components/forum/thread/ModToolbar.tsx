import { Pin, Lock, Flame, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';
import { Thread } from '@/types/forum';

interface ModToolbarProps {
  thread: Thread;
  categoryId: string;
  canPinThreads: boolean;
  canLockThreads: boolean;
  canFeatureThreads: boolean;
  canDeleteThreads: boolean;
  onDeleteNavigate: () => void;
}

export default function ModToolbar({
  thread,
  canPinThreads,
  canLockThreads,
  canFeatureThreads,
  canDeleteThreads,
  onDeleteNavigate,
}: ModToolbarProps) {
  return (
    <div className="mt-4 flex items-center gap-2 flex-wrap p-3 bg-forum-card/80  border border-primary/20 shadow-inner">
      <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider mr-2">
        Staff Actions:
      </span>
      {canPinThreads && (
        <button
          onClick={async () => {
            const { error } = await supabase.from('threads').update({ is_pinned: !thread.isPinned }).eq('id', thread.id);
            if (!error) toast.success(thread.isPinned ? 'Thread unpinned' : 'Thread pinned');
          }}
          className={`transition-forum flex items-center gap-1 rounded bg-forum-bg/50 px-2 py-1.5 text-[10px] font-mono border ${thread.isPinned ? 'text-primary border-primary/40 shadow-brutal-sm' : 'text-forum-muted border-forum-border/30 hover:border-primary/40 hover:text-primary'}`}
        >
          <Pin size={11} className={thread.isPinned ? "fill-forum-pink" : ""} /> {thread.isPinned ? 'Unpin' : 'Pin'}
        </button>
      )}
      {canLockThreads && (
        <button
          onClick={async () => {
            const { error } = await supabase.from('threads').update({ is_locked: !thread.isLocked }).eq('id', thread.id);
            if (!error) toast.success(thread.isLocked ? 'Thread unlocked' : 'Thread locked');
          }}
          className={`transition-forum flex items-center gap-1 rounded bg-forum-bg/50 px-2 py-1.5 text-[10px] font-mono border ${thread.isLocked ? 'text-amber-600 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'text-forum-muted border-forum-border/30 hover:border-amber-500/40 hover:text-amber-600'}`}
        >
          <Lock size={11} className={thread.isLocked ? "fill-amber-400" : ""} /> {thread.isLocked ? 'Unlock' : 'Lock'}
        </button>
      )}
      {canFeatureThreads && (
        <button
          onClick={async () => {
            const { error } = await supabase.from('threads').update({ is_hot: !thread.isHot }).eq('id', thread.id);
            if (!error) toast.success(thread.isHot ? 'Thread unfeatured' : 'Thread featured');
          }}
          className={`transition-forum flex items-center gap-1 rounded bg-forum-bg/50 px-2 py-1.5 text-[10px] font-mono border ${thread.isHot ? 'text-orange-700 border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.3)]' : 'text-forum-muted border-forum-border/30 hover:border-orange-500/40 hover:text-orange-700'}`}
        >
          <Flame size={11} className={thread.isHot ? "fill-orange-400" : ""} /> {thread.isHot ? 'Unfeature' : 'Feature'}
        </button>
      )}
      {canDeleteThreads && (
        <button
          onClick={async () => {
            if (confirm('Critical Action: Are you sure you want to delete this thread permanently?')) {
              const { error } = await supabase.from('threads').delete().eq('id', thread.id);
              if (!error) {
                toast.success('Thread deleted');
                onDeleteNavigate();
              } else {
                toast.error('Failed to delete thread');
              }
            }
          }}
          className="transition-forum flex items-center gap-1 rounded bg-forum-bg/50 px-2 py-1.5 text-[10px] font-mono text-forum-muted border border-forum-border/30 hover:text-red-400 hover:border-red-500/40"
        >
          <Trash2 size={11} /> Delete
        </button>
      )}
    </div>
  );
}
