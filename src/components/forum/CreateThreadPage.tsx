import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Home as HomeIcon, ChevronRight, ArrowLeft, Send, X } from 'lucide-react';
import ForumHeader from './ForumHeader';
import MobileBottomNav from './MobileBottomNav';
import PostContentRenderer from './PostContentRenderer';
import { useAuth } from '@/context/AuthContext';
import { useForumContext } from '@/context/ForumContext';
import { supabase } from '@/lib/supabase';
import { toast } from './Toast';
import { AdvancedEditor } from './editor/AdvancedEditor';
import { validateThreadCreation, validateTags, THREAD_VALIDATION } from '@/lib/threadValidation';

export default function CreateThreadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { categories } = useForumContext();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const selectedCategory = searchParams.get('category') || '';
  const selectedTopic = searchParams.get('topic') || '';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tags, setTags] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [banner, setBanner] = useState('');
  const [watchThread, setWatchThread] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const category = categories.find(c => c.id === selectedCategory);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      // Upload to ImgBB
      const { uploadToImgBB } = await import('@/lib/avatarUpload');
      const timestamp = Date.now();
      const imageName = `${user!.id}-thread-thumbnail-${timestamp}`;
      const imageUrl = await uploadToImgBB(file, imageName);
      setThumbnail(imageUrl);
      toast.success('Thumbnail uploaded successfully');
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Failed to upload thumbnail');
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    try {
      // Upload to ImgBB
      const { uploadToImgBB } = await import('@/lib/avatarUpload');
      const timestamp = Date.now();
      const imageName = `${user!.id}-thread-banner-${timestamp}`;
      const imageUrl = await uploadToImgBB(file, imageName);
      setBanner(imageUrl);
      toast.success('Banner uploaded successfully');
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error('Failed to upload banner');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation
    const validation = validateThreadCreation(title, content, selectedCategory, tags);
    
    if (!validation.isValid) {
      const firstError = validation.errors[0];
      toast.error(firstError.message);
      return;
    }

    if (!selectedTopic) {
      toast.error('Please select a topic');
      return;
    }

    // Validate tags
    const tagsValidation = validateTags(tags);
    if (!tagsValidation.isValid) {
      toast.error(tagsValidation.error?.message || 'Invalid tags');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create thread
      const threadId = `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      
      const { error: threadError } = await supabase.from('threads').insert({
        id: threadId,
        title: title.trim(),
        excerpt: content.trim().substring(0, 200),
        author_id: user!.id,
        category_id: selectedCategory,
        topic_id: selectedTopic,
        tags: tagsValidation.tags,
        thumbnail: thumbnail || null,
        banner: banner || null,
        created_at: new Date().toISOString(),
        last_reply_at: new Date().toISOString(),
        last_reply_by_id: user!.id,
        reply_count: 0,
        view_count: 0,
        upvotes: 0,
        downvotes: 0,
        is_pinned: false,
        is_locked: false,
        is_hot: false,
      });

      if (threadError) throw threadError;

      // Create first post
      const postId = `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      
      const { error: postError } = await supabase.from('posts').insert({
        id: postId,
        thread_id: threadId,
        author_id: user!.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0,
        is_answer: false,
      });

      if (postError) throw postError;

      // Watch thread if option is selected
      if (watchThread) {
        await supabase.from('watched_threads').insert({
          user_id: user!.id,
          thread_id: threadId,
          email_notifications: emailNotifications,
          created_at: new Date().toISOString(),
        });
      }

      toast.success('Thread created successfully!');
      navigate(`/thread/${threadId}`);
    } catch (error: any) {
      console.error('Error creating thread:', error);
      toast.error(error.message || 'Failed to create thread');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-forum-bg pb-20 lg:pb-0">
      <ForumHeader
        searchQuery=""
        onSearchChange={() => {}}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-4 pb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted">
          <Link to="/" className="hover:text-forum-pink transition-forum">
            <HomeIcon size={11} className="text-forum-pink" />
          </Link>
          <ChevronRight size={10} />
          <Link to="/" className="hover:text-forum-pink transition-forum">
            Forums
          </Link>
          {category && (
            <>
              <ChevronRight size={10} />
              <Link to={`/category/${selectedCategory}`} className="hover:text-forum-pink transition-forum">
                {category.name}
              </Link>
            </>
          )}
          <ChevronRight size={10} />
          <span className="text-forum-pink">Create Thread</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-4 lg:px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-[11px] font-mono text-forum-muted hover:text-forum-pink transition-forum"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Create Thread Form */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-visible">
          {/* Header */}
          <div className="border-b border-zinc-800 px-6 py-4">
            <h1 className="text-[18px] font-semibold text-zinc-100">
              Post Thread
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Prefixes Dropdown (Placeholder for future) */}
            <div>
              <select
                disabled
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-[13px] text-zinc-400 outline-none cursor-not-allowed"
              >
                <option>Prefixes...</option>
              </select>
            </div>

            {/* Thread Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Thread title"
                required
                maxLength={THREAD_VALIDATION.TITLE_MAX_LENGTH}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-[14px] text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                {title.length}/{THREAD_VALIDATION.TITLE_MAX_LENGTH} characters
              </p>
            </div>

            {/* Content Editor */}
            <div>
              <AdvancedEditor
                value={content}
                onChange={(newContent) => {
                  // Enforce max length
                  if (newContent.length <= THREAD_VALIDATION.CONTENT_MAX_LENGTH) {
                    setContent(newContent);
                  }
                }}
                onPreview={() => setShowPreview(true)}
                placeholder="Remember: No 'bump, anything new, any vids?' spam allowed."
                minHeight="280px"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                {content.length}/{THREAD_VALIDATION.CONTENT_MAX_LENGTH} characters
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[13px] text-zinc-300 mb-2">
                Tags:
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder=""
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-[13px] text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Multiple tags may be separated by commas.
              </p>
            </div>

            {/* Thread Thumbnail */}
            <div>
              <label className="block text-[13px] text-zinc-300 mb-2">
                Thread Thumbnail (Optional):
              </label>
              <div className="flex items-center gap-3">
                {thumbnail && (
                  <img 
                    src={thumbnail} 
                    alt="Thread thumbnail" 
                    className="h-16 w-16 rounded-md object-cover border border-zinc-700"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="flex-1 text-[13px] text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-[13px] file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 file:cursor-pointer"
                />
                {thumbnail && (
                  <button
                    type="button"
                    onClick={() => setThumbnail('')}
                    className="px-3 py-2 text-[13px] text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Upload a custom thumbnail for your thread (max 5MB)
              </p>
            </div>

            {/* Thread Banner */}
            <div>
              <label className="block text-[13px] text-zinc-300 mb-2">
                Thread Banner (Optional):
              </label>
              <div className="space-y-3">
                {banner && (
                  <img 
                    src={banner} 
                    alt="Thread banner" 
                    className="w-full h-32 rounded-md object-cover border border-zinc-700"
                  />
                )}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="flex-1 text-[13px] text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-[13px] file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 file:cursor-pointer"
                  />
                  {banner && (
                    <button
                      type="button"
                      onClick={() => setBanner('')}
                      className="px-3 py-2 text-[13px] text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Upload a custom banner for your thread (max 10MB, recommended: 1200x300px)
              </p>
            </div>

            {/* Options */}
            <div>
              <label className="block text-[13px] text-zinc-300 mb-3">
                Options:
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={watchThread}
                    onChange={(e) => setWatchThread(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-teal-600 focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                  />
                  <span className="text-[13px] text-zinc-300 group-hover:text-zinc-100 transition-colors">
                    Watch this thread...
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group ml-6">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    disabled={!watchThread}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-teal-600 focus:ring-2 focus:ring-teal-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-[13px] text-zinc-300 group-hover:text-zinc-100 transition-colors">
                    and receive email notifications
                  </span>
                </label>
              </div>
            </div>

            {/* Hidden fields for category and topic */}
            <input type="hidden" value={selectedCategory} required />
            <input type="hidden" value={selectedTopic} required />

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim() || !selectedCategory || !selectedTopic}
                className="flex items-center gap-2 rounded-md bg-teal-600 hover:bg-teal-700 px-5 py-2.5 text-[13px] font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send size={14} />
                {isSubmitting ? 'Posting...' : 'Post Thread'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-[18px] font-semibold text-zinc-100">Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-zinc-800/50 rounded-lg border border-zinc-700 p-6">
                {/* Thread Title */}
                <h1 className="text-[20px] font-semibold text-zinc-100 mb-4">
                  {title || 'Untitled Thread'}
                </h1>

                {/* Rendered Content */}
                <div className="prose prose-invert max-w-none">
                  <PostContentRenderer content={content} />
                </div>

                {/* Tags Preview */}
                {tags.trim() && (
                  <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-zinc-700">
                    {tags.split(',').map((tag, index) => {
                      const trimmedTag = tag.trim();
                      return trimmedTag ? (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-md bg-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-300"
                        >
                          {trimmedTag}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-800">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-5 py-2.5 text-[13px] font-medium text-zinc-300 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
