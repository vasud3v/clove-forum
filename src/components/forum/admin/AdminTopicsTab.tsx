import { useState, useEffect, useRef } from 'react';
import { Plus, Edit3, Trash2, Check, X, FolderTree, Upload, Image as ImageIcon, Link as LinkIcon, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';
import { uploadImageFile } from '@/lib/uploadMedia';

// Available badge options
const BADGE_OPTIONS = [
  { value: '', label: 'No Badge', color: '' },
  { value: 'new', label: 'New', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { value: 'hot', label: 'Hot', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
  { value: 'trending', label: 'Trending', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { value: 'official', label: 'Official', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { value: 'featured', label: 'Featured', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { value: 'popular', label: 'Popular', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
  { value: 'archived', label: 'Archived', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  { value: 'beta', label: 'Beta', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  { value: 'locked', label: 'Locked', color: 'bg-red-600/10 text-red-500 border-red-600/30' },
  { value: 'premium', label: 'Premium', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
];

interface AdminTopic {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  threadCount: number;
  postCount: number;
  lastActivity: string;
  icon?: string;
  badge?: string;
}

interface AdminCategory {
  id: string;
  name: string;
}

interface Props {
  onRefresh: () => void;
  onLogAction: (action: string, targetType: string, targetId: string, details?: Record<string, any>) => Promise<void>;
}

export default function AdminTopicsTab({ onRefresh, onLogAction }: Props) {
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', categoryId: '', icon: '', badge: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [iconInputMode, setIconInputMode] = useState<'upload' | 'url'>('upload');
  const [iconUrl, setIconUrl] = useState('');
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load topics with category names
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select(`
          id,
          name,
          description,
          category_id,
          thread_count,
          post_count,
          last_activity,
          icon,
          badge,
          categories!topics_category_id_fkey(name)
        `)
        .order('category_id', { ascending: true })
        .order('name', { ascending: true });

      if (topicsError) throw topicsError;

      const formattedTopics = (topicsData || []).map((topic: any) => ({
        id: topic.id,
        name: topic.name,
        description: topic.description || '',
        categoryId: topic.category_id,
        categoryName: Array.isArray(topic.categories) ? topic.categories[0]?.name : topic.categories?.name || 'Unknown',
        threadCount: topic.thread_count || 0,
        postCount: topic.post_count || 0,
        lastActivity: topic.last_activity,
        icon: topic.icon || '',
        badge: topic.badge || '',
      }));

      setTopics(formattedTopics);
    } catch (err: any) {
      console.error('Error loading topics:', err);
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', categoryId: '', icon: '', badge: '' });
    setIconUrl('');
    setIconInputMode('upload');
    setShowCreateForm(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.categoryId) {
      toast.error('Name and category are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const id = `topic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const { error } = await supabase.from('topics').insert({
        id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        category_id: formData.categoryId,
        icon: formData.icon || null,
        badge: formData.badge || null,
        thread_count: 0,
        post_count: 0,
        last_activity: new Date().toISOString(),
      });
      if (error) throw error;
      await onLogAction('topic_create', 'topic', id, { name: formData.name, categoryId: formData.categoryId });
      toast.success('Topic created');
      resetForm();
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.name.trim() || !formData.categoryId) {
      toast.error('Name and category are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('topics').update({
        name: formData.name.trim(),
        description: formData.description.trim(),
        category_id: formData.categoryId,
        icon: formData.icon || null,
        badge: formData.badge || null,
      }).eq('id', editingId);
      if (error) throw error;
      await onLogAction('topic_edit', 'topic', editingId, { name: formData.name });
      toast.success('Topic updated');
      resetForm();
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const topic = topics.find(t => t.id === id);

      if (!topic) {
        toast.error('Topic not found');
        setDeleteConfirm(null);
        return;
      }

      const message = `Delete topic "${topic.name}"?\n\nThis will also delete:\n- ${topic.threadCount || 0} threads\n- ${topic.postCount || 0} posts\n\nThis action cannot be undone!`;

      if (!confirm(message)) {
        setDeleteConfirm(null);
        return;
      }

      console.log('[AdminTopicsTab] Deleting topic:', id);

      // Show loading state
      toast.info('Deleting topic...');

      const { error } = await supabase.from('topics').delete().eq('id', id);

      if (error) {
        console.error('[AdminTopicsTab] Delete error:', error);

        // Check for specific error types
        if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else if (error.code === '23503') {
          toast.error('Cannot delete: Topic has related data. Please delete threads first.');
        } else if (error.code === '42501') {
          toast.error('Permission denied. You may not have rights to delete topics.');
        } else {
          toast.error(`Delete failed: ${error.message}`);
        }

        setDeleteConfirm(null);
        return;
      }

      console.log('[AdminTopicsTab] Topic deleted successfully');

      try {
        await onLogAction('topic_delete', 'topic', id, {
          name: topic.name,
          deletedThreads: topic.threadCount,
          deletedPosts: topic.postCount
        });
      } catch (logError) {
        console.warn('[AdminTopicsTab] Failed to log action:', logError);
        // Don't fail the delete if logging fails
      }

      toast.success('Topic deleted successfully');
      setDeleteConfirm(null);

      // Reload data
      await loadData();
      onRefresh();

    } catch (err: any) {
      console.error('[AdminTopicsTab] Delete failed:', err);

      if (err.message?.includes('Failed to fetch') || err.message?.includes('network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(err.message || 'Failed to delete topic');
      }

      setDeleteConfirm(null);
    }
  };

  const startEdit = (topic: AdminTopic) => {
    setEditingId(topic.id);
    setFormData({ name: topic.name, description: topic.description, categoryId: topic.categoryId, icon: topic.icon || '', badge: topic.badge || '' });
    setIconUrl(topic.icon || '');
    setIconInputMode(topic.icon ? 'url' : 'upload');
    setShowCreateForm(false);
  };

  const handleIconUrlSubmit = () => {
    if (!iconUrl.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }
    // Basic URL validation
    try {
      new URL(iconUrl);
      setFormData(p => ({ ...p, icon: iconUrl.trim() }));
      toast.success('Icon URL added');
    } catch {
      toast.error('Invalid URL format');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 2) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setUploadingIcon(true);

    try {
      // Upload directly to ImgBB (works on any hosting)
      const imageUrl = await uploadImageFile(file);

      // Set the icon URL
      setFormData(p => ({ ...p, icon: imageUrl }));
      toast.success('Icon uploaded successfully!');

    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setUploadingIcon(false);
    }
  };

  const getBadgeStyle = (badge: string) => {
    const badgeOption = BADGE_OPTIONS.find(b => b.value === badge);
    return badgeOption?.color || '';
  };

  const renderForm = (isEditing: boolean) => (
    <div className="hud-panel p-4 space-y-3">
      <h3 className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
        <FolderTree size={14} className="text-forum-pink" />
        {isEditing ? 'Edit Topic' : 'Create New Topic'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">Name *</label>
          <input
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            className="mt-1 w-full rounded-md border border-forum-border bg-forum-bg px-3 py-1.5 text-[11px] font-mono text-forum-text outline-none focus:border-forum-pink"
            placeholder="Topic name"
          />
        </div>
        <div>
          <label className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">Category *</label>
          <select
            value={formData.categoryId}
            onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}
            className="mt-1 w-full rounded-md border border-forum-border bg-forum-bg px-3 py-1.5 text-[11px] font-mono text-forum-text outline-none focus:border-forum-pink"
          >
            <option value="">Select category...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">Description</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
          className="mt-1 w-full rounded-md border border-forum-border bg-forum-bg px-3 py-1.5 text-[11px] font-mono text-forum-text outline-none focus:border-forum-pink resize-none h-16"
          placeholder="Topic description"
        />
      </div>

      {/* Badge Selection */}
      <div>
        <label className="text-[9px] font-mono text-forum-muted uppercase tracking-wider mb-2 block flex items-center gap-1.5">
          <Award size={10} />
          Topic Badge
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {BADGE_OPTIONS.map(badge => (
            <button
              key={badge.value}
              type="button"
              onClick={() => setFormData(p => ({ ...p, badge: badge.value }))}
              className={`transition-forum rounded-md px-2 py-1.5 text-[9px] font-mono font-bold border ${formData.badge === badge.value
                  ? badge.color || 'border-forum-pink bg-forum-pink/10 text-forum-pink'
                  : 'border-forum-border text-forum-muted hover:border-forum-pink/30'
                }`}
            >
              {badge.label}
            </button>
          ))}
        </div>
      </div>

      {/* Icon Upload/URL Section */}
      <div>
        <label className="text-[9px] font-mono text-forum-muted uppercase tracking-wider mb-2 block">Topic Icon</label>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setIconInputMode('upload')}
            className={`transition-forum flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[9px] font-mono border ${iconInputMode === 'upload'
                ? 'border-forum-pink bg-forum-pink/10 text-forum-pink'
                : 'border-forum-border text-forum-muted hover:border-forum-pink/30'
              }`}
          >
            <Upload size={10} />
            Upload
          </button>
          <button
            type="button"
            onClick={() => setIconInputMode('url')}
            className={`transition-forum flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[9px] font-mono border ${iconInputMode === 'url'
                ? 'border-forum-pink bg-forum-pink/10 text-forum-pink'
                : 'border-forum-border text-forum-muted hover:border-forum-pink/30'
              }`}
          >
            <LinkIcon size={10} />
            URL
          </button>
        </div>

        <div className="flex items-start gap-3">
          {/* Icon Preview */}
          {formData.icon ? (
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={formData.icon}
                  alt="Topic icon"
                  className="w-full h-full object-contain transition-opacity duration-300"
                  onLoad={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  style={{ opacity: 0 }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData(p => ({ ...p, icon: '' }));
                  setIconUrl('');
                }}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X size={12} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[7px] font-mono px-1 py-0.5 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity text-center">
                Recommended: 64x64 to 512x512
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-forum-border flex flex-col items-center justify-center flex-shrink-0">
              <ImageIcon size={20} className="text-forum-muted mb-1" />
              <span className="text-[7px] font-mono text-forum-muted">No Icon</span>
            </div>
          )}

          {/* Upload/URL Input */}
          <div className="flex-1 space-y-2">
            {iconInputMode === 'upload' ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingIcon}
                  className="w-full transition-forum flex items-center justify-center gap-1.5 rounded-md border border-forum-border px-3 py-2 text-[10px] font-mono text-forum-muted hover:text-forum-pink hover:border-forum-pink/30 disabled:opacity-50"
                >
                  <Upload size={12} />
                  {uploadingIcon ? 'Processing...' : formData.icon ? 'Change Icon' : 'Upload from Device'}
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <input
                  type="url"
                  value={iconUrl}
                  onChange={e => setIconUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleIconUrlSubmit()}
                  className="w-full rounded-md border border-forum-border bg-forum-bg px-3 py-2 text-[10px] font-mono text-forum-text outline-none focus:border-forum-pink"
                  placeholder="https://example.com/icon.png"
                />
                <button
                  type="button"
                  onClick={handleIconUrlSubmit}
                  className="w-full transition-forum rounded-md bg-forum-pink/10 border border-forum-pink/30 px-3 py-1.5 text-[9px] font-mono text-forum-pink hover:bg-forum-pink/20"
                >
                  Apply URL
                </button>
              </div>
            )}

            <div className="bg-forum-bg border border-forum-border/50 rounded-md px-2 py-1.5">
              <p className="text-[8px] font-mono text-forum-muted leading-relaxed">
                <strong className="text-forum-text">Recommended:</strong> Square images (64x64 to 512x512px).
                Supports PNG, JPG, GIF, WebP. Max 2MB.
                {iconInputMode === 'upload' ? (
                  <span className="block mt-1 text-emerald-400">
                    Files are automatically saved to public/topic-icons/
                  </span>
                ) : (
                  <span className="block mt-1 text-blue-400">
                    Use local path (/topic-icons/file.png) or external URL
                  </span>
                )}
                <span className="block mt-1 text-yellow-400">
                  ⚠️ Use PNG with transparent background for best results
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={isEditing ? handleUpdate : handleCreate}
          disabled={isSubmitting || !formData.name.trim() || !formData.categoryId}
          className="transition-forum rounded-md bg-forum-pink px-4 py-2 text-[10px] font-mono font-bold text-white hover:bg-forum-pink/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Topic' : 'Create Topic'}
        </button>
        <button
          onClick={resetForm}
          className="transition-forum rounded-md border border-forum-border px-4 py-2 text-[10px] font-mono text-forum-muted hover:text-forum-text"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const filteredTopics = filterCategory === 'all'
    ? topics
    : topics.filter(t => t.categoryId === filterCategory);

  if (loading) {
    return (
      <div className="hud-panel p-8 text-center">
        <div className="text-[11px] font-mono text-forum-muted">Loading topics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {!showCreateForm && !editingId && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="transition-forum flex items-center gap-1.5 rounded-md bg-forum-pink px-4 py-2 text-[10px] font-mono font-bold text-white hover:bg-forum-pink/90"
          >
            <Plus size={12} /> Create Topic
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <label className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">Filter:</label>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="rounded-md border border-forum-border bg-forum-bg px-3 py-1.5 text-[10px] font-mono text-forum-text outline-none focus:border-forum-pink"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {showCreateForm && renderForm(false)}
      {editingId && renderForm(true)}

      <div className="hud-panel overflow-hidden">
        <div className="border-b border-forum-border px-4 py-3">
          <h3 className="text-[12px] font-mono font-bold text-forum-text">
            All Topics ({filteredTopics.length})
          </h3>
        </div>
        <div className="divide-y divide-forum-border/20">
          {filteredTopics.length === 0 ? (
            <div className="px-4 py-8 text-center text-[10px] font-mono text-forum-muted">
              No topics found. Create one to get started!
            </div>
          ) : (
            filteredTopics.map((topic) => (
              <div key={topic.id} className="flex items-center gap-3 px-4 py-3 hover:bg-forum-hover/30 transition-forum">
                {/* Topic Icon */}
                {topic.icon ? (
                  <div className="relative w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src={topic.icon}
                      alt={topic.name}
                      className="w-full h-full object-contain transition-opacity duration-300"
                      onLoad={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onError={(e) => {
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) {
                          e.currentTarget.style.display = 'none';
                          fallback.style.display = 'flex';
                        }
                      }}
                      style={{ opacity: 0 }}
                    />
                    <div className="hidden absolute inset-0 items-center justify-center">
                      <FolderTree size={18} className="text-forum-muted" />
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-forum-bg">
                    <FolderTree size={18} className="text-forum-muted" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-semibold text-forum-text">{topic.name}</span>
                    <span className="text-[8px] font-mono text-forum-pink border border-forum-pink/20 rounded-sm px-1.5 py-0.5">
                      {topic.categoryName}
                    </span>
                    {topic.badge && (
                      <span className={`text-[7px] font-mono font-bold border rounded-sm px-1.5 py-0.5 uppercase ${getBadgeStyle(topic.badge)}`}>
                        {BADGE_OPTIONS.find(b => b.value === topic.badge)?.label || topic.badge}
                      </span>
                    )}
                  </div>
                  {topic.description && (
                    <div className="text-[9px] font-mono text-forum-muted mt-0.5 line-clamp-1">{topic.description}</div>
                  )}
                  <div className="flex items-center gap-3 text-[8px] font-mono text-forum-muted mt-1">
                    <span>{topic.threadCount} threads</span>
                    <span>{topic.postCount} posts</span>
                    {topic.icon && <span className="text-emerald-400">✓ Icon</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(topic)}
                    className="transition-forum rounded p-1.5 text-forum-muted hover:text-blue-400 hover:bg-blue-500/10"
                    title="Edit topic"
                  >
                    <Edit3 size={12} />
                  </button>
                  {deleteConfirm === topic.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(topic.id)}
                        className="transition-forum rounded p-1.5 text-red-400 bg-red-500/10"
                        title="Confirm delete"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-text"
                        title="Cancel"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(topic.id)}
                      className="transition-forum rounded p-1.5 text-forum-muted hover:text-red-400 hover:bg-red-500/10"
                      title="Delete topic"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
