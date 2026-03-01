import { useState, useEffect, useCallback } from 'react';
import { Thread, Category, ForumStats, User, ReputationEvent, ReputationActionType, REPUTATION_POINTS } from '@/types/forum';
import { PostData } from '@/types/forum';
import { supabase, ForumError, handleSupabaseError, withRetry } from '@/lib/supabase';
import { fetchCategories, fetchForumStats } from '@/lib/forumDataFetchersOptimized';

interface UseCategoriesParams {
    currentUser: User;
    isAuthenticated: boolean;
    authUserId: string | undefined;
    pageSize: number;
    setError: (key: string, error: ForumError, operation: string) => void;
    clearError: (key: string) => void;
    setReputationEvents: React.Dispatch<React.SetStateAction<Record<string, ReputationEvent[]>>>;
}

export function useCategories({
    currentUser,
    isAuthenticated,
    authUserId,
    pageSize,
    setError,
    clearError,
    setReputationEvents,
}: UseCategoriesParams) {
    const [categoriesState, setCategoriesState] = useState<Category[]>([]);
    const [statsState, setStatsState] = useState<ForumStats>({
        totalThreads: 0, totalPosts: 0, totalUsers: 0,
        activeUsers: 0, newPostsToday: 0, newestMember: '', onlineUsers: 0,
    });
    const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
    const [loadingStats, setLoadingStats] = useState<boolean>(true);
    const [threadPages, setThreadPages] = useState<Record<string, number>>({});
    const [hasMoreThreadsMap, setHasMoreThreadsMap] = useState<Record<string, boolean>>({});

    // Fetch categories on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingCategories(true);
            clearError('categories');
            try {
                const categories = await withRetry(() => fetchCategories(authUserId, 0, pageSize));
                if (!cancelled) {
                    setCategoriesState(categories);
                    const initialThreadPages: Record<string, number> = {};
                    const initialHasMoreThreads: Record<string, boolean> = {};
                    categories.forEach(cat => {
                        initialThreadPages[cat.id] = 0;
                        initialHasMoreThreads[cat.id] = cat.threads.length === pageSize;
                    });
                    setThreadPages(initialThreadPages);
                    setHasMoreThreadsMap(initialHasMoreThreads);
                }
            } catch (err) {
                if (!cancelled) {
                    const forumError = handleSupabaseError(err, 'fetchCategories');
                    setError('categories', forumError, 'Fetch categories');
                }
            } finally {
                if (!cancelled) setLoadingCategories(false);
            }
        })();
        return () => { cancelled = true; };
    }, [authUserId, pageSize, clearError, setError]);

    // Fetch forum stats on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingStats(true);
            clearError('stats');
            try {
                const stats = await withRetry(() => fetchForumStats());
                if (!cancelled) setStatsState(stats);
            } catch (err) {
                if (!cancelled) {
                    const forumError = handleSupabaseError(err, 'fetchForumStats');
                    setError('stats', forumError, 'Fetch forum stats');
                }
            } finally {
                if (!cancelled) setLoadingStats(false);
            }
        })();
        return () => { cancelled = true; };
    }, [clearError, setError]);

    const getAllThreads = useCallback(() => categoriesState.flatMap((cat) => cat.threads), [categoriesState]);

    const getThread = useCallback((threadId: string): Thread | null => {
        for (const cat of categoriesState) {
            const found = cat.threads.find((t) => t.id === threadId);
            if (found) return found;
        }
        return null;
    }, [categoriesState]);

    const getCategory = useCallback((categoryId: string): Category | null => {
        return categoriesState.find((c) => c.id === categoryId) || null;
    }, [categoriesState]);

    const getCategoryForThread = useCallback((threadId: string): Category | null => {
        for (const cat of categoriesState) {
            if (cat.threads.some((t) => t.id === threadId)) return cat;
        }
        return null;
    }, [categoriesState]);

    const loadMoreThreads = useCallback(async (categoryId: string): Promise<void> => {
        const currentPage = threadPages[categoryId] || 0;
        const nextPage = currentPage + 1;
        try {
            const from = nextPage * pageSize;
            const to = from + pageSize - 1;
            const { data: threads, error } = await supabase
                .from('threads')
                .select(`*, author:forum_users!threads_author_id_fkey(*), last_reply_by:forum_users!threads_last_reply_by_id_fkey(*)`)
                .eq('category_id', categoryId)
                .order('is_pinned', { ascending: false })
                .order('last_reply_at', { ascending: false })
                .range(from, to);
            if (error) throw error;
            if (!threads || threads.length === 0) {
                setHasMoreThreadsMap(prev => ({ ...prev, [categoryId]: false }));
                return;
            }
            const newThreads: Thread[] = threads.map(t => {
                const tAuthor = Array.isArray(t.author) ? t.author[0] : t.author;
                const tLast = t.last_reply_by ? (Array.isArray(t.last_reply_by) ? t.last_reply_by[0] : t.last_reply_by) : null;
                return {
                    id: t.id, title: t.title, excerpt: t.excerpt,
                    author: { id: tAuthor.id, username: tAuthor.username, avatar: tAuthor.avatar, banner: tAuthor.banner || undefined, postCount: tAuthor.post_count, reputation: tAuthor.reputation, joinDate: tAuthor.join_date, isOnline: tAuthor.is_online, rank: tAuthor.rank || 'Newcomer', role: tAuthor.role || 'member' },
                    categoryId: t.category_id, createdAt: t.created_at, lastReplyAt: t.last_reply_at,
                    lastReplyBy: tLast ? { id: tLast.id, username: tLast.username, avatar: tLast.avatar, banner: tLast.banner || undefined, postCount: tLast.post_count, reputation: tLast.reputation, joinDate: tLast.join_date, isOnline: tLast.is_online, rank: tLast.rank || 'Newcomer', role: tLast.role || 'member' } : undefined as any,
                    replyCount: t.reply_count, viewCount: t.view_count, isPinned: t.is_pinned, isLocked: t.is_locked, isHot: t.is_hot, hasUnread: false, tags: t.tags || [], upvotes: t.upvotes, downvotes: t.downvotes,
                };
            });
            setCategoriesState(prev => prev.map(cat => cat.id === categoryId ? { ...cat, threads: [...cat.threads, ...newThreads] } : cat));
            setThreadPages(prev => ({ ...prev, [categoryId]: nextPage }));
            setHasMoreThreadsMap(prev => ({ ...prev, [categoryId]: threads.length === pageSize }));
            clearError(`threads-${categoryId}`);
        } catch (err) {
            const forumError = handleSupabaseError(err, 'loadMoreThreads');
            setError(`threads-${categoryId}`, forumError, 'Load more threads');
            throw forumError;
        }
    }, [threadPages, pageSize, clearError, setError]);

    const hasMoreThreads = useCallback((categoryId: string): boolean => {
        return hasMoreThreadsMap[categoryId] !== false;
    }, [hasMoreThreadsMap]);

    const createThread = useCallback(async (
        title: string, categoryId: string, content: string,
        tags?: string[],
        poll?: { question: string; options: string[]; isMultipleChoice: boolean; endsAt?: string },
        setPollsMap?: React.Dispatch<React.SetStateAction<Record<string, any>>>,
        topicId?: string,
    ): Promise<Thread> => {
        // Validate authentication
        if (!isAuthenticated || !currentUser?.id || !currentUser?.username) {
            throw new ForumError('User not authenticated', 'AUTH_REQUIRED', 'You must be logged in to create threads.', false);
        }

        // Validate category exists and is not archived
        const category = categoriesState.find(cat => cat.id === categoryId);
        if (!category) {
            throw new ForumError('Invalid category', 'INVALID_CATEGORY', 'The selected category does not exist.', false);
        }

        // Validate topic if provided
        if (topicId) {
            const topicExists = category.topics?.some(topic => topic.id === topicId);
            if (!topicExists) {
                throw new ForumError('Invalid topic', 'INVALID_TOPIC', 'The selected topic does not belong to this category.', false);
            }
        }

        // Sanitize and validate inputs
        const sanitizedTitle = title.trim();
        const sanitizedContent = content.trim();
        const sanitizedTags = (tags || []).filter(tag => tag && tag.trim().length > 0).slice(0, 10);

        // Generate safe excerpt
        const excerpt = sanitizedContent.slice(0, 120) + (sanitizedContent.length > 120 ? '...' : '');

        const threadId = crypto.randomUUID();
        const now = new Date().toISOString();
        
        // Create optimistic thread (but don't add to state yet to avoid race conditions)
        const optimisticThread: Thread = {
            id: threadId, 
            title: sanitizedTitle,
            excerpt,
            author: currentUser, 
            categoryId, 
            topicId, 
            createdAt: now, 
            lastReplyAt: now,
            lastReplyBy: currentUser, 
            replyCount: 0, 
            viewCount: 0,
            isPinned: false, 
            isLocked: false, 
            isHot: false, 
            hasUnread: false,
            tags: sanitizedTags, 
            upvotes: 0, 
            downvotes: 0,
            banner: undefined,
        };

        // Track if we need to rollback stats
        let statsUpdated = false;

        try {
            // 1. Create thread in database first
            const { data: createdThread, error: threadError } = await supabase
                .from('threads')
                .insert({
                    id: threadId, 
                    title: sanitizedTitle, 
                    excerpt,
                    author_id: currentUser.id, 
                    category_id: categoryId, 
                    topic_id: topicId || null, 
                    tags: sanitizedTags,
                    created_at: now, 
                    last_reply_at: now, 
                    last_reply_by_id: currentUser.id,
                    banner: null,
                })
                .select()
                .single();
            
            if (threadError) {
                console.error('Thread creation error:', threadError);
                throw threadError;
            }

            // 2. Create the first post
            const { error: postError } = await supabase
                .from('posts')
                .insert({
                    thread_id: threadId, 
                    content: sanitizedContent, 
                    author_id: currentUser.id, 
                    created_at: now,
                });
            
            if (postError) {
                // Rollback: Delete the thread
                await supabase.from('threads').delete().eq('id', threadId);
                console.error('Post creation error:', postError);
                throw postError;
            }

            // 3. Create poll if provided
            if (poll && poll.options.length >= 2 && setPollsMap) {
                const pollId = crypto.randomUUID();
                const { error: pollError } = await supabase
                    .from('polls')
                    .insert({
                        id: pollId, 
                        thread_id: threadId, 
                        question: poll.question,
                        is_multiple_choice: poll.isMultipleChoice, 
                        ends_at: poll.endsAt || null,
                        total_votes: 0, 
                        created_at: now,
                    });
                
                if (pollError) {
                    console.error('Poll creation error (non-critical):', pollError);
                    // Don't rollback thread for poll errors
                } else {
                    const pollOptionsData = poll.options.map((optionText, index) => ({
                        id: crypto.randomUUID(), 
                        poll_id: pollId, 
                        text: optionText, 
                        vote_count: 0, 
                        position: index,
                    }));
                    
                    const { error: pollOptionsError } = await supabase
                        .from('poll_options')
                        .insert(pollOptionsData);
                    
                    if (!pollOptionsError) {
                        setPollsMap((prev: any) => ({
                            ...prev,
                            [threadId]: {
                                question: poll.question,
                                options: pollOptionsData.map(opt => ({ id: opt.id, text: opt.text, votes: 0 })),
                                totalVotes: 0, 
                                endsAt: poll.endsAt || '', 
                                isMultipleChoice: poll.isMultipleChoice,
                                hasVoted: false, 
                                votedOptionIds: [],
                            },
                        }));
                    }
                }
            }

            // 4. Award reputation (non-critical, don't rollback on failure)
            try {
                const { error: reputationError } = await supabase
                    .from('reputation_events')
                    .insert({
                        id: crypto.randomUUID(), 
                        user_id: currentUser.id, 
                        action: 'thread_created',
                        points: REPUTATION_POINTS.thread_created, 
                        description: `Created thread "${sanitizedTitle}"`,
                        thread_id: threadId, 
                        thread_title: sanitizedTitle, 
                        created_at: now,
                    });
                
                if (!reputationError) {
                    setReputationEvents(prev => ({
                        ...prev,
                        [currentUser.id]: [{
                            id: crypto.randomUUID(), 
                            userId: currentUser.id, 
                            action: 'thread_created' as ReputationActionType,
                            points: REPUTATION_POINTS.thread_created, 
                            description: `Created thread "${sanitizedTitle}"`,
                            threadId, 
                            threadTitle: sanitizedTitle, 
                            createdAt: now,
                        }, ...(prev[currentUser.id] || [])],
                    }));
                }
            } catch (repError) {
                console.error('Reputation error (non-critical):', repError);
            }

            // 5. Update local state only after successful DB operations
            setCategoriesState((prev) =>
                prev.map((cat) => cat.id === categoryId ? {
                    ...cat, 
                    threads: [optimisticThread, ...cat.threads],
                    threadCount: cat.threadCount + 1, 
                    postCount: cat.postCount + 1, 
                    lastActivity: now,
                } : cat)
            );

            // 6. Update stats
            setStatsState((prev) => ({
                ...prev, 
                totalThreads: prev.totalThreads + 1, 
                totalPosts: prev.totalPosts + 1,
                newPostsToday: prev.newPostsToday + 1,
            }));
            statsUpdated = true;

            return optimisticThread;
        } catch (error: any) {
            // Rollback stats if they were updated
            if (statsUpdated) {
                setStatsState((prev) => ({
                    ...prev, 
                    totalThreads: Math.max(0, prev.totalThreads - 1), 
                    totalPosts: Math.max(0, prev.totalPosts - 1),
                    newPostsToday: Math.max(0, prev.newPostsToday - 1),
                }));
            }

            // Enhanced error handling
            let forumError: ForumError;
            
            if (error?.code === '23505') {
                forumError = new ForumError(
                    'Duplicate thread',
                    'DUPLICATE_THREAD',
                    'A thread with this title already exists. Please use a different title.',
                    false
                );
            } else if (error?.code === '23503') {
                forumError = new ForumError(
                    'Invalid reference',
                    'INVALID_REFERENCE',
                    'The category or topic you selected is no longer available.',
                    false
                );
            } else if (error?.message?.includes('JWT')) {
                forumError = new ForumError(
                    'Session expired',
                    'SESSION_EXPIRED',
                    'Your session has expired. Please log in again.',
                    false
                );
            } else {
                forumError = handleSupabaseError(error, 'createThread');
            }
            
            setError('createThread', forumError, 'Create thread');
            throw forumError;
        }
    }, [currentUser, isAuthenticated, categoriesState, setError, setReputationEvents]);

    return {
        categoriesState,
        setCategoriesState,
        statsState,
        setStatsState,
        loadingCategories,
        loadingStats,
        getAllThreads,
        getThread,
        getCategory,
        getCategoryForThread,
        loadMoreThreads,
        hasMoreThreads,
        createThread,
    };
}
