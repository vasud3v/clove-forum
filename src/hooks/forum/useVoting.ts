import { useState, useCallback } from 'react';
import { Category, User } from '@/types/forum';
import { PostData } from '@/types/forum';
import { supabase, ForumError, handleSupabaseError } from '@/lib/supabase';
import { CreateNotificationData } from '@/hooks/forum/useNotifications';

interface UseVotingParams {
    currentUser: User;
    isAuthenticated: boolean;
    setCategoriesState: React.Dispatch<React.SetStateAction<Category[]>>;
    setPostsMap: React.Dispatch<React.SetStateAction<Record<string, PostData[]>>>;
    setError: (key: string, error: ForumError, operation: string) => void;
    createNotification?: (data: CreateNotificationData) => Promise<void>;
}

export function useVoting({
    currentUser,
    isAuthenticated,
    setCategoriesState,
    setPostsMap,
    setError,
    createNotification,
}: UseVotingParams) {
    const [threadVotes, setThreadVotes] = useState<Record<string, 'up' | 'down'>>({});
    const [postVotes, setPostVotes] = useState<Record<string, 'up' | 'down'>>({});

    const voteThread = useCallback((threadId: string, direction: 'up' | 'down') => {
        if (!isAuthenticated || !currentUser?.id) return;

        const previousVote = threadVotes[threadId] || null;

        setThreadVotes((prev) => {
            const next = { ...prev };
            if (prev[threadId] === direction) {
                delete next[threadId];
            } else {
                next[threadId] = direction;
            }
            return next;
        });

        let upDelta = 0, downDelta = 0;
        if (previousVote === direction) {
            if (direction === 'up') upDelta = -1; else downDelta = -1;
        } else if (previousVote) {
            if (direction === 'up') { upDelta = 1; downDelta = -1; } else { upDelta = -1; downDelta = 1; }
        } else {
            if (direction === 'up') upDelta = 1; else downDelta = 1;
        }

        setCategoriesState((prev) =>
            prev.map((cat) => ({
                ...cat,
                threads: cat.threads.map((t) => t.id !== threadId ? t : {
                    ...t,
                    upvotes: Math.max(0, t.upvotes + upDelta),
                    downvotes: Math.max(0, t.downvotes + downDelta),
                }),
            }))
        );

        (async () => {
            try {
                if (previousVote === direction) {
                    const { error } = await supabase.from('thread_votes').delete()
                        .eq('thread_id', threadId).eq('user_id', currentUser.id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('thread_votes').upsert(
                        { thread_id: threadId, user_id: currentUser.id, direction },
                        { onConflict: 'user_id,thread_id' }
                    );
                    if (error) throw error;
                }

                const { data: voteCounts, error: countError } = await supabase
                    .from('thread_votes').select('direction').eq('thread_id', threadId);
                if (!countError && voteCounts) {
                    const upvotes = voteCounts.filter(v => v.direction === 'up').length;
                    const downvotes = voteCounts.filter(v => v.direction === 'down').length;
                    await supabase.from('threads').update({ upvotes, downvotes }).eq('id', threadId);
                }

                // Notify thread author on upvote (only new upvotes, not removals or downvotes)
                if (direction === 'up' && previousVote !== 'up' && createNotification) {
                    const { data: thread } = await supabase.from('threads').select('author_id, title').eq('id', threadId).single();
                    if (thread && thread.author_id !== currentUser.id) {
                        createNotification({
                            userId: thread.author_id,
                            type: 'upvote',
                            title: 'Thread Upvoted',
                            message: `${currentUser.username} upvoted your thread "${thread.title}"`,
                            link: `/thread/${threadId}`,
                            actorId: currentUser.id,
                            actorName: currentUser.username,
                            actorAvatar: currentUser.avatar,
                            targetType: 'thread',
                            targetId: threadId,
                        });
                    }
                }
            } catch (error) {
                setThreadVotes((prev) => {
                    const next = { ...prev };
                    if (previousVote) next[threadId] = previousVote; else delete next[threadId];
                    return next;
                });
                setCategoriesState((prev) =>
                    prev.map((cat) => ({
                        ...cat,
                        threads: cat.threads.map((t) => t.id !== threadId ? t : {
                            ...t,
                            upvotes: Math.max(0, t.upvotes - upDelta),
                            downvotes: Math.max(0, t.downvotes - downDelta),
                        }),
                    }))
                );
                const forumError = handleSupabaseError(error, 'voteThread');
                setError('voteThread', forumError, 'Vote on thread');
            }
        })();
    }, [threadVotes, currentUser.id, currentUser.username, currentUser.avatar, isAuthenticated, setCategoriesState, setError, createNotification]);

    const getThreadVote = useCallback((threadId: string): 'up' | 'down' | null => {
        return threadVotes[threadId] || null;
    }, [threadVotes]);

    const votePost = useCallback((postId: string, direction: 'up' | 'down') => {
        if (!isAuthenticated || !currentUser?.id) return;

        const previousVote = postVotes[postId] || null;

        setPostVotes((prev) => {
            const next = { ...prev };
            if (prev[postId] === direction) delete next[postId]; else next[postId] = direction;
            return next;
        });

        let upDelta = 0, downDelta = 0;
        if (previousVote === direction) {
            if (direction === 'up') upDelta = -1; else downDelta = -1;
        } else if (previousVote) {
            if (direction === 'up') { upDelta = 1; downDelta = -1; } else { upDelta = -1; downDelta = 1; }
        } else {
            if (direction === 'up') upDelta = 1; else downDelta = 1;
        }

        setPostsMap((prev) => {
            const updated = { ...prev };
            for (const threadId in updated) {
                updated[threadId] = updated[threadId].map((post) =>
                    post.id !== postId ? post : {
                        ...post,
                        upvotes: Math.max(0, post.upvotes + upDelta),
                        downvotes: Math.max(0, post.downvotes + downDelta),
                    }
                );
            }
            return updated;
        });

        (async () => {
            try {
                if (previousVote === direction) {
                    const { error } = await supabase.from('post_votes').delete()
                        .eq('post_id', postId).eq('user_id', currentUser.id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('post_votes').upsert(
                        { post_id: postId, user_id: currentUser.id, direction },
                        { onConflict: 'user_id,post_id' }
                    );
                    if (error) throw error;
                }

                const { data: voteCounts, error: countError } = await supabase
                    .from('post_votes').select('direction').eq('post_id', postId);
                if (!countError && voteCounts) {
                    const upvotes = voteCounts.filter(v => v.direction === 'up').length;
                    const downvotes = voteCounts.filter(v => v.direction === 'down').length;
                    await supabase.from('posts').update({ upvotes, downvotes }).eq('id', postId);
                }

                // Notify post author on upvote (only new upvotes)
                if (direction === 'up' && previousVote !== 'up' && createNotification) {
                    const { data: post } = await supabase.from('posts').select('author_id, thread_id').eq('id', postId).single();
                    if (post && post.author_id !== currentUser.id) {
                        createNotification({
                            userId: post.author_id,
                            type: 'upvote',
                            title: 'Post Upvoted',
                            message: `${currentUser.username} upvoted your post`,
                            link: `/thread/${post.thread_id}`,
                            actorId: currentUser.id,
                            actorName: currentUser.username,
                            actorAvatar: currentUser.avatar,
                            targetType: 'post',
                            targetId: postId,
                        });
                    }
                }
            } catch (error) {
                setPostVotes((prev) => {
                    const next = { ...prev };
                    if (previousVote) next[postId] = previousVote; else delete next[postId];
                    return next;
                });
                setPostsMap((prev) => {
                    const updated = { ...prev };
                    for (const threadId in updated) {
                        updated[threadId] = updated[threadId].map((post) =>
                            post.id !== postId ? post : {
                                ...post,
                                upvotes: Math.max(0, post.upvotes - upDelta),
                                downvotes: Math.max(0, post.downvotes - downDelta),
                            }
                        );
                    }
                    return updated;
                });
                const forumError = handleSupabaseError(error, 'votePost');
                setError('votePost', forumError, 'Vote on post');
            }
        })();
    }, [postVotes, currentUser.id, currentUser.username, currentUser.avatar, isAuthenticated, setPostsMap, setError, createNotification]);

    const getPostVote = useCallback((postId: string): 'up' | 'down' | null => {
        return postVotes[postId] || null;
    }, [postVotes]);

    const resetVotes = useCallback(() => {
        setThreadVotes({});
        setPostVotes({});
    }, []);

    return {
        voteThread,
        getThreadVote,
        votePost,
        getPostVote,
        resetVotes,
    };
}
