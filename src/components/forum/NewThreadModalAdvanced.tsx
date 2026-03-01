import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, PenSquare, Check, AlertCircle, Tag, Info, AlertTriangle,
  Lightbulb, Save, Clock, Zap
} from 'lucide-react';
import { useForumContext } from '@/context/ForumContext';
import ImageUploadButton from '@/components/forum/ImageUploadButton';
import { MARKDOWN_TOOLBAR_ACTIONS } from '@/lib/forumConstants';
import { 
  validateThreadCreation, 
  validateTags, 
  checkRateLimit,
  calculateSimilarity,
  THREAD_VALIDATION,
  type ThreadValidationError 
} from '@/lib/threadValidation';

interface NewThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
}

export default function NewThreadModalAdvanced({ isOpen, onClose, defaultCategoryId }: NewThreadModalProps) {
  const navigate = useNavigate();
  const { categories, createThread, getAllThreads } = useForumContext();
  
  // Form state
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategoryId || '');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  
  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<ThreadValidationError[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Advanced features
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [similarThreads, setSimilarThreads] = useState<any[]>([]);
  const [showSimilarThreads, setShowSimilarThreads] = useState(false);
  const [validationMode, setValidationMode] = useState<'live' | 'onBlur' | 'onSubmit'>('onBlur');

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
  
  // Auto-save to localStorage
  useEffect(() => {
    if (!autoSaveEnabled || !isOpen) return;
    
    const timer = setTimeout(() => {
      if (title || content || tagsInput) {
        const draft = { title, content, tagsInput, selectedCategory, selectedTopic, timestamp: Date.now() };
        localStorage.setItem('thread_draft', JSON.stringify(draft));
        setLastSaved(new Date());
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [title, content, tagsInput, selectedCategory, selectedTopic, autoSaveEnabled, isOpen]);
  
  // Load draft on mount
  useEffect(() => {
    if (isOpen) {
      const draft = localStorage.getItem('thread_draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          const age = Date.now() - parsed.timestamp;
          if (age < 24 * 60 * 60 * 1000) { // 24 hours
            setTitle(parsed.title || '');
            setContent(parsed.content || '');
            setTagsInput(parsed.tagsInput || '');
            if (!defaultCategoryId) setSelectedCategory(parsed.selectedCategory || '');
            setSelectedTopic(parsed.selectedTopic || '');
            setLastSaved(new Date(parsed.timestamp));
          }
        } catch (e) {
          console.error('Failed to load draft:', e);
        }
      }
    }
  }, [isOpen, defaultCategoryId]);
  
  // Real-time validation
  const validation = useMemo(() => {
    if (validationMode === 'onSubmit') return null;
    return validateThreadCreation(title, content, selectedCategory, tagsInput);
  }, [title, content, selectedCategory, tagsInput, validationMode]);
  
  // Update warnings and suggestions
  useEffect(() => {
    if (validation && validationMode !== 'onSubmit') {
      setWarnings(validation.warnings);
      setSuggestions(validation.suggestions);
    }
  }, [validation, validationMode]);
  
  // Find similar threads
  useEffect(() => {
    if (!title || title.length < 10) {
      setSimilarThreads([]);
      return;
    }
    
    const timer = setTimeout(() => {
      const allThreads = getAllThreads();
      const similar = allThreads
        .map(thread => ({
          ...thread,
          similarity: calculateSimilarity(title, thread.title)
        }))
        .filter(t => t.similarity > 0.6 && t.similarity < 1)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);
      
      setSimilarThreads(similar);
      setShowSimilarThreads(similar.length > 0);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [title, getAllThreads]);
  
  // Rate limit check
  const rateLimitCheck = useMemo(() => {
    const lastThreadTime = localStorage.getItem('last_thread_time');
    return checkRateLimit(lastThreadTime ? parseInt(lastThreadTime) : null);
  }, []);

  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});
    setWarnings([]);
    setSuggestions([]);

    // Rate limit check
    if (!rateLimitCheck.allowed) {
      setErrors({ general: rateLimitCheck.message || 'Please wait before creating another thread' });
      return;
    }

    // Comprehensive validation
    const validation = validateThreadCreation(title, content, selectedCategory, tagsInput);
    
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      setWarnings(validation.warnings);
      setSuggestions(validation.suggestions);
      return;
    }

    // Additional category validation
    const cat = categories.find((c) => c.id === selectedCategory);
    if (!cat) {
      setErrors({ category: 'Selected category no longer exists' });
      return;
    }
    
    if (cat.isImportant) {
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

      // Create the thread
      const newThread = await createThread(
        title.trim(), 
        selectedCategory, 
        content.trim(), 
        tagsValidation.tags,
        undefined,
        selectedTopic || undefined
      );

      // Update rate limit
      localStorage.setItem('last_thread_time', Date.now().toString());
      
      // Clear draft
      localStorage.removeItem('thread_draft');

      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccess(false);
        handleClose();
        navigate(`/thread/${newThread.id}`);
      }, 800);
    } catch (error: any) {
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
    setErrors({});
    setWarnings([]);
    setSuggestions([]);
    setShowSimilarThreads(false);
    onClose();
  };

  const insertMarkdown = (syntax: string) => {
    setContent((prev) => prev + syntax);
  };

  const clearDraft = () => {
    localStorage.removeItem('thread_draft');
    setLastSaved(null);
    setTitle('');
    setContent('');
    setTagsInput('');
  };

  if (!isOpen) return null;

  const titleValidation = validation?.errors.filter(e => e.field === 'title') || [];
  const contentValidation = validation?.errors.filter(e => e.field === 'content') || [];
  const tagsValidation = validation?.errors.filter(e => e.field === 'tags') || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-3xl hud-panel max-h-[95vh] overflow-y-auto">
        {/* Success overlay */}
        {showSuccess && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-forum-card/95 backdrop-blur-sm rounded">
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 mx-auto mb-4">
                <Check size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-[16px] font-mono font-bold text-forum-text mb-2">Thread Created!</h3>
              <p className="text-[12px] font-mono text-forum-muted">Redirecting to your thread...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-forum-border px-6 py-4 bg-forum-card-alt/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-forum-pink/10 border border-forum-pink/20">
              <PenSquare size={18} className="text-forum-pink" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-forum-text font-mono">Create New Thread</h2>
              <p className="text-[10px] text-forum-muted font-mono">Share your thoughts with the community</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastSaved && autoSaveEnabled && (
              <div className="flex items-center gap-1.5 text-[9px] text-forum-muted font-mono bg-forum-bg px-2 py-1 rounded border border-forum-border/50">
                <Save size={10} className="text-emerald-400" />
                <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
              </div>
            )}
            <button
              onClick={handleClose}
              className="transition-forum rounded p-2 text-forum-muted hover:bg-forum-hover hover:text-forum-pink"
            >
              <X size={18} />
            </button>
          </div>
        </div>
