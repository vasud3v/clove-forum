import { useState, useCallback, useRef } from 'react';
import { User, ReputationEvent, ReputationActionType, REPUTATION_POINTS, PostData, Thread } from '@/types/forum';
import { supabase, ForumError, handleSupabaseError } from '@/lib/supabase';
import { CreateNotificationData } from '@/hooks/forum/useNotifications';

const REPUTATION_ACTION_DESCRIPTIONS: Record<ReputationActionType, string> = {
    post_upvoted: 'Post was upvoted',
    post_downvoted: 'Post was downvoted',
    best_answer: 'Post marked as best answer',
    thread_created: 'Created a new thread',
    helpful_post: 'Post marked as helpful',
    reaction_received: 'Received a reaction',
    post_created: 'Posted a reply',
    milestone_bonus: 'Reached a reputation milestone',
    streak_bonus: 'Maintained a posting streak',
};

interface UseReputationParams {
    currentUser: User;
    isAuthenticated: boolean;
    postsMap: Record<string, PostData[]>;
    getThread: (threadId: string) => Thread | null;
    setPostsMap: React.Dispatch<React.SetStateAction<Record<string, PostData[]>>>;
    setError: (key: string, error: ForumError, operation: string) => void;
    createNotification?: (data: CreateNotificationData) => Promise<void>;
}

export function useReputation({
    currentUser,
    isAuthenticated,
    postsMap,
    getThread,
    setPostsMap,
    setError,
    createNotification,
}: UseReputationParams) {
    const [reputationEvents, setReputationEvents] = useState<Record<string, ReputationEvent[]>>({});
    const [bestAnswers, setBestAnswers] = useState<Record<string, string>>({});
    const reputationFetchingRef = useRef<Set<string>>(new Set());

    const getReputationHistory = useCallback((userId: string): ReputationEvent[] => {
        const cachedEvents = reputationEvents[userId];
        if (cachedEvents) return cachedEvents;

        if (reputationFetchingRef.current.has(userId)) return [];
        reputationFetchingRef.current.add(userId);

        (async () => {
            try {
                const { data, error } = await supabase
                    .from('reputation_events').select('*').eq('user_id', userId)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                if (data) {
                    const events: ReputationEvent[] = data.map(event => ({
                        id: event.id, userId: event.user_id,
                        action: event.action as ReputationActionType,
                        points: event.points, description: event.description,
                        threadId: event.thread_id, threadTitle: event.thread_title,
                        postId: event.post_id, triggeredBy: event.triggered_by,
                        createdAt: event.created_at,
                    }));
                    setReputationEvents(prev => ({ ...prev, [userId]: events }));
                }
            } catch (error) {
                console.error('[useReputation] Failed to fetch reputation history:', error);
            } finally {
                reputationFetchingRef.current.delete(userId);
            }
        })();

        return [];
    }, [reputationEvents]);

    const getCalculatedReputation = useCallback((userId: string): number => {
        const events = reputationEvents[userId];
        if (!events || events.length === 0) {
            if (reputationFetchingRef.current.has(userId)) return 0;
            reputationFetchingRef.current.add(userId);

            (async () => {
                try {
                    const { data, error } = await supabase
                        .from('reputation_events').select('*').eq('user_id', userId)
                        .order('created_at', { ascending: false });
                    if (error) { console.warn('[useReputation] Could not fetch reputation events:', error.message); return; }
                    if (data) {
                        const events: ReputationEvent[] = data.map(event => ({
                            id: event.id, userId: event.user_id,
                            action: event.action as ReputationActionType,
                            points: event.points, description: event.description,
                            threadId: event.thread_id, threadTitle: event.thread_title,
                            postId: event.post_id, triggeredBy: event.triggered_by,
                            createdAt: event.created_at,
                        }));
                        setReputationEvents(prev => ({ ...prev, [userId]: events }));
                    }
                } catch (error) {
                    console.warn('[useReputation] Failed to calculate reputation:', error);
                } finally {
                    reputationFetchingRef.current.delete(userId);
                }
            })();

            return 0;
        }
        return events.reduce((total, event) => total + event.points, 0);
    }, [reputationEvents]);

    const getReputationChange24h = useCallback((userId: string): number => {
        const events = reputationEvents[userId];
        const oneDayAgo = Date.now() - 24 * 3600000;

        if (!events || events.length === 0) {
            if (reputationFetchingRef.current.has(userId)) return 0;
            reputationFetchingRef.current.add(userId);

            (async () => {
                try {
                    const { data: fullData, error: fullError } = await supabase
                        .from('reputation_events').select('*').eq('user_id', userId)
                        .order('created_at', { ascending: false });
                    if (!fullError && fullData) {
                        const events: ReputationEvent[] = fullData.map(event => ({
                            id: event.id, userId: event.user_id,
                            action: event.action as ReputationActionType,
                            points: event.points, description: event.description,
                            threadId: event.thread_id, threadTitle: event.thread_title,
                            postId: event.post_id, triggeredBy: event.triggered_by,
                            createdAt: event.created_at,
                        }));
                        setReputationEvents(prev => ({ ...prev, [userId]: events }));
                    }
                } catch (error) {
                    console.error('[useReputation] Failed to fetch 24h reputation change:', error);
                } finally {
                    reputationFetchingRef.current.delete(userId);
                }
            })();

            return 0;
        }

        return events
            .filter(e => new Date(e.createdAt).getTime() >= oneDayAgo)
            .reduce((sum, e) => sum + e.points, 0);
    }, [reputationEvents]);

    const awardReputation = useCallback(async (
        userId: string,
        action: ReputationActionType,
        details?: {
            threadId?: string; threadTitle?: string; postId?: string;
            triggeredBy?: string; customDescription?: string;
        }
    ) => {
        const points = REPUTATION_POINTS[action];
        const now = new Date().toISOString();
        const eventId = crypto.randomUUID();
        const description = details?.customDescription || REPUTATION_ACTION_DESCRIPTIONS[action];

        const newEvent: ReputationEvent = {
            id: eventId, userId, action, points, description,
            threadId: details?.threadId, threadTitle: details?.threadTitle,
            postId: details?.postId, triggeredBy: details?.triggeredBy,
            createdAt: now,
        };

        setReputationEvents(prev => ({
            ...prev, [userId]: [newEvent, ...(prev[userId] || [])],
        }));

        try {
            const { error } = await supabase.from('reputation_events').insert({
                id: eventId, user_id: userId, action, points, description,
                thread_id: details?.threadId || null, thread_title: details?.threadTitle || null,
                post_id: details?.postId || null, triggered_by: details?.triggeredBy || null,
                created_at: now,
            });
            if (error) throw error;
        } catch (error) {
            setReputationEvents(prev => ({
                ...prev, [userId]: (prev[userId] || []).filter(e => e.id !== eventId),
            }));
            const forumError = handleSupabaseError(error, 'awardReputation');
            setError('awardReputation', forumError, 'Award reputation');
            throw forumError;
        }
    }, [setError]);

    const markBestAnswer = useCallback(async (postId: string, threadId: string) => {
        if (!isAuthenticated || !currentUser?.id) {
            throw new ForumError('User not authenticated', 'AUTH_REQUIRED', 'You must be logged in to mark best answers.', false);
        }

        const posts = postsMap[threadId];
        if (!posts) return;
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        const previousBestAnswerId = bestAnswers[threadId];
        const now = new Date().toISOString();

        setBestAnswers(prev => {
            if (prev[threadId] === postId) {
                const next = { ...prev }; delete next[threadId]; return next;
            }
            return { ...prev, [threadId]: postId };
        });

        setPostsMap(prev => {
            const updated = { ...prev };
            if (updated[threadId]) {
                updated[threadId] = updated[threadId].map(p => ({
                    ...p, isAnswer: p.id === postId ? (previousBestAnswerId !== postId) : false,
                }));
            }
            return updated;
        });

        try {
            if (previousBestAnswerId && previousBestAnswerId !== postId) {
                await supabase.from('posts').update({ is_answer: false }).eq('id', previousBestAnswerId);
                await supabase.from('best_answers').delete().eq('thread_id', threadId);
            }

            const { error: baError } = await supabase.from('best_answers').insert({
                thread_id: threadId, post_id: postId, marked_by: currentUser.id, created_at: now,
            });
            if (baError) throw baError;

            await supabase.from('posts').update({ is_answer: true }).eq('id', postId);

            const { error: repError } = await supabase.from('reputation_events').insert({
                id: crypto.randomUUID(), user_id: post.author.id, action: 'best_answer',
                points: REPUTATION_POINTS.best_answer, description: 'Post marked as best answer',
                thread_id: threadId, post_id: postId, triggered_by: currentUser.id, created_at: now,
            });
            if (repError) throw repError;

            const thread = getThread(threadId);
            setReputationEvents(prev => ({
                ...prev,
                [post.author.id]: [{
                    id: crypto.randomUUID(), userId: post.author.id, action: 'best_answer' as ReputationActionType,
                    points: REPUTATION_POINTS.best_answer,
                    description: `Post marked as best answer in "${thread?.title || 'a thread'}"`,
                    threadId, threadTitle: thread?.title, postId,
                    triggeredBy: currentUser.username, createdAt: now,
                }, ...(prev[post.author.id] || [])],
            }));

            // Notify post author about best answer
            if (createNotification && post.author.id !== currentUser.id) {
                createNotification({
                    userId: post.author.id,
                    type: 'best_answer',
                    title: '🏆 Best Answer!',
                    message: `Your post was marked as the best answer in "${thread?.title || 'a thread'}"`,
                    link: `/thread/${threadId}`,
                    actorId: currentUser.id,
                    actorName: currentUser.username,
                    actorAvatar: currentUser.avatar,
                    targetType: 'post',
                    targetId: postId,
                });
            }
        } catch (error) {
            setBestAnswers(prev => {
                if (previousBestAnswerId) return { ...prev, [threadId]: previousBestAnswerId };
                const next = { ...prev }; delete next[threadId]; return next;
            });
            setPostsMap(prev => {
                const updated = { ...prev };
                if (updated[threadId]) {
                    updated[threadId] = updated[threadId].map(p => ({ ...p, isAnswer: p.id === previousBestAnswerId }));
                }
                return updated;
            });
            const forumError = handleSupabaseError(error, 'markBestAnswer');
            setError('markBestAnswer', forumError, 'markBestAnswer');
            throw forumError;
        }
    }, [postsMap, bestAnswers, getThread, currentUser, isAuthenticated, setPostsMap, setError, createNotification]);

    const getBestAnswerPostId = useCallback((threadId: string): string | null => {
        return bestAnswers[threadId] || null;
    }, [bestAnswers]);

    const resetReputation = useCallback(() => {
        setBestAnswers({});
    }, []);

    return {
        reputationEvents,
        setReputationEvents,
        getReputationHistory,
        getCalculatedReputation,
        getReputationChange24h,
        awardReputation,
        markBestAnswer,
        getBestAnswerPostId,
        resetReputation,
    };
}
