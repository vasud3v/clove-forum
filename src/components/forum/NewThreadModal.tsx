import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  PenSquare,
  Check,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { useForumContext } from '@/context/ForumContext';
import { supabase } from '@/lib/supabase';
import { AdvancedEditor } from './editor/AdvancedEditor';
import { 
  validateThreadCreation, 
  validateTags, 
  THREAD_VALIDATION,
  type ThreadValidationError 
} from '@/lib/threadValidation';

interface NewThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
}

export default function NewThreadModal({ isOpen, onClose, defaultCategoryId }: NewThreadModalProps) {
  const navigate = useNavigate();
  const { categories, createThread, currentUser } = useForumContext();
  
  // All useState hooks MUST come first
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategoryId || '');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // All useEffect hooks come after useState
  // Sync selectedCategory when defaultCategoryId prop changes
  useEffect(() => {
    if (defaultCategoryId) {
      setSelectedCategory(defaultCategoryId);
    }
  }, [defaultCategoryId]);
  
  // Reset topic when category changes
  useEffect(() => {
    setSelectedTopic('');
  }, [selectedCategory]);
  
  // Debug: Log categories to check if topics are loaded (development only)
  useEffect(() => {
    if (isOpen && import.meta.env.DEV) {
      console.log('[NewThreadModal] Modal opened');
      console.log('[NewThreadModal] Categories:', categories);
      console.log('[NewThreadModal] Categories length:', categories?.length);
      console.log('[NewThreadModal] Current user:', currentUser);
      console.log('[NewThreadModal] Current user role:', currentUser?.role);
      console.log('[NewThreadModal] Categories detail:', categories.map(c => ({
        id: c.id,
        name: c.name,
        isImportant: c.isImportant,
        isSticky: c.isSticky
      })));
      
      const isStaff = currentUser?.role === 'admin' || 
                     currentUser?.role === 'super_moderator' || 
                     currentUser?.role === 'moderator';
      console.log('[NewThreadModal] Is staff user?:', isStaff);
      
      console.log('[NewThreadModal] Filtered categories:', 
        categories.filter((cat) => {
          const isStaff = currentUser?.role === 'admin' || 
                         currentUser?.role === 'super_moderator' || 
                         currentUser?.role === 'moderator';
          return isStaff || !cat.isImportant;
        }).map(c => c.name));
      console.log('[NewThreadModal] Selected category:', selectedCategory);
      const cat = categories.find(c => c.id === selectedCategory);
      console.log('[NewThreadModal] Selected category data:', cat);
      console.log('[NewThreadModal] Topics for selected category:', cat?.topics);
    }
  }, [isOpen, categories, selectedCategory, currentUser]);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, thumbnail: 'Please select an image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, thumbnail: 'Image must be less than 5MB' });
      return;
    }

    try {
      const { uploadToImgBB } = await import('@/lib/avatarUpload');
      const timestamp = Date.now();
      const imageName = `thread-thumbnail-${timestamp}`;
      const imageUrl = await uploadToImgBB(file, imageName);
      setThumbnail(imageUrl);
      setErrors({ ...errors, thumbnail: undefined });
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      setErrors({ ...errors, thumbnail: 'Failed to upload thumbnail' });
    }
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});

    // Comprehensive validation
    const validation = validateThreadCreation(title, content, selectedCategory, tagsInput);
    
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    // Additional category validation
    const cat = categories.find((c) => c.id === selectedCategory);
    if (!cat) {
      setErrors({ category: 'Selected category no longer exists' });
      return;
    }
    
    // Check if category is important and user is not staff
    const isStaff = currentUser?.role === 'admin' || 
                   currentUser?.role === 'super_moderator' || 
                   currentUser?.role === 'moderator';
    
    if (cat.isImportant && !isStaff) {
      setErrors({ category: 'This category is for moderators only' });
      return;
    }

    // Validate topic if selected
    if (selectedTopic) {
      const topicExists = cat.topics?.some(t => t.id === selectedTopic);
      if (!topicExists) {
        setErrors({ topic: 'Selected topic is not valid for this category' });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Parse and validate tags
      const tagsValidation = validateTags(tagsInput);
      if (!tagsValidation.isValid) {
        setErrors({ tags: tagsValidation.error?.message || 'Invalid tags' });
        setIsSubmitting(false);
        return;
      }

      // Create the thread through context
      const newThread = await createThread(
        title.trim(), 
        selectedCategory, 
        content.trim(), 
        tagsValidation.tags,
        undefined, // poll
        selectedTopic || undefined // topicId
      );

      // Update thread with thumbnail if provided
      if (thumbnail) {
        const { error: thumbnailError } = await supabase
          .from('threads')
          .update({ thumbnail })
          .eq('id', newThread.id);
        
        if (thumbnailError) {
          console.error('Failed to update thumbnail:', thumbnailError);
        }
      }

      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccess(false);
        setTitle('');
        setSelectedCategory(defaultCategoryId || '');
        setSelectedTopic('');
        setContent('');
        setTagsInput('');
        setThumbnail('');
        setErrors({});
        onClose();
        // Navigate to the new thread and reload to show updated data
        navigate(`/thread/${newThread.id}`);
        window.location.reload();
      }, 800);
    } catch (error: any) {
      // Handle specific error types
      setIsSubmitting(false);
      
      let errorMessage = 'Failed to create thread. Please try again.';
      
      if (error?.code === 'AUTH_REQUIRED') {
        errorMessage = 'You must be logged in to create threads.';
      } else if (error?.code === 'INVALID_CATEGORY') {
        errorMessage = 'The selected category is no longer available.';
        setErrors({ category: errorMessage });
        return;
      } else if (error?.code === 'INVALID_TOPIC') {
        errorMessage = 'The selected topic is not valid.';
        setErrors({ topic: errorMessage });
        return;
      } else if (error?.code === 'DUPLICATE_THREAD') {
        errorMessage = 'A thread with this title already exists.';
        setErrors({ title: errorMessage });
        return;
      } else if (error?.code === 'SESSION_EXPIRED') {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
      console.error('Failed to create thread:', error);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setTitle('');
    setSelectedCategory(defaultCategoryId || '');
    setSelectedTopic('');
    setContent('');
    setTagsInput('');
    setThumbnail('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 "
        onClick={handleClose}
      />
      <div className="relative w-full max-w-2xl hud-panel max-h-[90vh] overflow-y-auto">
        {/* Success overlay */}
        {showSuccess && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-forum-card/95  rounded">
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center  bg-emerald-500/15 border border-emerald-500/40 mx-auto mb-3">
                <Check size={24} className="text-white" />
              </div>
              <h3 className="text-[14px] font-mono font-bold text-forum-text mb-1">Thread Created!</h3>
              <p className="text-[11px] font-mono text-forum-muted">Redirecting to your thread...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-forum-border px-6 py-4">
          <div className="flex items-center gap-2">
            <PenSquare size={16} className="text-primary" />
            <h2 className="text-[14px] font-bold text-forum-text font-mono">Create New Thread</h2>
          </div>
          <button
            onClick={handleClose}
            className="transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-hover hover:text-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* General error message */}
          {errors.general && (
            <div className="rounded border border-red-500/50 bg-red-500/10 px-4 py-3">
              <p className="text-[11px] text-red-400 font-mono flex items-center gap-2">
                <AlertCircle size={14} /> {errors.general}
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[10px] font-mono font-bold text-forum-muted uppercase tracking-wider">
              Thread Title <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors({ ...errors, title: undefined });
              }}
              placeholder="Enter your thread title..."
              maxLength={THREAD_VALIDATION.TITLE_MAX_LENGTH}
              className={`transition-forum w-full rounded border bg-forum-bg px-4 py-2.5 text-[12px] font-mono text-forum-text placeholder-forum-muted outline-none focus:ring-1 ${errors.title
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                  : 'border-forum-border focus:border-primary focus:ring-primary'
                }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.title ? (
                <p className="text-[10px] text-red-400 font-mono flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.title}
                </p>
              ) : (
                <span />
              )}
              <span className={`text-[9px] font-mono ${
                title.length > THREAD_VALIDATION.TITLE_MAX_LENGTH * 0.9 
                  ? 'text-orange-700' 
                  : 'text-forum-muted/40'
              }`}>
                {title.length}/{THREAD_VALIDATION.TITLE_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-[10px] font-mono font-bold text-forum-muted uppercase tracking-wider">
              Category <span className="text-primary">*</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setErrors({ ...errors, category: undefined });
              }}
              className={`transition-forum w-full appearance-none rounded border bg-forum-bg px-4 py-2.5 pr-8 text-[12px] font-mono text-forum-text outline-none cursor-pointer focus:ring-1 ${errors.category
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                  : 'border-forum-border focus:border-primary focus:ring-primary'
                }`}
            >
              <option value="" className="bg-forum-card">Select a category...</option>
              {categories && categories.length > 0 ? (
                categories
                  .filter((cat) => {
                    // Show all categories for admin/moderator users
                    const isStaff = currentUser?.role === 'admin' || 
                                   currentUser?.role === 'super_moderator' || 
                                   currentUser?.role === 'moderator';
                    const shouldShow = isStaff || !cat.isImportant;
                    console.log(`[NewThreadModal] Category ${cat.name}: isImportant=${cat.isImportant}, isStaff=${isStaff}, shouldShow=${shouldShow}`);
                    return shouldShow;
                  })
                  .map((cat) => {
                    console.log(`[NewThreadModal] Rendering option for: ${cat.name}`);
                    return (
                      <option key={cat.id} value={cat.id} className="bg-forum-card">
                        {cat.name} {cat.isImportant ? '(Important)' : ''}
                      </option>
                    );
                  })
              ) : (
                <option value="" disabled className="bg-forum-card text-forum-muted">
                  Loading categories...
                </option>
              )}
            </select>
            {!categories || categories.length === 0 ? (
              <p className="mt-1 text-[10px] text-orange-700 font-mono flex items-center gap-1">
                <AlertCircle size={10} /> No categories available. Categories may still be loading.
              </p>
            ) : null}
            {errors.category && (
              <p className="mt-1 text-[10px] text-red-400 font-mono flex items-center gap-1">
                <AlertCircle size={10} /> {errors.category}
              </p>
            )}
          </div>

          {/* Topic (Subcategory) - Only show if selected category has topics */}
          {selectedCategory && categories.find(c => c.id === selectedCategory)?.topics && categories.find(c => c.id === selectedCategory)!.topics!.length > 0 ? (
            <div>
              <label className="mb-1.5 block text-[10px] font-mono font-bold text-forum-muted uppercase tracking-wider">
                Topic <span className="text-forum-muted/40 font-normal">(optional)</span>
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setErrors({ ...errors, topic: undefined });
                }}
                className={`transition-forum w-full appearance-none rounded border bg-forum-bg px-4 py-2.5 pr-8 text-[12px] font-mono text-forum-text outline-none cursor-pointer focus:ring-1 ${
                  errors.topic
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                    : 'border-forum-border focus:border-primary focus:ring-primary'
                }`}
              >
                <option value="" className="bg-forum-card">No specific topic</option>
                {categories
                  .find(c => c.id === selectedCategory)
                  ?.topics?.map((topic) => (
                    <option key={topic.id} value={topic.id} className="bg-forum-card">
                      {topic.name}
                    </option>
                  ))}
              </select>
              {errors.topic ? (
                <p className="mt-1 text-[10px] text-red-400 font-mono flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.topic}
                </p>
              ) : (
                <p className="mt-1 text-[9px] text-forum-muted/60 font-mono">
                  Select a topic to categorize your thread within {categories.find(c => c.id === selectedCategory)?.name}
                </p>
              )}
            </div>
          ) : selectedCategory ? (
            <div className="rounded border border-forum-border/50 bg-forum-hover/30 px-4 py-3">
              <p className="text-[10px] text-forum-muted/60 font-mono flex items-center gap-2">
                <AlertCircle size={12} className="text-forum-muted/40" />
                No topics available for this category. Your thread will be posted directly to the category.
              </p>
            </div>
          ) : null}

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-[10px] font-mono font-bold text-forum-muted uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={10} className="text-primary/60" />
              Tags <span className="text-forum-muted/40 font-normal">(optional, max {THREAD_VALIDATION.MAX_TAGS})</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => {
                setTagsInput(e.target.value);
                setErrors({ ...errors, tags: undefined });
              }}
              placeholder="e.g., discussion, question, news"
              className={`transition-forum w-full rounded border bg-forum-bg px-4 py-2.5 text-[12px] font-mono text-forum-text placeholder-forum-muted outline-none focus:ring-1 ${
                errors.tags
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                  : 'border-forum-border focus:border-primary focus:ring-primary'
              }`}
            />
            {errors.tags && (
              <p className="mt-1 text-[10px] text-red-400 font-mono flex items-center gap-1">
                <AlertCircle size={10} /> {errors.tags}
              </p>
            )}
            {tagsInput && !errors.tags && (
              <div className="flex items-center gap-1 flex-wrap mt-2">
                {tagsInput.split(',').map((tag, i) => {
                  const trimmed = tag.trim().toLowerCase().replace(/^#/, '');
                  if (!trimmed) return null;
                  return (
                    <span
                      key={i}
                      className=" border border-primary/20 bg-primary/[0.05] px-2 py-0.5 text-[9px] font-mono font-medium text-primary/80"
                    >
                      #{trimmed}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Thumbnail */}
          <div>
            <label className="mb-1.5 block text-[10px] font-mono font-bold text-forum-muted uppercase tracking-wider">
              Thread Thumbnail <span className="text-forum-muted/40 font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-3">
              {thumbnail && (
                <img
                  src={thumbnail}
                  alt="Thread thumbnail"
                  className="h-16 w-16  object-cover border border-forum-border"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="flex-1 text-[11px] font-mono text-forum-text file:mr-4 file:py-2 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-medium file:bg-forum-bg file:text-forum-text hover:file:bg-forum-hover file:cursor-pointer file:transition-forum"
              />
              {thumbnail && (
                <button
                  type="button"
                  onClick={() => setThumbnail('')}
                  className="px-3 py-2 text-[11px] font-mono text-forum-muted hover:text-primary transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            {errors.thumbnail && (
              <p className="mt-1 text-[10px] text-red-400 font-mono flex items-center gap-1">
                <AlertCircle size={10} /> {errors.thumbnail}
              </p>
            )}
            <p className="mt-1 text-[9px] text-forum-muted/60 font-mono">
              Upload a thumbnail for thread list preview (max 5MB)
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="mb-1.5 block text-[10px] font-mono font-bold text-forum-muted uppercase tracking-wider">
              Content <span className="text-primary">*</span>
            </label>
            <AdvancedEditor
              value={content}
              onChange={(newContent) => {
                // Enforce max length
                if (newContent.length <= THREAD_VALIDATION.CONTENT_MAX_LENGTH) {
                  setContent(newContent);
                  setErrors({ ...errors, content: undefined });
                }
              }}
              placeholder="Write your thread content here... (Rich text supported)"
              minHeight="220px"
            />
            <div className="flex items-center justify-between mt-1">
              {errors.content ? (
                <p className="text-[10px] text-red-400 font-mono flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.content}
                </p>
              ) : (
                <span className="text-[9px] text-forum-muted/60 font-mono">
                  Min {THREAD_VALIDATION.CONTENT_MIN_LENGTH} characters
                </span>
              )}
              <span className={`text-[9px] font-mono ${
                content.length > THREAD_VALIDATION.CONTENT_MAX_LENGTH * 0.9 
                  ? 'text-orange-700' 
                  : 'text-forum-muted/40'
              }`}>
                {content.length}/{THREAD_VALIDATION.CONTENT_MAX_LENGTH}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-forum-border px-6 py-4">
          <span className="text-[9px] font-mono text-forum-muted/40">
            <span className="text-primary">*</span> Required fields
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="transition-forum  border border-forum-border/50 bg-forum-card/50 px-4 py-2 text-[11px] font-mono font-bold text-forum-muted hover:bg-forum-hover hover:text-forum-text hover:border-primary/40 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="transition-forum  bg-primary to-forum-pink/90 px-5 py-2 text-[11px] font-mono font-bold text-white hover:shadow-[0_0_20px_rgba(255,45,146,0.4)] active:scale-95 border border-primary/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
