import { useState } from 'react';
import { Plus, Zap, Check, X, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';
import { AdvancedEditor } from '@/components/forum/editor/AdvancedEditor';

interface CategoryWithTopics {
  id: string;
  name: string;
  description: string;
  icon: string;
  isSticky: boolean;
  isImportant: boolean;
  topics: Array<{
    id: string;
    name: string;
    description: string;
    threads: Array<{
      id: string;
      title: string;
      content: string;
      tags: string;
      isPinned: boolean;
    }>;
  }>;
}

interface Props {
  currentUserId: string;
  onRefresh: () => void;
  onLogAction: (action: string, targetType: string, targetId: string, details?: Record<string, any>) => Promise<void>;
}

const ICON_OPTIONS = ['MessageSquare', 'Code', 'Gamepad2', 'BookOpen', 'Music', 'Film', 'Image', 'Globe', 'Shield', 'Zap', 'Heart', 'Star', 'Award', 'Coffee', 'Bug', 'Terminal', 'Rocket', 'Lightbulb', 'Target', 'Briefcase'];

export default function AdminQuickSetupTab({ currentUserId, onRefresh, onLogAction }: Props) {
  const [categories, setCategories] = useState<CategoryWithTopics[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addCategory = () => {
    setCategories([...categories, {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      icon: 'MessageSquare',
      isSticky: false,
      isImportant: false,
      topics: [],
    }]);
  };

  const removeCategory = (categoryId: string) => {
    setCategories(categories.filter(c => c.id !== categoryId));
  };

  const updateCategory = (categoryId: string, field: keyof CategoryWithTopics, value: any) => {
    setCategories(categories.map(c => c.id === categoryId ? { ...c, [field]: value } : c));
  };

  const addTopic = (categoryId: string) => {
    setCategories(categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          topics: [...c.topics, {
            id: `temp-topic-${Date.now()}`,
            name: '',
            description: '',
            threads: [],
          }],
        };
      }
      return c;
    }));
  };

  const removeTopic = (categoryId: string, topicId: string) => {
    setCategories(categories.map(c => {
      if (c.id === categoryId) {
        return { ...c, topics: c.topics.filter(t => t.id !== topicId) };
      }
      return c;
    }));
  };

  const updateTopic = (categoryId: string, topicId: string, field: string, value: any) => {
    setCategories(categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          topics: c.topics.map(t => t.id === topicId ? { ...t, [field]: value } : t),
        };
      }
      return c;
    }));
  };

  const addThread = (categoryId: string, topicId: string) => {
    setCategories(categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          topics: c.topics.map(t => {
            if (t.id === topicId) {
              return {
                ...t,
                threads: [...t.threads, {
                  id: `temp-thread-${Date.now()}`,
                  title: '',
                  content: '',
                  tags: '',
                  isPinned: false,
                }],
              };
            }
            return t;
          }),
        };
      }
      return c;
    }));
  };

  const removeThread = (categoryId: string, topicId: string, threadId: string) => {
    setCategories(categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          topics: c.topics.map(t => {
            if (t.id === topicId) {
              return { ...t, threads: t.threads.filter(th => th.id !== threadId) };
            }
            return t;
          }),
        };
      }
      return c;
    }));
  };

  const updateThread = (categoryId: string, topicId: string, threadId: string, field: string, value: any) => {
    setCategories(categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          topics: c.topics.map(t => {
            if (t.id === topicId) {
              return {
                ...t,
                threads: t.threads.map(th => th.id === threadId ? { ...th, [field]: value } : th),
              };
            }
            return t;
          }),
        };
      }
      return c;
    }));
  };

  const handleCreateAll = async () => {
    if (categories.length === 0) {
      toast.error('Add at least one category');
      return;
    }

    // Validate
    for (const cat of categories) {
      if (!cat.name.trim()) {
        toast.error('All categories must have a name');
        return;
      }
      if (cat.topics.length === 0) {
        toast.error(`Category "${cat.name}" must have at least one topic (subcategory)`);
        return;
      }
      for (const topic of cat.topics) {
        if (!topic.name.trim()) {
          toast.error(`All topics in "${cat.name}" must have a name`);
          return;
        }
        for (const thread of topic.threads) {
          if (!thread.title.trim() || !thread.content.trim()) {
            toast.error(`All threads in "${topic.name}" must have title and content`);
            return;
          }
        }
      }
    }

    setIsSubmitting(true);
    try {
      let totalCategories = 0;
      let totalTopics = 0;
      let totalThreads = 0;
      
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        
        // Create category
        const categoryId = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { error: catError } = await supabase.from('categories').insert({
          id: categoryId,
          name: cat.name.trim(),
          description: cat.description.trim(),
          icon: cat.icon,
          is_sticky: cat.isSticky,
          is_important: cat.isImportant,
          sort_order: i,
        });

        if (catError) {
          console.error('Category creation error:', catError);
          throw new Error(`Failed to create category "${cat.name}": ${catError.message}`);
        }

        await onLogAction('category_create', 'category', categoryId, { name: cat.name });
        totalCategories++;

        // Create topics (subcategories) for this category
        for (const topic of cat.topics) {
          const topicId = `topic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          
          const { error: topicError } = await supabase.from('topics').insert({
            id: topicId,
            category_id: categoryId,
            name: topic.name.trim(),
            description: topic.description.trim(),
          });

          if (topicError) {
            console.error('Topic creation error:', topicError);
            throw new Error(`Failed to create topic "${topic.name}": ${topicError.message}`);
          }

          await onLogAction('topic_create', 'topic', topicId, { name: topic.name, category: cat.name });
          totalTopics++;

          // Create threads for this topic
          for (const thread of topic.threads) {
            const threadId = `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            
            // Create thread
            const { error: threadError } = await supabase.from('threads').insert({
              id: threadId,
              title: thread.title.trim(),
              excerpt: thread.content.slice(0, 200),
              author_id: currentUserId,
              category_id: categoryId,
              topic_id: topicId,
              is_pinned: thread.isPinned,
              tags: thread.tags ? thread.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            });

            if (threadError) {
              console.error('Thread creation error:', threadError);
              throw new Error(`Failed to create thread "${thread.title}": ${threadError.message}`);
            }

            // Create first post
            const { error: postError } = await supabase.from('posts').insert({
              thread_id: threadId,
              content: thread.content.trim(),
              author_id: currentUserId,
            });

            if (postError) {
              console.error('Post creation error:', postError);
              throw new Error(`Failed to create post for "${thread.title}": ${postError.message}`);
            }

            await onLogAction('thread_create', 'thread', threadId, { title: thread.title, topic: topic.name, category: cat.name });
            totalThreads++;
          }
        }
      }

      toast.success(`Successfully created ${totalCategories} categories, ${totalTopics} topics, and ${totalThreads} threads!`);
      setCategories([]);
      onRefresh();
    } catch (error: any) {
      console.error('Creation failed:', error);
      toast.error(error.message || 'Failed to create forum structure');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadTemplate = (template: 'forum' | 'support' | 'community') => {
    if (template === 'forum') {
      setCategories([
        {
          id: 'temp-1',
          name: 'General',
          description: 'General discussions and community',
          icon: 'MessageSquare',
          isSticky: true,
          isImportant: false,
          topics: [
            {
              id: 'temp-topic-1',
              name: 'Announcements',
              description: 'Official announcements and updates',
              threads: [
                {
                  id: 'temp-thread-1',
                  title: 'Welcome to the Forum!',
                  content: 'Welcome everyone! This is a place for general discussions. Feel free to introduce yourself and start conversations.',
                  tags: 'welcome, introduction',
                  isPinned: true,
                },
                {
                  id: 'temp-thread-2',
                  title: 'Forum Rules and Guidelines',
                  content: 'Please read and follow these rules:\n\n1. Be respectful to all members\n2. No spam or self-promotion\n3. Stay on topic\n4. Use appropriate language\n\nViolations may result in warnings or bans.',
                  tags: 'rules, guidelines, important',
                  isPinned: true,
                },
              ],
            },
            {
              id: 'temp-topic-2',
              name: 'General Discussion',
              description: 'Talk about anything',
              threads: [
                {
                  id: 'temp-thread-3',
                  title: 'Introduce Yourself',
                  content: 'New member? Say hello and tell us about yourself!',
                  tags: 'introductions',
                  isPinned: true,
                },
              ],
            },
          ],
        },
        {
          id: 'temp-2',
          name: 'Support',
          description: 'Get help and support',
          icon: 'Lightbulb',
          isSticky: false,
          isImportant: false,
          topics: [
            {
              id: 'temp-topic-3',
              name: 'Help & Support',
              description: 'Ask questions and get help',
              threads: [
                {
                  id: 'temp-thread-4',
                  title: 'How to Get Started',
                  content: 'New to the forum? Here\'s a quick guide on how to get started.',
                  tags: 'help, guide',
                  isPinned: true,
                },
              ],
            },
          ],
        },
      ]);
    } else if (template === 'support') {
      setCategories([
        {
          id: 'temp-1',
          name: 'Technical',
          description: 'Technical support and troubleshooting',
          icon: 'Bug',
          isSticky: true,
          isImportant: false,
          topics: [
            {
              id: 'temp-topic-1',
              name: 'Bug Reports',
              description: 'Report bugs and issues',
              threads: [
                {
                  id: 'temp-thread-1',
                  title: 'How to Report a Bug',
                  content: 'When reporting bugs, please include:\n\n1. Description\n2. Steps to reproduce\n3. Expected vs actual behavior\n4. Screenshots\n5. System info',
                  tags: 'bug-report, guide',
                  isPinned: true,
                },
              ],
            },
            {
              id: 'temp-topic-2',
              name: 'Feature Requests',
              description: 'Suggest new features',
              threads: [
                {
                  id: 'temp-thread-2',
                  title: 'Feature Request Guidelines',
                  content: 'Have an idea? Share it here! Please search for existing requests first.',
                  tags: 'feature-request, guidelines',
                  isPinned: true,
                },
              ],
            },
          ],
        },
      ]);
    } else if (template === 'community') {
      setCategories([
        {
          id: 'temp-1',
          name: 'Community',
          description: 'Community discussions',
          icon: 'Users',
          isSticky: true,
          isImportant: false,
          topics: [
            {
              id: 'temp-topic-1',
              name: 'Introductions',
              description: 'Introduce yourself',
              threads: [
                {
                  id: 'temp-thread-1',
                  title: 'Welcome! Introduce Yourself',
                  content: 'New member? Say hello! Tell us about yourself.',
                  tags: 'welcome, introductions',
                  isPinned: true,
                },
              ],
            },
            {
              id: 'temp-topic-2',
              name: 'Showcase',
              description: 'Share your work',
              threads: [
                {
                  id: 'temp-thread-2',
                  title: 'Share Your Work!',
                  content: 'Showcase what you\'ve been working on!',
                  tags: 'showcase, projects',
                  isPinned: true,
                },
              ],
            },
          ],
        },
      ]);
    }
    toast.success(`${template.charAt(0).toUpperCase() + template.slice(1)} template loaded`);
  };

  const getTotalCounts = () => {
    const totalTopics = categories.reduce((sum, c) => sum + c.topics.length, 0);
    const totalThreads = categories.reduce((sum, c) => 
      sum + c.topics.reduce((tSum, t) => tSum + t.threads.length, 0), 0
    );
    return { totalTopics, totalThreads };
  };

  const { totalTopics, totalThreads } = getTotalCounts();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="hud-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-mono font-bold text-forum-text flex items-center gap-2">
              <Zap size={14} className="text-primary" /> Quick Setup
            </h2>
            <p className="text-[10px] font-mono text-forum-muted mt-1">
              Create categories → topics (subcategories) → threads → posts
            </p>
          </div>
        </div>

        {/* Templates */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-[10px] font-mono text-forum-muted">Quick Templates:</span>
          <button onClick={() => loadTemplate('forum')} className="text-[9px] font-mono text-black hover:underline">General Forum</button>
          <button onClick={() => loadTemplate('support')} className="text-[9px] font-mono text-black hover:underline">Support Center</button>
          <button onClick={() => loadTemplate('community')} className="text-[9px] font-mono text-black hover:underline">Community Hub</button>
        </div>

        <button onClick={addCategory} className="transition-forum flex items-center gap-1.5  bg-primary px-4 py-2 text-[10px] font-mono font-bold text-black hover:bg-primary/90">
          <Plus size={12} /> Add Category
        </button>
      </div>

      {/* Categories */}
      {categories.map((category, catIndex) => (
        <div key={category.id} className="hud-panel p-6 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-[12px] font-mono font-bold text-forum-text">Category #{catIndex + 1}</h3>
            <button onClick={() => removeCategory(category.id)} className="text-red-400 hover:text-red-300">
              <Trash2 size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">Category Name *</label>
              <input
                value={category.name}
                onChange={e => updateCategory(category.id, 'name', e.target.value)}
                placeholder="e.g., General"
                className="mt-1 w-full  border border-forum-border bg-forum-bg px-3 py-1.5 text-[11px] font-mono text-forum-text outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">Icon</label>
              <select
                value={category.icon}
                onChange={e => updateCategory(category.id, 'icon', e.target.value)}
                className="mt-1 w-full  border border-forum-border bg-forum-bg px-3 py-1.5 text-[11px] font-mono text-forum-text outline-none focus:border-primary"
              >
                {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">Description</label>
            <textarea
              value={category.description}
              onChange={e => updateCategory(category.id, 'description', e.target.value)}
              placeholder="Brief description of this category"
              className="mt-1 w-full  border border-forum-border bg-forum-bg px-3 py-1.5 text-[11px] font-mono text-forum-text outline-none focus:border-primary resize-none h-16"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted cursor-pointer">
              <input
                type="checkbox"
                checked={category.isSticky}
                onChange={e => updateCategory(category.id, 'isSticky', e.target.checked)}
                className="rounded"
              />
              Sticky
            </label>
            <label className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted cursor-pointer">
              <input
                type="checkbox"
                checked={category.isImportant}
                onChange={e => updateCategory(category.id, 'isImportant', e.target.checked)}
                className="rounded"
              />
              Important
            </label>
          </div>

          {/* Topics (Subcategories) */}
          <div className="border-t border-forum-border pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-mono font-bold text-forum-text">Topics (Subcategories)</h4>
              <button
                onClick={() => addTopic(category.id)}
                className="transition-forum flex items-center gap-1  border border-forum-border px-2 py-1 text-[9px] font-mono text-forum-muted hover:text-primary hover:border-primary"
              >
                <Plus size={10} /> Add Topic
              </button>
            </div>

            {category.topics.map((topic, topicIndex) => (
              <div key={topic.id} className="bg-forum-hover/30  p-3 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono text-forum-muted">Topic #{topicIndex + 1}</span>
                  <button onClick={() => removeTopic(category.id, topic.id)} className="text-red-400 hover:text-red-300">
                    <X size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    value={topic.name}
                    onChange={e => updateTopic(category.id, topic.id, 'name', e.target.value)}
                    placeholder="Topic name *"
                    className="w-full  border border-forum-border bg-forum-bg px-3 py-1.5 text-[10px] font-mono text-forum-text outline-none focus:border-primary"
                  />
                  <input
                    value={topic.description}
                    onChange={e => updateTopic(category.id, topic.id, 'description', e.target.value)}
                    placeholder="Topic description"
                    className="w-full  border border-forum-border bg-forum-bg px-3 py-1.5 text-[10px] font-mono text-forum-text outline-none focus:border-primary"
                  />
                </div>

                {/* Threads */}
                <div className="border-t border-forum-border/50 pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-forum-muted uppercase">Threads</span>
                    <button
                      onClick={() => addThread(category.id, topic.id)}
                      className="text-[8px] font-mono text-primary hover:underline"
                    >
                      + Add Thread
                    </button>
                  </div>

                  {topic.threads.map((thread, threadIndex) => (
                    <div key={thread.id} className="bg-forum-bg/50 rounded p-2 space-y-2">
                      <div className="flex items-start justify-between">
                        <span className="text-[8px] font-mono text-forum-muted">Thread #{threadIndex + 1}</span>
                        <button onClick={() => removeThread(category.id, topic.id, thread.id)} className="text-red-400 hover:text-red-300">
                          <X size={10} />
                        </button>
                      </div>

                      <input
                        value={thread.title}
                        onChange={e => updateThread(category.id, topic.id, thread.id, 'title', e.target.value)}
                        placeholder="Thread title *"
                        className="w-full rounded border border-forum-border bg-forum-bg px-2 py-1 text-[9px] font-mono text-forum-text outline-none focus:border-primary"
                      />

                      <div className="min-h-[120px]">
                        <AdvancedEditor
                          value={thread.content}
                          onChange={(newContent) => updateThread(category.id, topic.id, thread.id, 'content', newContent)}
                          placeholder="Thread content *"
                          minHeight="120px"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          value={thread.tags}
                          onChange={e => updateThread(category.id, topic.id, thread.id, 'tags', e.target.value)}
                          placeholder="Tags"
                          className="flex-1 rounded border border-forum-border bg-forum-bg px-2 py-1 text-[8px] font-mono text-forum-text outline-none focus:border-primary"
                        />
                        <label className="flex items-center gap-1 text-[8px] font-mono text-forum-muted cursor-pointer whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={thread.isPinned}
                            onChange={e => updateThread(category.id, topic.id, thread.id, 'isPinned', e.target.checked)}
                            className="rounded"
                          />
                          Pin
                        </label>
                      </div>
                    </div>
                  ))}

                  {topic.threads.length === 0 && (
                    <p className="text-[8px] font-mono text-forum-muted text-center py-2">
                      No threads yet
                    </p>
                  )}
                </div>
              </div>
            ))}

            {category.topics.length === 0 && (
              <p className="text-[9px] font-mono text-forum-muted text-center py-4">
                No topics yet. Click "Add Topic" to create one.
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Create Button */}
      {categories.length > 0 && (
        <div className="hud-panel p-6">
          <button
            onClick={handleCreateAll}
            disabled={isSubmitting}
            className="transition-forum w-full flex items-center justify-center gap-2  bg-primary px-6 py-3 text-[12px] font-mono font-bold text-black hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>Creating...</>
            ) : (
              <>
                <Check size={14} />
                Create {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}, {totalTopics} {totalTopics === 1 ? 'Topic' : 'Topics'}, {totalThreads} {totalThreads === 1 ? 'Thread' : 'Threads'}
              </>
            )}
          </button>
        </div>
      )}

      {categories.length === 0 && (
        <div className="hud-panel p-12 text-center">
          <Zap size={40} className="text-forum-muted/20 mx-auto mb-3" />
          <p className="text-[11px] font-mono text-forum-muted">
            No categories added yet. Click "Add Category" or load a template to get started.
          </p>
          <p className="text-[9px] font-mono text-forum-muted/60 mt-2">
            Hierarchy: Category → Topic (Subcategory) → Thread → Post
          </p>
        </div>
      )}
    </div>
  );
}
