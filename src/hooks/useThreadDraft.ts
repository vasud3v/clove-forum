import { useState, useEffect, useCallback } from 'react';

interface ThreadDraft {
  title: string;
  content: string;
  tagsInput: string;
  selectedCategory: string;
  selectedTopic: string;
  timestamp: number;
}

export function useThreadDraft(isOpen: boolean, defaultCategoryId?: string) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategoryId || '');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Load draft on mount
  useEffect(() => {
    if (isOpen) {
      const draft = localStorage.getItem('thread_draft');
      if (draft) {
        try {
          const parsed: ThreadDraft = JSON.parse(draft);
          const age = Date.now() - parsed.timestamp;
          
          // Only load drafts less than 24 hours old
          if (age < 24 * 60 * 60 * 1000) {
            setTitle(parsed.title || '');
            setContent(parsed.content || '');
            setTagsInput(parsed.tagsInput || '');
            if (!defaultCategoryId) setSelectedCategory(parsed.selectedCategory || '');
            setSelectedTopic(parsed.selectedTopic || '');
            setLastSaved(new Date(parsed.timestamp));
          } else {
            // Clear old draft
            localStorage.removeItem('thread_draft');
          }
        } catch (e) {
          console.error('Failed to load draft:', e);
          localStorage.removeItem('thread_draft');
        }
      }
    }
  }, [isOpen, defaultCategoryId]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!autoSaveEnabled || !isOpen) return;
    
    const timer = setTimeout(() => {
      if (title || content || tagsInput) {
        const draft: ThreadDraft = {
          title,
          content,
          tagsInput,
          selectedCategory,
          selectedTopic,
          timestamp: Date.now()
        };
        localStorage.setItem('thread_draft', JSON.stringify(draft));
        setLastSaved(new Date());
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
    
    return () => clearTimeout(timer);
  }, [title, content, tagsInput, selectedCategory, selectedTopic, autoSaveEnabled, isOpen]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem('thread_draft');
    setLastSaved(null);
    setTitle('');
    setContent('');
    setTagsInput('');
    setSelectedCategory(defaultCategoryId || '');
    setSelectedTopic('');
  }, [defaultCategoryId]);

  const saveDraft = useCallback(() => {
    const draft: ThreadDraft = {
      title,
      content,
      tagsInput,
      selectedCategory,
      selectedTopic,
      timestamp: Date.now()
    };
    localStorage.setItem('thread_draft', JSON.stringify(draft));
    setLastSaved(new Date());
  }, [title, content, tagsInput, selectedCategory, selectedTopic]);

  return {
    title,
    setTitle,
    content,
    setContent,
    tagsInput,
    setTagsInput,
    selectedCategory,
    setSelectedCategory,
    selectedTopic,
    setSelectedTopic,
    lastSaved,
    autoSaveEnabled,
    setAutoSaveEnabled,
    clearDraft,
    saveDraft
  };
}
