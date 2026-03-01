import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pin, Lock, Trash2, ArrowRight, Star, Archive, Plus, Search, Check, X, MessageSquare, Eye, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';
import NewThreadModal from '@/components/forum/NewThreadModal';

interface AdminThread {
  id: string;
  title: string;
  authorName: string;
  authorId: string;
  categoryId: string;
  categoryName: string;
  replyCount: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isFeatured: boolean;
  isArchived: boolean;
  createdAt: string;
}

interface AdminCategory {
  id: string;
  name: string;
}

interface Props {
  threads: AdminThread[];
  categories: AdminCategory[];
  currentUserId: string;
  onRefresh: () => void;
  onLogAction: (action: string, targetType: string, targetId: string, details?: Record<string, any>) => Promise<void>;
  formatDate: (d: string) => string;
}

export default function AdminThreadsTab({ threads, categories, currentUserId, onRefresh, onLogAction, formatDate }: Props) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ threadId: string; categoryId: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = threads.filter(t => {
    const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const toggleSelect = (id: string) => setSelectedThreads(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleSelectAll = () => setSelectedThreads(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(t => t.id)));

  const handleAction = async (threadId: string, action: string, value?: boolean) => {
    try {
      const updateData: Record<string, any> = {};
      if (action === 'pin') updateData.is_pinned = !value;
      if (action === 'lock') updateData.is_locked = !value;
      if (action === 'feature') updateData.is_featured = !value;
      if (action === 'archive') updateData.is_archived = !value;
      await supabase.from('threads').update(updateData).eq('id', threadId);
      const logAction = action === 'pin' ? (value ? 'thread_unpin' : 'thread_pin') : action === 'lock' ? (value ? 'thread_unlock' : 'thread_lock') : action === 'feature' ? (value ? 'thread_unfeature' : 'thread_feature') : 'thread_archive';
      await onLogAction(logAction, 'thread', threadId);
      toast.success(`Thread ${action} toggled`);
      onRefresh();
    } catch { toast.error('Action failed'); }
  };

  const handleDelete = async (threadId: string) => {
    try {
      const thread = threads.find(t => t.id === threadId);
      
      // Count posts that will be deleted
      const { count: postCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', threadId);

      const message = `Delete thread "${thread?.title}"?\n\nThis will also delete ${postCount || 0} posts/replies.\n\nThis action cannot be undone!`;
      
      if (!confirm(message)) return;

      await supabase.from('threads').delete().eq('id', threadId);
      await onLogAction('thread_delete', 'thread', threadId, { 
        title: thread?.title,
        deletedPosts: postCount
      });
      toast.success('Thread and all its posts deleted');
      setDeleteConfirm(null);
      onRefresh();
    } catch { 
      toast.error('Failed to delete thread'); 
    }
  };

  const handleMove = async () => {
    if (!moveTarget) return;
    try {
      await supabase.from('threads').update({ category_id: moveTarget.categoryId }).eq('id', moveTarget.threadId);
      await onLogAction('thread_move', 'thread', moveTarget.threadId, { newCategory: moveTarget.categoryId });
      toast.success('Thread moved');
      setMoveTarget(null);
      onRefresh();
    } catch { toast.error('Failed to move'); }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedThreads.size === 0) return;
    try {
      const ids = Array.from(selectedThreads);
      const updateData: Record<string, any> = {};
      if (action === 'pin') updateData.is_pinned = true;
      if (action === 'unpin') updateData.is_pinned = false;
      if (action === 'lock') updateData.is_locked = true;
      if (action === 'unlock') updateData.is_locked = false;
      if (action === 'delete') {
        // Count total posts that will be deleted
        const { count: totalPosts } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .in('thread_id', ids);

        const message = `Delete ${ids.length} threads?\n\nThis will also delete ${totalPosts || 0} posts/replies.\n\nThis action cannot be undone!`;
        
        if (!confirm(message)) return;

        for (const id of ids) await supabase.from('threads').delete().eq('id', id);
        toast.success(`Deleted ${ids.length} threads and ${totalPosts || 0} posts`);
      } else {
        for (const id of ids) await supabase.from('threads').update(updateData).eq('id', id);
        toast.success(`Bulk ${action} completed (${ids.length} threads)`);
      }
      setSelectedThreads(new Set());
      onRefresh();
    } catch { toast.error('Bulk action failed'); }
  };

  const handleCreateModalClose = () => {
    setShowCreateModal(false);
    onRefresh(); // Refresh the thread list when modal closes
  };

  return (
    <div className="space-y-3">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowCreateModal(true)} className="transition-forum flex items-center gap-1.5 rounded-md border border-forum-pink bg-transparent px-3 py-1.5 text-[10px] font-mono font-bold text-forum-pink hover:bg-forum-pink/10">
          <Plus size={12} /> Create Thread
        </button>
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-forum-muted" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search threads..."
            className="w-full rounded-md border border-forum-border bg-forum-bg pl-8 pr-3 py-1.5 text-[10px] font-mono text-forum-text outline-none focus:border-forum-pink" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="rounded-md border border-forum-border bg-forum-bg px-3 py-1.5 text-[10px] font-mono text-forum-text outline-none focus:border-forum-pink">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Advanced Thread Creation Modal */}
      <NewThreadModal 
        isOpen={showCreateModal} 
        onClose={handleCreateModalClose}
      />

      {/* Bulk Actions */}
      {selectedThreads.size > 0 && (
        <div className="hud-panel px-4 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-forum-text font-semibold">{selectedThreads.size} selected</span>
          <button onClick={() => handleBulkAction('pin')} className="text-[9px] font-mono text-amber-400 hover:underline">Pin</button>
          <button onClick={() => handleBulkAction('unpin')} className="text-[9px] font-mono text-forum-muted hover:underline">Unpin</button>
          <button onClick={() => handleBulkAction('lock')} className="text-[9px] font-mono text-red-400 hover:underline">Lock</button>
          <button onClick={() => handleBulkAction('unlock')} className="text-[9px] font-mono text-forum-muted hover:underline">Unlock</button>
          <button onClick={() => handleBulkAction('delete')} className="text-[9px] font-mono text-red-500 hover:underline">Delete All</button>
        </div>
      )}

      {/* Thread List */}
      <div className="hud-panel overflow-hidden">
        <div className="border-b border-forum-border px-4 py-3 flex items-center justify-between">
          <h3 className="text-[12px] font-mono font-bold text-forum-text">Threads ({filtered.length})</h3>
          <label className="flex items-center gap-1.5 text-[9px] font-mono text-forum-muted cursor-pointer">
            <input type="checkbox" checked={selectedThreads.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} /> Select All
          </label>
        </div>
        <div className="divide-y divide-forum-border/20 max-h-[600px] overflow-y-auto">
          {filtered.map(thread => (
            <div key={thread.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-forum-hover/30 transition-forum">
              <input type="checkbox" checked={selectedThreads.has(thread.id)} onChange={() => toggleSelect(thread.id)} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {thread.isPinned && <Pin size={9} className="text-amber-400" />}
                  {thread.isLocked && <Lock size={9} className="text-red-400" />}
                  {thread.isFeatured && <Star size={9} className="text-forum-pink" />}
                  {thread.isArchived && <Archive size={9} className="text-gray-400" />}
                  <span className="text-[11px] font-mono text-forum-text truncate cursor-pointer hover:text-forum-pink" onClick={() => navigate(`/thread/${thread.id}`)}>{thread.title}</span>
                </div>
                <div className="flex items-center gap-3 text-[8px] font-mono text-forum-muted">
                  <span>by {thread.authorName}</span>
                  <span>in {thread.categoryName}</span>
                  <span className="flex items-center gap-0.5"><MessageSquare size={7} /> {thread.replyCount}</span>
                  <span className="flex items-center gap-0.5"><Eye size={7} /> {thread.viewCount}</span>
                  <span className="flex items-center gap-0.5"><Clock size={7} /> {formatDate(thread.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button onClick={() => handleAction(thread.id, 'pin', thread.isPinned)} className={`transition-forum rounded p-1 ${thread.isPinned ? 'text-amber-400 bg-amber-500/10' : 'text-forum-muted hover:text-amber-400'}`} title="Pin"><Pin size={11} /></button>
                <button onClick={() => handleAction(thread.id, 'lock', thread.isLocked)} className={`transition-forum rounded p-1 ${thread.isLocked ? 'text-red-400 bg-red-500/10' : 'text-forum-muted hover:text-red-400'}`} title="Lock"><Lock size={11} /></button>
                <button onClick={() => handleAction(thread.id, 'feature', thread.isFeatured)} className={`transition-forum rounded p-1 ${thread.isFeatured ? 'text-forum-pink bg-forum-pink/10' : 'text-forum-muted hover:text-forum-pink'}`} title="Feature"><Star size={11} /></button>
                <button onClick={() => setMoveTarget({ threadId: thread.id, categoryId: thread.categoryId })} className="transition-forum rounded p-1 text-forum-muted hover:text-blue-400" title="Move"><ArrowRight size={11} /></button>
                {deleteConfirm === thread.id ? (
                  <><button onClick={() => handleDelete(thread.id)} className="rounded p-1 text-red-400 bg-red-500/10"><Check size={11} /></button>
                  <button onClick={() => setDeleteConfirm(null)} className="rounded p-1 text-forum-muted"><X size={11} /></button></>
                ) : (
                  <button onClick={() => setDeleteConfirm(thread.id)} className="transition-forum rounded p-1 text-forum-muted hover:text-red-400" title="Delete"><Trash2 size={11} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Move Modal */}
      {moveTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMoveTarget(null)} />
          <div className="relative hud-panel p-5 w-full max-w-sm mx-4 space-y-3">
            <h3 className="text-[13px] font-mono font-bold text-forum-text">Move Thread</h3>
            <select value={moveTarget.categoryId} onChange={e => setMoveTarget(p => p ? { ...p, categoryId: e.target.value } : null)}
              className="w-full rounded-md border border-forum-border bg-forum-bg px-3 py-1.5 text-[11px] font-mono text-forum-text outline-none focus:border-forum-pink">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={handleMove} className="transition-forum rounded-md bg-forum-pink px-4 py-1.5 text-[10px] font-mono font-bold text-white hover:bg-forum-pink/90">Move</button>
              <button onClick={() => setMoveTarget(null)} className="transition-forum rounded-md border border-forum-border px-4 py-1.5 text-[10px] font-mono text-forum-muted hover:text-forum-text">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
