import { useState, useCallback, useRef } from 'react';
import { User, Category, ForumStats, Reaction, PostData, ReputationEvent, ReputationActionType, REPUTATION_POINTS } from '@/types/forum';
import { supabase, ForumError, handleSupabaseError, withRetry } from '@/lib/supabase';
import { fetchPostsForThread } from '@/lib/forumDataFetchersOptimized';

interface UsePostsParams {
    currentUser: User;
    isAuthenticated: boolean;
    pageSize: number;
    setCategoriesState: React.Dispatch<React.SetStateAction<Category[]>>;
    setStatsState: React.Dispatch<React.SetStateAction<ForumStats>>;
    setReputationEvents: React.Dispatch<React.SetStateAction<Record<string, ReputationEvent[]>>>;
    subscribeToThreadPosts: (threadId: string) => void;
    setError: (key: string, error: ForumError, operation: string) => void;
    clearError: (key: string) => void;
}

export function usePosts({
    currentUser,
    isAuthenticated,
    pageSize,
    setCategoriesState,
    setStatsState,
    setReputationEvents,
    subscribeToThreadPosts,
    setError,
    clearError,
}: UsePostsParams) {
    const [postsMap, setPostsMap] = useState<Record<string, PostData[]>>({});
    const [loadingPosts, setLoadingPosts] = useState<Record<string, boolean>>({});
    const [postPages, setPostPages] = useState<Record<string, number>>({});
    const [hasMorePostsMap, setHasMorePostsMap] = useState<Record<string, boolean>>({});
    const fetchingPostsRef = useRef<Record<string, boolean>>({});

    const getPostsForThread = useCallback((threadId: string, page: number = 0, pageSizeParam?: number): PostData[] => {
        const effectivePageSize = pageSizeParam || pageSize;
        if (postsMap[threadId]) return postsMap[threadId];
        if (fetchingPostsRef.current[threadId] || loadingPosts[threadId]) return [];

        fetchingPostsRef.current[threadId] = true;

        Promise.resolve().then(async () => {
            setLoadingPosts(prev => ({ ...prev, [threadId]: true }));
            try {
                const posts = await withRetry(() => fetchPostsForThread(threadId, currentUser.id, page, effectivePageSize));
                setPostsMap(prev => ({ ...prev, [threadId]: posts }));
                setPostPages(prev => ({ ...prev, [threadId]: page }));
                setHasMorePostsMap(prev => ({ ...prev, [threadId]: posts.length === effectivePageSize }));
                subscribeToThreadPosts(threadId);
                clearError(`posts-${threadId}`);
            } catch (err) {
                const forumError = handleSupabaseError(err, 'fetchPostsForThread');
                setError(`posts-${threadId}`, forumError, 'Fetch posts');
            } finally {
                fetchingPostsRef.current[threadId] = false;
                setLoadingPosts(prev => { const u = { ...prev }; delete u[threadId]; return u; });
            }
        });

        return [];
    }, [postsMap, loadingPosts, currentUser.id, pageSize, clearError, setError, subscribeToThreadPosts]);

    const loadMorePosts = useCallback(async (threadId: string): Promise<void> => {
        const currentPage = postPages[threadId] || 0;
        const nextPage = currentPage + 1;
        if (fetchingPostsRef.current[threadId] || loadingPosts[threadId]) return;

        fetchingPostsRef.current[threadId] = true;
        setLoadingPosts(prev => ({ ...prev, [threadId]: true }));

        try {
            const newPosts = await withRetry(() => fetchPostsForThread(threadId, currentUser.id, nextPage, pageSize));
            setPostsMap(prev => ({ ...prev, [threadId]: [...(prev[threadId] || []), ...newPosts] }));
            setPostPages(prev => ({ ...prev, [threadId]: nextPage }));
            setHasMorePostsMap(prev => ({ ...prev, [threadId]: newPosts.length === pageSize }));
            clearError(`posts-${threadId}`);
        } catch (err) {
            const forumError = handleSupabaseError(err, 'loadMorePosts');
            setError(`posts-${threadId}`, forumError, 'Load more posts');
            throw forumError;
        } finally {
            fetchingPostsRef.current[threadId] = false;
            setLoadingPosts(prev => { const u = { ...prev }; delete u[threadId]; return u; });
        }
    }, [postPages, loadingPosts, currentUser.id, pageSize, clearError, setError]);

    const hasMorePosts = useCallback((threadId: string): boolean => {
        if (!postsMap[threadId]) return false;
        return hasMorePostsMap[threadId] !== false;
    }, [postsMap, hasMorePostsMap]);

    const addPost = useCallback(async (threadId: string, content: string, quotedPost?: { author: string; content: string }, replyTo?: string): Promise<PostData> => {
        if (!isAuthenticated || !currentUser?.id) {
            throw new ForumError('User not authenticated', 'AUTH_REQUIRED', 'You must be logged in to post replies.', false);
        }

        // Validate content
        if (!content || !content.trim()) {
            throw new ForumError('Empty content', 'VALIDATION_ERROR', 'Post content cannot be empty', false);
        }

        const trimmedContent = content.trim();
        
        if (trimmedContent.length < 1) {
            throw new ForumError('Content too short', 'VALIDATION_ERROR', 'Post must have at least 1 character', false);
        }

        if (trimmedContent.length > 50000) {
            throw new ForumError('Content too long', 'VALIDATION_ERROR', 'Post cannot exceed 50,000 characters', false);
        }

        const postId = crypto.randomUUID();
        const now = new Date().toISOString();
        // Don't add quote to content - it will be shown in UI via QuotedReplyBox
        // Just store the clean reply content
        const fullContent = trimmedContent;

        const optimisticPost: PostData = {
            id: postId, threadId, content: fullContent, author: currentUser,
            createdAt: now, likes: 0, isAnswer: false, reactions: [], upvotes: 0, downvotes: 0,
            replyTo: replyTo || undefined,
        };

        setPostsMap((prev) => ({ ...prev, [threadId]: [...(prev[threadId] || []), optimisticPost] }));
        setCategoriesState((prev) =>
            prev.map((cat) => ({
                ...cat,
                threads: cat.threads.map((t) => t.id === threadId ? { ...t, replyCount: t.replyCount + 1, lastReplyAt: now, lastReplyBy: currentUser } : t),
                postCount: cat.threads.some((t) => t.id === threadId) ? cat.postCount + 1 : cat.postCount,
            }))
        );
        setStatsState((prev) => ({ ...prev, totalPosts: prev.totalPosts + 1, newPostsToday: prev.newPostsToday + 1 }));

        try {
            const { error: postError } = await supabase.from('posts').insert({
                id: postId, thread_id: threadId, content: fullContent, author_id: currentUser.id, created_at: now,
                ...(replyTo ? { reply_to: replyTo } : {}),
            });
            if (postError) throw postError;

            const { data: currentThread, error: fetchError } = await supabase.from('threads').select('reply_count').eq('id', threadId).single();
            if (fetchError) throw fetchError;

            const { error: threadError } = await supabase.from('threads').update({
                reply_count: (currentThread?.reply_count || 0) + 1, last_reply_at: now, last_reply_by_id: currentUser.id,
            }).eq('id', threadId);
            if (threadError) throw threadError;

            const { error: reputationError } = await supabase.from('reputation_events').insert({
                id: crypto.randomUUID(), user_id: currentUser.id, action: 'post_created',
                points: REPUTATION_POINTS.post_created, description: 'Posted a reply',
                thread_id: threadId, created_at: now,
            });
            if (reputationError) throw reputationError;

            setReputationEvents(prev => ({
                ...prev,
                [currentUser.id]: [{
                    id: crypto.randomUUID(), userId: currentUser.id, action: 'post_created' as ReputationActionType,
                    points: REPUTATION_POINTS.post_created, description: 'Posted a reply',
                    threadId, createdAt: now,
                }, ...(prev[currentUser.id] || [])],
            }));

            return optimisticPost;
        } catch (error) {
            setPostsMap((prev) => ({ ...prev, [threadId]: (prev[threadId] || []).filter(p => p.id !== postId) }));
            setCategoriesState((prev) =>
                prev.map((cat) => ({
                    ...cat,
                    threads: cat.threads.map((t) => t.id === threadId ? { ...t, replyCount: t.replyCount - 1 } : t),
                    postCount: cat.threads.some((t) => t.id === threadId) ? cat.postCount - 1 : cat.postCount,
                }))
            );
            setStatsState((prev) => ({ ...prev, totalPosts: prev.totalPosts - 1, newPostsToday: prev.newPostsToday - 1 }));
            const forumError = handleSupabaseError(error, 'addPost');
            setError('addPost', forumError, 'Add post');
            throw forumError;
        }
    }, [currentUser, isAuthenticated, setCategoriesState, setStatsState, setReputationEvents, setError]);

    const editPost = useCallback(async (postId: string, newContent: string) => {
        if (!isAuthenticated || !currentUser?.id) {
            throw new ForumError('User not authenticated', 'AUTH_REQUIRED', 'You must be logged in to edit posts.', false);
        }

        // Validate content
        if (!newContent || !newContent.trim()) {
            throw new ForumError('Empty content', 'VALIDATION_ERROR', 'Post content cannot be empty', false);
        }

        const trimmedContent = newContent.trim();
        
        if (trimmedContent.length < 1) {
            throw new ForumError('Content too short', 'VALIDATION_ERROR', 'Post must have at least 1 character', false);
        }

        if (trimmedContent.length > 50000) {
            throw new ForumError('Content too long', 'VALIDATION_ERROR', 'Post cannot exceed 50,000 characters', false);
        }

        const now = new Date().toISOString();
        let originalPost: PostData | null = null;
        for (const threadId in postsMap) {
            const post = postsMap[threadId].find(p => p.id === postId);
            if (post) { originalPost = post; break; }
        }
        if (!originalPost) {
            throw new ForumError('Post not found', 'NOT_FOUND', 'The post you are trying to edit does not exist', false);
        }

        setPostsMap((prev) => {
            const updated = { ...prev };
            for (const threadId in updated) {
                updated[threadId] = updated[threadId].map((post) =>
                    post.id === postId ? { ...post, content: trimmedContent, editedAt: now } : post
                );
            }
            return updated;
        });

        try {
            const { error } = await supabase.from('posts').update({ content: trimmedContent, edited_at: now }).eq('id', postId);
            if (error) throw error;
        } catch (error) {
            setPostsMap((prev) => {
                const updated = { ...prev };
                for (const threadId in updated) {
                    updated[threadId] = updated[threadId].map((post) =>
                        post.id === postId ? { ...post, content: originalPost!.content, editedAt: originalPost!.editedAt } : post
                    );
                }
                return updated;
            });
            const forumError = handleSupabaseError(error, 'editPost');
            setError('editPost', forumError, 'Edit post');
            throw forumError;
        }
    }, [postsMap, isAuthenticated, currentUser, setError]);

    const togglePostLike = useCallback((postId: string) => {
        setPostsMap((prev) => {
            const updated = { ...prev };
            for (const threadId in updated) {
                updated[threadId] = updated[threadId].map((post) =>
                    post.id === postId
                        ? { ...post, likes: post.likes + (post.reactions.some(r => r.emoji === '❤️' && r.reacted) ? -1 : 1) }
                        : post
                );
            }
            return updated;
        });
    }, []);

    const togglePostReaction = useCallback((postId: string, emoji: string, label: string) => {
        if (!isAuthenticated || !currentUser?.id) return;

        let reactionPostAuthorId: string | null = null;
        let isAddingReaction = false;
        let previousReactions: Reaction[] = [];

        for (const threadId in postsMap) {
            const post = postsMap[threadId]?.find(p => p.id === postId);
            if (post) {
                reactionPostAuthorId = post.author.id;
                previousReactions = [...post.reactions];
                const existing = post.reactions.find(r => r.emoji === emoji);
                isAddingReaction = !existing || !existing.reacted;
                break;
            }
        }

        setPostsMap((prev) => {
            const updated = { ...prev };
            for (const threadId in updated) {
                updated[threadId] = updated[threadId].map((post) => {
                    if (post.id !== postId) return post;
                    const existingIdx = post.reactions.findIndex((r) => r.emoji === emoji);
                    let newReactions = [...post.reactions];
                    if (existingIdx >= 0) {
                        const existing = newReactions[existingIdx];
                        if (existing.reacted) {
                            if (existing.count <= 1) newReactions.splice(existingIdx, 1);
                            else newReactions[existingIdx] = { ...existing, count: existing.count - 1, reacted: false };
                        } else {
                            newReactions[existingIdx] = { ...existing, count: existing.count + 1, reacted: true };
                        }
                    } else {
                        newReactions.push({ emoji, label, count: 1, reacted: true });
                    }
                    return { ...post, reactions: newReactions };
                });
            }
            return updated;
        });

        (async () => {
            try {
                if (isAddingReaction) {
                    const { error } = await supabase.from('post_reactions').insert({
                        id: crypto.randomUUID(), post_id: postId, user_id: currentUser.id,
                        emoji, label, created_at: new Date().toISOString(),
                    });
                    if (error) throw error;

                    if (reactionPostAuthorId && reactionPostAuthorId !== currentUser.id) {
                        const now = new Date().toISOString();
                        const { error: repError } = await supabase.from('reputation_events').insert({
                            id: crypto.randomUUID(), user_id: reactionPostAuthorId, action: 'reaction_received',
                            points: REPUTATION_POINTS.reaction_received, description: `Received ${emoji} ${label} reaction`,
                            post_id: postId, triggered_by: currentUser.id, created_at: now,
                        });
                        if (!repError) {
                            setReputationEvents(prev => ({
                                ...prev,
                                [reactionPostAuthorId!]: [{
                                    id: crypto.randomUUID(), userId: reactionPostAuthorId!, action: 'reaction_received' as ReputationActionType,
                                    points: REPUTATION_POINTS.reaction_received, description: `Received ${emoji} ${label} reaction`,
                                    postId, triggeredBy: currentUser.username, createdAt: now,
                                }, ...(prev[reactionPostAuthorId!] || [])],
                            }));
                        }
                    }
                } else {
                    const { error } = await supabase.from('post_reactions').delete()
                        .eq('post_id', postId).eq('user_id', currentUser.id).eq('emoji', emoji);
                    if (error) throw error;
                }
            } catch (error) {
                setPostsMap((prev) => {
                    const updated = { ...prev };
                    for (const threadId in updated) {
                        updated[threadId] = updated[threadId].map((post) =>
                            post.id === postId ? { ...post, reactions: previousReactions } : post
                        );
                    }
                    return updated;
                });
                const forumError = handleSupabaseError(error, 'togglePostReaction');
                setError('togglePostReaction', forumError, 'Toggle reaction');
            }
        })();
    }, [postsMap, currentUser.id, currentUser.username, isAuthenticated, setReputationEvents, setError]);

    const resetPosts = useCallback(() => {
        setPostsMap({});
    }, []);

    const deletePost = useCallback(async (postId: string): Promise<void> => {
        if (!isAuthenticated || !currentUser?.id) {
            throw new ForumError('User not authenticated', 'AUTH_REQUIRED', 'You must be logged in to delete posts.', false);
        }

        // Find the post and store original state for rollback
        let originalPost: PostData | null = null;
        let postThreadId: string | null = null;
        for (const threadId in postsMap) {
            const post = postsMap[threadId].find(p => p.id === postId);
            if (post) {
                originalPost = post;
                postThreadId = threadId;
                break;
            }
        }

        if (!originalPost || !postThreadId) {
            throw new ForumError('Post not found', 'NOT_FOUND', 'The post you are trying to delete does not exist', false);
        }

        // Optimistic update - remove post immediately
        setPostsMap((prev) => {
            const updated = { ...prev };
            for (const threadId in updated) {
                updated[threadId] = updated[threadId].filter(p => p.id !== postId);
            }
            return updated;
        });

        // Update thread reply count optimistically
        setCategoriesState((prev) =>
            prev.map((cat) => ({
                ...cat,
                threads: cat.threads.map((t) => t.id === postThreadId ? { ...t, replyCount: Math.max(0, t.replyCount - 1) } : t),
                postCount: cat.threads.some((t) => t.id === postThreadId) ? Math.max(0, cat.postCount - 1) : cat.postCount,
            }))
        );

        setStatsState((prev) => ({ 
            ...prev, 
            totalPosts: Math.max(0, prev.totalPosts - 1),
        }));

        try {
            const { error } = await supabase.from('posts').delete().eq('id', postId);
            if (error) throw error;

            // Update thread reply count in database
            const { data: currentThread, error: fetchError } = await supabase
                .from('threads')
                .select('reply_count')
                .eq('id', postThreadId)
                .single();
            
            if (!fetchError && currentThread) {
                await supabase
                    .from('threads')
                    .update({ reply_count: Math.max(0, currentThread.reply_count - 1) })
                    .eq('id', postThreadId);
            }
        } catch (error) {
            // Rollback optimistic updates
            setPostsMap((prev) => {
                const updated = { ...prev };
                if (postThreadId && originalPost) {
                    updated[postThreadId] = [...(updated[postThreadId] || []), originalPost].sort(
                        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );
                }
                return updated;
            });

            setCategoriesState((prev) =>
                prev.map((cat) => ({
                    ...cat,
                    threads: cat.threads.map((t) => t.id === postThreadId ? { ...t, replyCount: t.replyCount + 1 } : t),
                    postCount: cat.threads.some((t) => t.id === postThreadId) ? cat.postCount + 1 : cat.postCount,
                }))
            );

            setStatsState((prev) => ({ 
                ...prev, 
                totalPosts: prev.totalPosts + 1,
            }));

            const forumError = handleSupabaseError(error, 'deletePost');
            setError('deletePost', forumError, 'Delete post');
            throw forumError;
        }
    }, [postsMap, isAuthenticated, currentUser, setCategoriesState, setStatsState, setError]);

    return {
        postsMap,
        setPostsMap,
        loadingPosts,
        getPostsForThread,
        loadMorePosts,
        hasMorePosts,
        addPost,
        editPost,
        deletePost,
        togglePostLike,
        togglePostReaction,
        resetPosts,
    };
}
