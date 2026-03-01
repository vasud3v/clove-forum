import { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { useForumContext } from '@/context/ForumContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';
import { AdvancedEditor } from './editor/AdvancedEditor';

interface EditThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadId: string;
}

export default function EditThreadModal({ isOpen, onClose, threadId }: EditThreadModalProps) {
  const { getThread } = useForumContext();
  const thread = getThread(threadId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [banner, setBanner] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (thread && isOpen) {
      setTitle(thread.title);
      setContent(thread.excerpt || ''); // Load existing content
      setTags(thread.tags?.join(', ') || '');
      setBanner(thread.banner || '');
      setThumbnail(thread.thumbnail || '');
    }
  }, [thread, isOpen]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB to match CreateThreadPage)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      // Upload to ImgBB (same as CreateThreadPage)
      const { uploadToImgBB } = await import('@/lib/avatarUpload');
      const timestamp = Date.now();
      const imageName = `thread-banner-${threadId}-${timestamp}`;
      const imageUrl = await uploadToImgBB(file, imageName);
      
      setBanner(imageUrl);
      toast.success('Banner uploaded successfully');
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error('Failed to upload banner');
    } finally {
      setIsUploading(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Upload to ImgBB
      const { uploadToImgBB } = await import('@/lib/avatarUpload');
      const timestamp = Date.now();
      const imageName = `thread-thumbnail-${threadId}-${timestamp}`;
      const imageUrl = await uploadToImgBB(file, imageName);
      
      setThumbnail(imageUrl);
      toast.success('Thumbnail uploaded successfully');
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Failed to upload thumbnail');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveBanner = () => {
    setBanner('');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    setIsSaving(true);
    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error } = await supabase
        .from('threads')
        .update({
          title: title.trim(),
          excerpt: content.trim().substring(0, 200),
          tags: tagsArray.length > 0 ? tagsArray : null,
          banner: banner || null,
          thumbnail: thumbnail || null,
        })
        .eq('id', threadId);

      if (error) throw error;

      toast.success('Thread updated successfully');
      onClose();
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating thread:', error);
      toast.error('Failed to update thread');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !thread) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-forum-card border border-forum-border rounded-lg shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-forum-border bg-forum-card px-6 py-4">
          <h2 className="text-[16px] font-bold text-forum-text font-mono">Edit Thread</h2>
          <button
            onClick={onClose}
            className="transition-forum rounded-lg p-2 text-forum-muted hover:bg-forum-bg hover:text-forum-text"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-forum-text mb-2 uppercase tracking-wider">
              Thread Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-forum-border bg-forum-bg px-4 py-2.5 text-[13px] font-mono text-forum-text placeholder-forum-muted/50 focus:border-forum-pink/40 focus:outline-none focus:ring-1 focus:ring-forum-pink/20 transition-forum"
              placeholder="Enter thread title..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-forum-text mb-2 uppercase tracking-wider">
              Thread Content
            </label>
            <AdvancedEditor
              value={content}
              onChange={setContent}
              placeholder="Edit thread content..."
              minHeight="200px"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-forum-text mb-2 uppercase tracking-wider">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg border border-forum-border bg-forum-bg px-4 py-2.5 text-[13px] font-mono text-forum-text placeholder-forum-muted/50 focus:border-forum-pink/40 focus:outline-none focus:ring-1 focus:ring-forum-pink/20 transition-forum"
              placeholder="e.g. discussion, help, announcement"
            />
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-forum-text mb-2 uppercase tracking-wider">
              Thread Thumbnail (75x50 preview)
            </label>
            <div className="flex items-center gap-3">
              {thumbnail && (
                <img
                  src={thumbnail}
                  alt="Thread thumbnail"
                  className="h-16 w-16 rounded-md object-cover border border-forum-border"
                  onError={() => {
                    toast.error('Failed to load thumbnail');
                    setThumbnail('');
                  }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                disabled={isUploading}
                className="flex-1 text-[11px] font-mono text-forum-text file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-[11px] file:font-medium file:bg-forum-bg file:text-forum-text hover:file:bg-forum-hover file:cursor-pointer disabled:opacity-50"
              />
              {thumbnail && (
                <button
                  type="button"
                  onClick={() => setThumbnail('')}
                  className="px-3 py-2 text-[11px] font-mono text-forum-muted hover:text-forum-pink transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-[9px] font-mono text-forum-muted/60 mt-1">
              Upload a thumbnail for thread list preview (max 5MB)
            </p>
          </div>

          {/* Banner Upload */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-forum-text mb-2 uppercase tracking-wider">
              Thread Banner
            </label>

            {banner ? (
              <div className="relative group">
                <img
                  src={banner}
                  alt="Thread banner"
                  className="w-full h-48 object-cover rounded-lg border border-forum-border bg-forum-bg"
                  onError={() => {
                    toast.error('Failed to load banner image');
                    setBanner('');
                  }}
                />
                <button
                  onClick={handleRemoveBanner}
                  className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg p-2 transition-forum opacity-0 group-hover:opacity-100"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-forum-border rounded-lg p-8 text-center hover:border-forum-pink/40 hover:bg-forum-pink/5 transition-forum">
                  <div className="flex flex-col items-center gap-3">
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-forum-pink border-t-transparent" />
                        <span className="text-[11px] font-mono text-forum-muted">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-forum-pink/10 border border-forum-pink/20">
                          <ImageIcon size={24} className="text-forum-pink" />
                        </div>
                        <div>
                          <span className="text-[12px] font-mono font-semibold text-forum-text">
                            Click to upload banner
                          </span>
                          <p className="text-[10px] font-mono text-forum-muted mt-1">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-forum-border bg-forum-card px-6 py-4">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="transition-forum rounded-lg border border-forum-border bg-transparent px-4 py-2 text-[11px] font-mono font-semibold text-forum-text hover:bg-forum-bg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !content.trim()}
            className="transition-forum rounded-lg border border-forum-pink/40 bg-transparent px-4 py-2 text-[11px] font-mono font-semibold text-forum-pink hover:bg-forum-pink/10 hover:border-forum-pink/60 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
