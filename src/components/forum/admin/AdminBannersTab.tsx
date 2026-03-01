import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Briefcase, Megaphone, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useForumContext } from '@/context/ForumContext';

interface Banner {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'hiring' | 'announcement' | 'warning';
  link_text?: string;
  link_url?: string;
  is_active: boolean;
  is_dismissible: boolean;
  expires_at?: string;
  created_at: string;
}

const typeIcons = {
  info: Info,
  hiring: Briefcase,
  announcement: Megaphone,
  warning: AlertTriangle,
};

const typeColors = {
  info: 'text-cyan-400',
  hiring: 'text-emerald-400',
  announcement: 'text-forum-pink',
  warning: 'text-amber-400',
};

export default function AdminBannersTab() {
  const { currentUser } = useForumContext();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as Banner['type'],
    link_text: '',
    link_url: '',
    is_active: true,
    is_dismissible: true,
    expires_at: '',
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('announcement_banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const bannerData = {
        ...formData,
        link_text: formData.link_text || null,
        link_url: formData.link_url || null,
        expires_at: formData.expires_at || null,
        created_by: currentUser.id,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('announcement_banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('announcement_banners')
          .insert([bannerData]);

        if (error) throw error;
      }

      resetForm();
      fetchBanners();
    } catch (error) {
      console.error('Failed to save banner:', error);
      alert('Failed to save banner');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      message: banner.message,
      type: banner.type,
      link_text: banner.link_text || '',
      link_url: banner.link_url || '',
      is_active: banner.is_active,
      is_dismissible: banner.is_dismissible,
      expires_at: banner.expires_at ? banner.expires_at.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const { error } = await supabase
        .from('announcement_banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchBanners();
    } catch (error) {
      console.error('Failed to delete banner:', error);
      alert('Failed to delete banner');
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from('announcement_banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);

      if (error) throw error;
      fetchBanners();
    } catch (error) {
      console.error('Failed to toggle banner:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      link_text: '',
      link_url: '',
      is_active: true,
      is_dismissible: true,
      expires_at: '',
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-8 text-forum-muted">Loading banners...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-bold text-forum-text font-mono">Announcement Banners</h2>
          <p className="text-[10px] text-forum-muted font-mono mt-1">
            Manage site-wide announcement banners for hiring, updates, and alerts
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-forum-pink/10 border border-forum-pink/30 text-forum-pink hover:bg-forum-pink/20 transition-all text-[11px] font-mono"
        >
          <Plus size={12} />
          New Banner
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="hud-panel p-4">
          <h3 className="text-[12px] font-bold text-forum-text font-mono mb-3">
            {editingBanner ? 'Edit Banner' : 'Create New Banner'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-forum-muted mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-forum-bg border border-forum-border rounded-md text-[11px] font-mono text-forum-text focus:border-forum-pink focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-forum-muted mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Banner['type'] })}
                  className="w-full px-3 py-2 bg-forum-bg border border-forum-border rounded-md text-[11px] font-mono text-forum-text focus:border-forum-pink focus:outline-none"
                >
                  <option value="info">Info</option>
                  <option value="hiring">Hiring</option>
                  <option value="announcement">Announcement</option>
                  <option value="warning">Warning</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-forum-muted mb-1">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 bg-forum-bg border border-forum-border rounded-md text-[11px] font-mono text-forum-text focus:border-forum-pink focus:outline-none"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-forum-muted mb-1">Link Text (Optional)</label>
                <input
                  type="text"
                  value={formData.link_text}
                  onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                  className="w-full px-3 py-2 bg-forum-bg border border-forum-border rounded-md text-[11px] font-mono text-forum-text focus:border-forum-pink focus:outline-none"
                  placeholder="e.g., Apply Now"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-forum-muted mb-1">Link URL (Optional)</label>
                <input
                  type="text"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full px-3 py-2 bg-forum-bg border border-forum-border rounded-md text-[11px] font-mono text-forum-text focus:border-forum-pink focus:outline-none"
                  placeholder="e.g., /apply"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-forum-muted mb-1">Expires At (Optional)</label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="w-full px-3 py-2 bg-forum-bg border border-forum-border rounded-md text-[11px] font-mono text-forum-text focus:border-forum-pink focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-[10px] font-mono text-forum-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-forum-border"
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-[10px] font-mono text-forum-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_dismissible}
                  onChange={(e) => setFormData({ ...formData, is_dismissible: e.target.checked })}
                  className="rounded border-forum-border"
                />
                Dismissible
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-forum-pink/10 border border-forum-pink/30 text-forum-pink hover:bg-forum-pink/20 transition-all text-[11px] font-mono"
              >
                {editingBanner ? 'Update' : 'Create'} Banner
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-md bg-forum-bg border border-forum-border text-forum-muted hover:bg-forum-hover transition-all text-[11px] font-mono"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners List */}
      <div className="space-y-2">
        {banners.length === 0 ? (
          <div className="hud-panel p-8 text-center">
            <p className="text-[11px] font-mono text-forum-muted">No banners yet. Create one to get started!</p>
          </div>
        ) : (
          banners.map((banner) => {
            const Icon = typeIcons[banner.type];
            const color = typeColors[banner.type];
            return (
              <div key={banner.id} className="hud-panel p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 ${color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[12px] font-bold text-forum-text font-mono">{banner.title}</h3>
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full border ${color} ${banner.type === 'hiring' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-forum-bg border-forum-border'}`}>
                        {banner.type}
                      </span>
                      {!banner.is_active && (
                        <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-forum-muted/10 border border-forum-muted/30 text-forum-muted">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-forum-muted font-mono">{banner.message}</p>
                    {banner.link_text && (
                      <p className="text-[9px] text-forum-muted/60 font-mono mt-1">
                        Link: {banner.link_text} → {banner.link_url}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(banner)}
                      className="p-2 rounded-md hover:bg-forum-hover transition-all text-forum-muted hover:text-forum-text"
                      title={banner.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {banner.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      onClick={() => handleEdit(banner)}
                      className="p-2 rounded-md hover:bg-forum-hover transition-all text-forum-muted hover:text-cyan-400"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-2 rounded-md hover:bg-forum-hover transition-all text-forum-muted hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
