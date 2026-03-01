import { useEffect, useCallback, useRef } from 'react';
import { User, UserRole, Category, Reaction, PostData, PollData } from '@/types/forum';
import { supabase } from '@/lib/supabase';
import { fetchPollForThread } from '@/lib/forumDataFetchersOptimized';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { BatchProcessor } from '@/utils/debounce';

interface UseRealtimeParams {
    currentUser: User;
    authUserId: string | undefined;
    setCategoriesState: React.Dispatch<React.SetStateAction<Category[]>>;
    setPostsMap: React.Dispatch<React.SetStateAction<Record<string, PostData[]>>>;
    setPollsMap: React.Dispatch<React.SetStateAction<Record<string, PollData>>>;
    setForumUser: React.Dispatch<React.SetStateAction<User | null>>;
    setConnectionWarning: (warning: string | null) => void;
}

export function useRealtime({
    currentUser,
    authUserId,
    setCategoriesState,
    setPostsMap,
    setPollsMap,
    setForumUser,
    setConnectionWarning,
}: UseRealtimeParams) {
    const globalChannelRef = useRef<RealtimeChannel | null>(null);
    const threadChannelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
    const globalReconnectAttemptsRef = useRef<number>(0);
    const threadReconnectAttemptsRef = useRef<Map<string, number>>(new Map());

    // Batch processors for vote updates
    const threadVoteBatchRef = useRef<BatchProcessor<string>>();
    const postVoteBatchRef = useRef<BatchProcessor<{ postId: string; threadId: string }>>();
    const reactionBatchRef = useRef<BatchProcessor<{ postId: string; threadId: string }>>();

    // Initialize batch processors
    useEffect(() => {
        threadVoteBatchRef.current = new BatchProcessor(async (threadIds) => {
            for (const threadId of threadIds) {
                try {
                    const { data: voteCounts } = await supabase
                        .from('thread_votes')
                        .select('direction')
                        .eq('thread_id', threadId);
                    
                    const upvotes = voteCounts?.filter(v => v.direction === 'up').length || 0;
                    const downvotes = voteCounts?.filter(v => v.direction === 'down').length || 0;
                    
                    setCategoriesState((prev) =>
                        prev.map((cat) => ({
                            ...cat,
                            threads: cat.threads.map((t) =>
                                t.id === threadId ? { ...t, upvotes, downvotes } : t
                            ),
                        }))
                    );
                } catch (err) {
                    console.error('[useRealtime] Error processing thread vote batch:', err);
                }
            }
        }, 300);

        postVoteBatchRef.current = new BatchProcessor(async (items) => {
            const updates = new Map<string, { postId: string; upvotes: number; downvotes: number }>();
            
            for (const { postId, threadId } of items) {
                try {
                    const { data: voteCounts } = await supabase
                        .from('post_votes')
                        .select('direction')
                        .eq('post_id', postId);
                    
                    const upvotes = voteCounts?.filter(v => v.direction === 'up').length || 0;
                    const downvotes = voteCounts?.filter(v => v.direction === 'down').length || 0;
                    
                    updates.set(postId, { postId, upvotes, downvotes });
                } catch (err) {
                    console.error('[useRealtime] Error processing post vote batch:', err);
                }
            }

            if (updates.size > 0) {
                setPostsMap((prev) => {
                    const newMap = { ...prev };
                    for (const [postId, { upvotes, downvotes }] of updates) {
                        for (const threadId in newMap) {
                            const postIndex = newMap[threadId].findIndex(p => p.id === postId);
                            if (postIndex !== -1) {
                                newMap[threadId] = [...newMap[threadId]];
                                newMap[threadId][postIndex] = {
                                    ...newMap[threadId][postIndex],
                                    upvotes,
                                    downvotes,
                                };
                                break;
                            }
                        }
                    }
                    return newMap;
                });
            }
        }, 300);

        reactionBatchRef.current = new BatchProcessor(async (items) => {
            const updates = new Map<string, Reaction[]>();
            
            for (const { postId } of items) {
                try {
                    const { data: reactions } = await supabase
                        .from('post_reactions')
                        .select('emoji, label, user_id')
                        .eq('post_id', postId);

                    const reactionMap = new Map<string, Reaction>();
                    if (reactions) {
                        for (const r of reactions) {
                            if (!reactionMap.has(r.emoji)) {
                                reactionMap.set(r.emoji, {
                                    emoji: r.emoji,
                                    label: r.label,
                                    count: 0,
                                    reacted: false,
                                });
                            }
                            const reaction = reactionMap.get(r.emoji)!;
                            reaction.count++;
                            if (r.user_id === currentUser.id) reaction.reacted = true;
                        }
                    }
                    updates.set(postId, Array.from(reactionMap.values()));
                } catch (err) {
                    console.error('[useRealtime] Error processing reaction batch:', err);
                }
            }

            if (updates.size > 0) {
                setPostsMap((prev) => {
                    const newMap = { ...prev };
                    for (const [postId, reactions] of updates) {
                        for (const threadId in newMap) {
                            const postIndex = newMap[threadId].findIndex(p => p.id === postId);
                            if (postIndex !== -1) {
                                newMap[threadId] = [...newMap[threadId]];
                                newMap[threadId][postIndex] = {
                                    ...newMap[threadId][postIndex],
                                    reactions,
                                };
                                break;
                            }
                        }
                    }
                    return newMap;
                });
            }
        }, 300);

        return () => {
            threadVoteBatchRef.current?.flush();
            postVoteBatchRef.current?.flush();
            reactionBatchRef.current?.flush();
        };
    }, [currentUser.id]);

    // Global real-time subscription
    useEffect(() => {
        const globalChannel = supabase
            .channel('forum-global')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'forum_users' },
                (payload) => {
                    if (!payload.new) return;
                    const updatedUser = payload.new;

                    // Update current user if it's them
                    if (authUserId && updatedUser.id === authUserId) {
                        setForumUser((prev) => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                username: updatedUser.username,
                                avatar: updatedUser.avatar,
                                banner: updatedUser.banner,
                                postCount: updatedUser.post_count,
                                reputation: updatedUser.reputation,
                                isOnline: updatedUser.is_online,
                                rank: updatedUser.rank,
                                role: (updatedUser.role as UserRole) || prev.role,
                            };
                        });
                    }

                    // Optimized: Only update if user exists in current data
                    const userId = updatedUser.id;
                    setCategoriesState((prev) => {
                        let hasChanges = false;
                        const updated = prev.map((cat) => {
                            const updatedThreads = cat.threads.map((thread) => {
                                if (thread.author.id === userId) {
                                    hasChanges = true;
                                    return {
                                        ...thread,
                                        author: {
                                            ...thread.author,
                                            username: updatedUser.username,
                                            avatar: updatedUser.avatar,
                                            reputation: updatedUser.reputation,
                                            rank: updatedUser.rank,
                                        },
                                    };
                                }
                                return thread;
                            });
                            return hasChanges ? { ...cat, threads: updatedThreads } : cat;
                        });
                        return hasChanges ? updated : prev;
                    });

                    // Optimized: Only update posts if user exists
                    setPostsMap((prev) => {
                        const updated = { ...prev };
                        let hasChanges = false;
                        
                        for (const threadId in updated) {
                            const posts = updated[threadId];
                            const updatedPosts = posts.map((post) => {
                                if (post.author.id === userId) {
                                    hasChanges = true;
                                    return {
                                        ...post,
                                        author: {
                                            ...post.author,
                                            username: updatedUser.username,
                                            avatar: updatedUser.avatar,
                                            banner: updatedUser.banner,
                                            reputation: updatedUser.reputation,
                                            rank: updatedUser.rank,
                                        },
                                    };
                                }
                                return post;
                            });
                            
                            if (hasChanges) {
                                updated[threadId] = updatedPosts;
                            }
                        }
                        
                        return hasChanges ? updated : prev;
                    });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'categories' },
                (payload) => {
                    if (payload.eventType === 'UPDATE' && payload.new) {
                        setCategoriesState((prev) =>
                            prev.map((cat) =>
                                cat.id === payload.new.id
                                    ? {
                                        ...cat,
                                        name: payload.new.name,
                                        description: payload.new.description,
                                        icon: payload.new.icon,
                                        threadCount: payload.new.thread_count,
                                        postCount: payload.new.post_count,
                                        lastActivity: payload.new.last_activity,
                                        isSticky: payload.new.is_sticky,
                                        isImportant: payload.new.is_important,
                                    }
                                    : cat
                            )
                        );
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'threads' },
                (payload) => {
                    if (!payload.new) return;
                    const updatedThread = payload.new;
                    
                    // Update thread in categories state
                    setCategoriesState((prev) =>
                        prev.map((cat) => ({
                            ...cat,
                            threads: cat.threads.map((t) =>
                                t.id === updatedThread.id
                                    ? {
                                        ...t,
                                        title: updatedThread.title,
                                        excerpt: updatedThread.excerpt,
                                        viewCount: updatedThread.view_count,
                                        replyCount: updatedThread.reply_count,
                                        lastReplyAt: updatedThread.last_reply_at,
                                        isPinned: updatedThread.is_pinned,
                                        isLocked: updatedThread.is_locked,
                                        isHot: updatedThread.is_hot,
                                        upvotes: updatedThread.upvotes,
                                        downvotes: updatedThread.downvotes,
                                        tags: updatedThread.tags || [],
                                    }
                                    : t
                            ),
                        }))
                    );
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'threads' },
                async (payload) => {
                    if (payload.new.author_id === currentUser.id) return;

                    try {
                        const { data: threadData, error } = await supabase
                            .from('threads')
                            .select(`
                id, title, excerpt, author_id, category_id, topic_id,
                created_at, last_reply_at, last_reply_by_id,
                reply_count, view_count, is_pinned, is_locked, is_hot,
                tags, upvotes, downvotes,
                author:forum_users!threads_author_id_fkey(id, username, avatar, banner, post_count, reputation, join_date, is_online, rank, role),
                last_reply_by:forum_users!threads_last_reply_by_id_fkey(id, username, avatar, banner, post_count, reputation, join_date, is_online, rank, role)
              `)
                            .eq('id', payload.new.id)
                            .single();

                        if (error || !threadData) return;

                        const authorData = Array.isArray(threadData.author) ? threadData.author[0] : threadData.author;
                        const lastReplyByData = threadData.last_reply_by
                            ? Array.isArray(threadData.last_reply_by)
                                ? threadData.last_reply_by[0]
                                : threadData.last_reply_by
                            : null;

                        const newThread = {
                            id: threadData.id,
                            title: threadData.title,
                            excerpt: threadData.excerpt,
                            author: {
                                id: authorData.id,
                                username: authorData.username,
                                avatar: authorData.avatar,
                                banner: authorData.banner || undefined,
                                postCount: authorData.post_count,
                                reputation: authorData.reputation,
                                joinDate: authorData.join_date,
                                isOnline: authorData.is_online,
                                rank: authorData.rank || 'Newcomer',
                                role: authorData.role || 'member',
                            },
                            categoryId: threadData.category_id,
                            createdAt: threadData.created_at,
                            lastReplyAt: threadData.last_reply_at,
                            lastReplyBy: lastReplyByData
                                ? {
                                    id: lastReplyByData.id,
                                    username: lastReplyByData.username,
                                    avatar: lastReplyByData.avatar,
                                    banner: lastReplyByData.banner || undefined,
                                    postCount: lastReplyByData.post_count,
                                    reputation: lastReplyByData.reputation,
                                    joinDate: lastReplyByData.join_date,
                                    isOnline: lastReplyByData.is_online,
                                    rank: lastReplyByData.rank || 'Newcomer',
                                    role: lastReplyByData.role || 'member',
                                }
                                : {
                                    id: authorData.id,
                                    username: authorData.username,
                                    avatar: authorData.avatar,
                                    banner: authorData.banner || undefined,
                                    postCount: authorData.post_count,
                                    reputation: authorData.reputation,
                                    joinDate: authorData.join_date,
                                    isOnline: authorData.is_online,
                                    rank: authorData.rank || 'Newcomer',
                                    role: authorData.role || 'member',
                                },
                            replyCount: threadData.reply_count,
                            viewCount: threadData.view_count,
                            isPinned: threadData.is_pinned,
                            isLocked: threadData.is_locked,
                            isHot: threadData.is_hot,
                            hasUnread: false,
                            tags: threadData.tags || [],
                            upvotes: threadData.upvotes,
                            downvotes: threadData.downvotes,
                        };

                        setCategoriesState((prev) =>
                            prev.map((cat) =>
                                cat.id === threadData.category_id
                                    ? { ...cat, threads: [newThread, ...cat.threads] }
                                    : cat
                            )
                        );
                    } catch (err) {
                        console.error('[useRealtime] Error processing new thread event:', err);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    globalReconnectAttemptsRef.current = 0;
                    setConnectionWarning(null);
                } else if (status === 'CHANNEL_ERROR') {
                    globalReconnectAttemptsRef.current += 1;
                    const attempts = globalReconnectAttemptsRef.current;
                    if (attempts >= 3) {
                        setConnectionWarning(
                            'Connection to real-time updates is unstable. Please check your internet connection.'
                        );
                    }
                    const delay = Math.min(5000 * Math.pow(2, attempts - 1), 30000);
                    setTimeout(() => {
                        globalChannelRef.current?.unsubscribe();
                    }, delay);
                } else if (status === 'TIMED_OUT') {
                    globalReconnectAttemptsRef.current += 1;
                    if (globalReconnectAttemptsRef.current >= 3) {
                        setConnectionWarning('Connection to real-time updates timed out.');
                    }
                    globalChannelRef.current?.unsubscribe();
                }
            });

        globalChannelRef.current = globalChannel;

        return () => {
            globalChannel.unsubscribe();
            globalChannelRef.current = null;
        };
    }, [currentUser.id, authUserId]);

    // Thread-specific subscription
    const subscribeToThreadPosts = useCallback(
        (threadId: string) => {
            if (threadChannelsRef.current.has(threadId)) return;

            const threadChannel = supabase
                .channel(`thread-${threadId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'posts',
                        filter: `thread_id=eq.${threadId}`,
                    },
                    async (payload) => {
                        if (payload.new.author_id === currentUser.id) return;
                        
                        try {
                            const { data: postData, error } = await supabase
                                .from('posts')
                                .select(`
                  id, thread_id, content, created_at, edited_at, likes, upvotes, downvotes, is_answer, reply_to, signature,
                  author:forum_users!posts_author_id_fkey(id, username, avatar, banner, post_count, reputation, join_date, is_online, rank, role)
                `)
                                .eq('id', payload.new.id)
                                .single();
                            
                            if (error || !postData) return;

                            const postAuthorData = Array.isArray(postData.author)
                                ? postData.author[0]
                                : postData.author;
                            
                            const newPost: PostData = {
                                id: postData.id,
                                threadId: postData.thread_id,
                                content: postData.content,
                                author: {
                                    id: postAuthorData.id,
                                    username: postAuthorData.username,
                                    avatar: postAuthorData.avatar,
                                    banner: postAuthorData.banner || undefined,
                                    postCount: postAuthorData.post_count,
                                    reputation: postAuthorData.reputation,
                                    joinDate: postAuthorData.join_date,
                                    isOnline: postAuthorData.is_online,
                                    rank: postAuthorData.rank || 'Newcomer',
                                    role: postAuthorData.role || 'member',
                                },
                                createdAt: postData.created_at,
                                editedAt: postData.edited_at || undefined,
                                likes: postData.likes,
                                upvotes: postData.upvotes,
                                downvotes: postData.downvotes,
                                isAnswer: postData.is_answer,
                                replyTo: postData.reply_to || undefined,
                                signature: postData.signature || undefined,
                                reactions: [],
                            };

                            setPostsMap((prev) => {
                                const posts = prev[threadId] || [];
                                if (posts.some((p) => p.id === newPost.id)) return prev;
                                return { ...prev, [threadId]: [...posts, newPost] };
                            });
                        } catch (err) {
                            console.error('[useRealtime] Error processing new post event:', err);
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'posts',
                        filter: `thread_id=eq.${threadId}`,
                    },
                    (payload) => {
                        setPostsMap((prev) => ({
                            ...prev,
                            [threadId]: (prev[threadId] || []).map((p) =>
                                p.id === payload.new.id
                                    ? {
                                        ...p,
                                        content: payload.new.content,
                                        editedAt: payload.new.edited_at,
                                        upvotes: payload.new.upvotes,
                                        downvotes: payload.new.downvotes,
                                        isAnswer: payload.new.is_answer,
                                    }
                                    : p
                            ),
                        }));
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'posts',
                        filter: `thread_id=eq.${threadId}`,
                    },
                    (payload) => {
                        setPostsMap((prev) => ({
                            ...prev,
                            [threadId]: (prev[threadId] || []).filter((p) => p.id !== payload.old.id),
                        }));
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'thread_votes',
                        filter: `thread_id=eq.${threadId}`,
                    },
                    () => {
                        // Use batch processor for vote updates
                        threadVoteBatchRef.current?.add(threadId);
                    }
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'post_votes' },
                    (payload) => {
                        const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
                        if (!postId) return;
                        
                        // Use batch processor for vote updates
                        postVoteBatchRef.current?.add({ postId, threadId });
                    }
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'post_reactions' },
                    (payload) => {
                        const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
                        if (!postId) return;
                        
                        const userId = (payload.new as any)?.user_id || (payload.old as any)?.user_id;
                        if (userId === currentUser.id) return;

                        // Use batch processor for reaction updates
                        reactionBatchRef.current?.add({ postId, threadId });
                    }
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'poll_votes' },
                    async (payload) => {
                        const userId = (payload.new as any)?.user_id || (payload.old as any)?.user_id;
                        if (userId === currentUser.id) return;

                        try {
                            const updatedPoll = await fetchPollForThread(threadId, currentUser.id);
                            if (updatedPoll) {
                                setPollsMap((prev) => ({ ...prev, [threadId]: updatedPoll }));
                            }
                        } catch (err) {
                            console.error('[useRealtime] Error processing poll vote change:', err);
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        threadReconnectAttemptsRef.current.set(threadId, 0);
                        const hasFailures = Array.from(threadReconnectAttemptsRef.current.values()).some(
                            (a) => a >= 3
                        );
                        if (!hasFailures && globalReconnectAttemptsRef.current < 3) {
                            setConnectionWarning(null);
                        }
                    } else if (status === 'CHANNEL_ERROR') {
                        const attempts = (threadReconnectAttemptsRef.current.get(threadId) || 0) + 1;
                        threadReconnectAttemptsRef.current.set(threadId, attempts);
                        if (attempts >= 3) {
                            setConnectionWarning(
                                'Connection to real-time updates is unstable for some threads.'
                            );
                        }
                        const delay = Math.min(5000 * Math.pow(2, attempts - 1), 30000);
                        setTimeout(() => {
                            unsubscribeFromThreadPosts(threadId);
                            subscribeToThreadPosts(threadId);
                        }, delay);
                    } else if (status === 'TIMED_OUT') {
                        const attempts = (threadReconnectAttemptsRef.current.get(threadId) || 0) + 1;
                        threadReconnectAttemptsRef.current.set(threadId, attempts);
                        if (attempts >= 3) {
                            setConnectionWarning(
                                'Connection to real-time updates timed out for some threads.'
                            );
                        }
                        unsubscribeFromThreadPosts(threadId);
                        subscribeToThreadPosts(threadId);
                    }
                });

            threadChannelsRef.current.set(threadId, threadChannel);
        },
        [currentUser.id]
    );

    const unsubscribeFromThreadPosts = useCallback((threadId: string) => {
        const channel = threadChannelsRef.current.get(threadId);
        if (channel) {
            channel.unsubscribe();
            threadChannelsRef.current.delete(threadId);
            threadReconnectAttemptsRef.current.delete(threadId);
        }
    }, []);

    // Cleanup all thread subscriptions on unmount
    useEffect(() => {
        return () => {
            threadChannelsRef.current.forEach((channel) => channel.unsubscribe());
            threadChannelsRef.current.clear();
            threadReconnectAttemptsRef.current.clear();
            globalReconnectAttemptsRef.current = 0;
            threadVoteBatchRef.current?.flush();
            postVoteBatchRef.current?.flush();
            reactionBatchRef.current?.flush();
        };
    }, []);

    // Cleanup all subscriptions (for logout)
    const cleanupAllSubscriptions = useCallback(() => {
        if (globalChannelRef.current) {
            globalChannelRef.current.unsubscribe();
            globalChannelRef.current = null;
        }
        threadChannelsRef.current.forEach((channel) => channel.unsubscribe());
        threadChannelsRef.current.clear();
        threadReconnectAttemptsRef.current.clear();
        globalReconnectAttemptsRef.current = 0;
        threadVoteBatchRef.current?.flush();
        postVoteBatchRef.current?.flush();
        reactionBatchRef.current?.flush();
    }, []);

    return {
        subscribeToThreadPosts,
        unsubscribeFromThreadPosts,
        cleanupAllSubscriptions,
    };
}
