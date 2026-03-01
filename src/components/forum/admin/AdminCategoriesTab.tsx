import { useState } from 'react';
import { Plus, Edit3, Trash2, ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';

interface AdminCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  threadCount: number;
  postCount: number;
  isSticky: boolean;
  isImportant: boolean;
  sortOrder: number;
}

interface Props {
  categories: AdminCategory[];
  onRefresh: () => void;
  onLogAction: (action: string, targetType: string, targetId: string, details?: Record<string, any>) => Promise<void>;
}

const ICON_OPTIONS = ['MessageSquare', 'Code', 'Gamepad2', 'BookOpen', 'Music', 'Film', 'Image', 'Globe', 'Shield', 'Zap', 'Heart', 'Star', 'Award', 'Coffee', 'Bug', 'Terminal'];

export default function AdminCategoriesTab({ categories, onRefresh, onLogAction }: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: 'MessageSquare', isSticky: false, isImportant: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({ name: '', description: '', icon: 'MessageSquare', isSticky: false, isImportant: false });
    setShowCreateForm(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      const id = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const { error } = await supabase.from('categories').insert({
        id, name: formData.name.trim(), description: formData.description.trim(),
        icon: formData.icon, is_sticky: formData.isSticky, is_important: formData.isImportant,
        sort_order: categories.length,
      });
      if (error) throw error;
      await onLogAction('category_create', 'category', id, { name: formData.name });
      toast.success('Category created');
      resetForm();
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('categories').update({
        name: formData.name.trim(), description: formData.description.trim(),
        icon: formData.icon, is_sticky: formData.isSticky, is_important: formData.isImportant,
      }).eq('id', editingId);
      if (error) throw error;
      await onLogAction('category_edit', 'category', editingId, { name: formData.name });
      toast.success('Category updated');
      resetForm();
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const cat = categories.find(c => c.id === id);
      
      // Count what will be deleted
      const { count: topicCount } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);
      
      const { count: threadCount } = await supabase
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);
      
      // Get threads in this category to count posts
      const { data: categoryThreads } = await supabase
        .from('threads')
        .select('id')
        .eq('category_id', id);
      
      const threadIds = categoryThreads?.map(t => t.id) || [];
      
      let postCount = 0;
      if (threadIds.length > 0) {
        const { count } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .in('thread_id', threadIds);
        postCount = count || 0;
      }

      const message = `Delete category "${cat?.name}"?\n\nThis will also delete:\n- ${topicCount || 0} topics\n- ${threadCount || 0} threads\n- ${postCount || 0} posts\n\nThis action cannot be undone!`;
      
      if (!confirm(message)) return;

      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      await onLogAction('category_delete', 'category', id, { 
        name: cat?.name,
        deletedTopics: topicCount,
        deletedThreads: threadCount,
        deletedPosts: postCount
      });
      toast.success('Category and all its content deleted');
      setDeleteConfirm(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const idx = categories.findIndex(c => c.id === id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === categories.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    try {
      await Promise.all([
        supabase.from('categories').update({ sort_order: swapIdx }).eq('id', categories[idx].id),
        supabase.from('categories').update({ sort_order: idx }).eq('id', categories[swapIdx].id),
      ]);
      await onLogAction('category_reorder', 'category', id, { direction });
      onRefresh();
    } catch {
      toast.error('Failed to reorder');
    }
  };

  const startEdit = (cat: AdminCategory) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, description: cat.description, icon: cat.icon, isSticky: cat.isSticky, isImportant: cat.isImportant });
    setShowCreateForm(false);
  };

  const renderForm = (isEditing: boolean) => (
    <div className="hud-panel p-4 space-y-3">
      <h3 className="text-[12px] font-mono font-bold text-forum-text">
        {isEditing ? 'Edit Category' : 'Create New Category'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">Name</label>
          <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            className="mt-1 w-full rounded-md border border-forum-border bg-forum-bg px-3 py-1.5 text-[11px] font-mono text-forum-text outline-none focus:border-forum-pink" placeholder="Category name" />
        </div>
        <div>
          <label className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">Icon</label>
          <select value={formData.icon} onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))}
            className="mt-1 w-full rounded-md border border-forum-border bg-forum-bg px-3 py-1.5 text-[11px] font-mono text-forum-text outline-none focus:border-forum-pink">
            {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">Description</label>
        <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
          className="mt-1 w-full rounded-md border border-forum-border bg-forum-bg px-3 py-1.5 text-[11px] font-mono text-forum-text outline-none focus:border-forum-pink resize-none h-16" placeholder="Category description" />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted cursor-pointer">
          <input type="checkbox" checked={formData.isSticky} onChange={e => setFormData(p => ({ ...p, isSticky: e.target.checked }))} className="rounded" /> Sticky
        </label>
        <label className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted cursor-pointer">
          <input type="checkbox" checked={formData.isImportant} onChange={e => setFormData(p => ({ ...p, isImportant: e.target.checked }))} className="rounded" /> Important
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={isEditing ? handleUpdate : handleCreate} disabled={isSubmitting || !formData.name.trim()}
          className="transition-forum rounded-md bg-forum-pink px-4 py-1.5 text-[10px] font-mono font-bold text-white hover:bg-forum-pink/90 disabled:opacity-40">
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
        </button>
        <button onClick={resetForm} className="transition-forum rounded-md border border-forum-border px-4 py-1.5 text-[10px] font-mono text-forum-muted hover:text-forum-text">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {!showCreateForm && !editingId && (
        <button onClick={() => setShowCreateForm(true)}
          className="transition-forum flex items-center gap-1.5 rounded-md bg-forum-pink px-4 py-2 text-[10px] font-mono font-bold text-white hover:bg-forum-pink/90">
          <Plus size={12} /> Create Category
        </button>
      )}
      {showCreateForm && renderForm(false)}
      {editingId && renderForm(true)}
      <div className="hud-panel overflow-hidden">
        <div className="border-b border-forum-border px-4 py-3">
          <h3 className="text-[12px] font-mono font-bold text-forum-text">All Categories ({categories.length})</h3>
        </div>
        <div className="divide-y divide-forum-border/20">
          {categories.map((cat, idx) => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-3 hover:bg-forum-hover/30 transition-forum">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => handleReorder(cat.id, 'up')} disabled={idx === 0} className="text-forum-muted hover:text-forum-pink disabled:opacity-20 transition-forum"><ArrowUp size={10} /></button>
                <button onClick={() => handleReorder(cat.id, 'down')} disabled={idx === categories.length - 1} className="text-forum-muted hover:text-forum-pink disabled:opacity-20 transition-forum"><ArrowDown size={10} /></button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold text-forum-text">{cat.name}</span>
                  {cat.isSticky && <span className="text-[7px] font-mono text-amber-400 border border-amber-500/20 rounded-sm px-1">STICKY</span>}
                  {cat.isImportant && <span className="text-[7px] font-mono text-red-400 border border-red-500/20 rounded-sm px-1">IMPORTANT</span>}
                </div>
                <div className="text-[9px] font-mono text-forum-muted mt-0.5">{cat.description}</div>
                <div className="flex items-center gap-3 text-[8px] font-mono text-forum-muted mt-0.5">
                  <span>{cat.threadCount} threads</span>
                  <span>{cat.postCount} posts</span>
                  <span>Icon: {cat.icon}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => startEdit(cat)} className="transition-forum rounded p-1.5 text-forum-muted hover:text-blue-400 hover:bg-blue-500/10"><Edit3 size={12} /></button>
                {deleteConfirm === cat.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(cat.id)} className="transition-forum rounded p-1.5 text-red-400 bg-red-500/10"><Check size={12} /></button>
                    <button onClick={() => setDeleteConfirm(null)} className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-text"><X size={12} /></button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(cat.id)} className="transition-forum rounded p-1.5 text-forum-muted hover:text-red-400 hover:bg-red-500/10"><Trash2 size={12} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
