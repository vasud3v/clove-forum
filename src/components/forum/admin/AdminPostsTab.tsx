import { useState } from 'react';
import { Search, Edit3, Trash2, Check, X, Eye, Clock, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';
import { AdvancedEditor } from '@/components/forum/editor/AdvancedEditor';

interface AdminPost {
  id: string;
  threadId: string;
  threadTitle: string;
  content: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  likes: number;
  upvotes: number;
  downvotes: number;
}

interface Props {
  posts: AdminPost[];
  onRefresh: () => void;
  onLogAction: (action: string, targetType: string, targetId: string, details?: Record<string, any>, targetUserId?: string) => Promise<void>;
  formatDate: (d: string) => string;
}

export default function AdminPostsTab({ posts, onRefresh, onLogAction, formatDate }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPost, setEditingPost] = useState<{ id: string; content: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [filterAuthor, setFilterAuthor] = useState('all');

  const authors = Array.from(new Set(posts.map(p => p.authorName))).sort();

  const filtered = posts.filter(p => {
    const matchesSearch = !searchQuery || p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.threadTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAuthor = filterAuthor === 'all' || p.authorName === filterAuthor;
    return matchesSearch && matchesAuthor;
  });

  const toggleSelect = (id: string) => setSelectedPosts(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleSelectAll = () => setSelectedPosts(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));

  const handleEdit = async () => {
    if (!editingPost) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('posts').update({
        content: editingPost.content, edited_at: new Date().toISOString(),
      }).eq('id', editingPost.id);
      if (error) throw error;
      const post = posts.find(p => p.id === editingPost.id);
      await onLogAction('post_edit', 'post', editingPost.id, { threadTitle: post?.threadTitle }, post?.authorId);
      toast.success('Post updated');
      setEditingPost(null);
      onRefresh();
    } catch { toast.error('Failed to update post'); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      await onLogAction('post_delete', 'post', postId, { threadTitle: post?.threadTitle }, post?.authorId);
      toast.success('Post deleted');
      setDeleteConfirm(null);
      onRefresh();
    } catch { toast.error('Failed to delete post'); }
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.size === 0) return;
    if (!confirm(`Delete ${selectedPosts.size} posts? This cannot be undone.`)) return;
    
    try {
      const ids = Array.from(selectedPosts);
      for (const id of ids) {
        await supabase.from('posts').delete().eq('id', id);
      }
      toast.success(`Deleted ${ids.length} posts`);
      setSelectedPosts(new Set());
      onRefresh();
    } catch { toast.error('Bulk delete failed'); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-forum-muted" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search posts..."
            className="w-full rounded-md border border-forum-border bg-forum-bg pl-8 pr-3 py-1.5 text-[10px] font-mono text-forum-text outline-none focus:border-forum-pink" />
        </div>
        <select value={filterAuthor} onChange={e => setFilterAuthor(e.target.value)}
          className="rounded-md border border-forum-border bg-forum-bg px-3 py-1.5 text-[10px] font-mono text-forum-text outline-none focus:border-forum-pink">
          <option value="all">All Authors</option>
          {authors.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedPosts.size > 0 && (
        <div className="hud-panel px-4 py-2 flex items-center gap-2">
          <span className="text-[10px] font-mono text-forum-text font-semibold">{selectedPosts.size} selected</span>
          <button onClick={handleBulkDelete} className="text-[9px] font-mono text-red-500 hover:underline">Delete All</button>
          <button onClick={() => setSelectedPosts(new Set())} className="text-[9px] font-mono text-forum-muted hover:underline">Clear</button>
        </div>
      )}

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditingPost(null)} />
          <div className="relative hud-panel p-5 w-full max-w-2xl mx-4 space-y-3">
            <h3 className="text-[13px] font-mono font-bold text-forum-text">Edit Post</h3>
            <AdvancedEditor
              value={editingPost.content}
              onChange={(newContent) => setEditingPost(p => p ? { ...p, content: newContent } : null)}
              placeholder="Edit post content..."
              minHeight="200px"
            />
            <div className="flex gap-2">
              <button onClick={handleEdit} disabled={isSubmitting} className="transition-forum rounded-md bg-forum-pink px-4 py-1.5 text-[10px] font-mono font-bold text-white hover:bg-forum-pink/90 disabled:opacity-40">
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditingPost(null)} className="transition-forum rounded-md border border-forum-border px-4 py-1.5 text-[10px] font-mono text-forum-muted hover:text-forum-text">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="hud-panel overflow-hidden">
        <div className="border-b border-forum-border px-4 py-3 flex items-center justify-between">
          <h3 className="text-[12px] font-mono font-bold text-forum-text">All Posts ({filtered.length})</h3>
          <label className="flex items-center gap-1.5 text-[9px] font-mono text-forum-muted cursor-pointer">
            <input type="checkbox" checked={selectedPosts.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} /> Select All
          </label>
        </div>
        <div className="divide-y divide-forum-border/20 max-h-[600px] overflow-y-auto">
          {filtered.map(post => (
            <div key={post.id} className="px-4 py-3 hover:bg-forum-hover/30 transition-forum">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selectedPosts.has(post.id)} onChange={() => toggleSelect(post.id)} className="mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-semibold text-forum-text">{post.authorName}</span>
                    <span className="text-[8px] font-mono text-forum-muted">in</span>
                    <span className="text-[10px] font-mono text-forum-pink truncate">{post.threadTitle}</span>
                  </div>
                  <p className="text-[10px] font-mono text-forum-muted line-clamp-2">{post.content.replace(/<[^>]*>/g, '').slice(0, 200)}</p>
                  <div className="flex items-center gap-3 text-[8px] font-mono text-forum-muted mt-1">
                    <span className="flex items-center gap-0.5"><Clock size={7} /> {formatDate(post.createdAt)}</span>
                    <span>👍 {post.upvotes} 👎 {post.downvotes}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button onClick={() => setEditingPost({ id: post.id, content: post.content })} className="transition-forum rounded p-1.5 text-forum-muted hover:text-blue-400 hover:bg-blue-500/10" title="Edit"><Edit3 size={11} /></button>
                  <button onClick={() => window.open(`/thread/${post.threadId}`, '_blank')} className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/10" title="View in thread"><Eye size={11} /></button>
                  {deleteConfirm === post.id ? (
                    <><button onClick={() => handleDelete(post.id)} className="rounded p-1.5 text-red-400 bg-red-500/10"><Check size={11} /></button>
                    <button onClick={() => setDeleteConfirm(null)} className="rounded p-1.5 text-forum-muted"><X size={11} /></button></>
                  ) : (
                    <button onClick={() => setDeleteConfirm(post.id)} className="transition-forum rounded p-1.5 text-forum-muted hover:text-red-400 hover:bg-red-500/10" title="Delete"><Trash2 size={11} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
