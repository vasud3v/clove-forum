/**
 * Optimized data-fetching functions with parallel queries and reduced overhead
 */

import { Thread, Category, User, ForumStats, Reaction, PostData, PollOption, PollData } from '@/types/forum';
import { supabase } from '@/lib/supabase';

export type { Reaction, PostData, PollOption, PollData };

/**
 * Fetch categories with threads in parallel (optimized)
 * - Fetches all threads in one query instead of per-category
 * - Groups threads by category in memory
 * - Reduces database round trips from N+1 to 2
 */
export async function fetchCategories(currentUserId?: string, page: number = 0, pageSize: number = 50): Promise<Category[]> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Fetch categories, topics, and threads in parallel
    const [categoriesResult, topicsResult, threadsResult] = await Promise.all([
        supabase
            .from('categories')
            .select('id, name, description, icon, thread_count, post_count, last_activity, is_sticky, is_important')
            .order('is_sticky', { ascending: false })
            .order('is_important', { ascending: false })
            .order('name'),
        
        supabase
            .from('topics')
            .select('id, name, description, thread_count, post_count, last_activity, last_post_by, category_id')
            .order('name'),
        
        supabase
            .from('threads')
            .select(`
                id, title, excerpt, author_id, category_id, topic_id,
                created_at, last_reply_at, last_reply_by_id,
                reply_count, view_count, is_pinned, is_locked, is_hot,
                has_unread, tags, upvotes, downvotes,
                author:forum_users!threads_author_id_fkey(id, username, avatar, custom_avatar, post_count, reputation, join_date, is_online, rank, role),
                last_reply_by:forum_users!threads_last_reply_by_id_fkey(id, username, avatar, custom_avatar, post_count, reputation, join_date, is_online, rank, role)
            `)
            .order('is_pinned', { ascending: false })
            .order('last_reply_at', { ascending: false })
            .range(from, to)
    ]);

    if (categoriesResult.error) throw categoriesResult.error;
    if (topicsResult.error) throw topicsResult.error;
    if (threadsResult.error) throw threadsResult.error;

    const categories = categoriesResult.data || [];
    const allTopics = topicsResult.data || [];
    const allThreads = threadsResult.data || [];

    // Group topics by category
    const topicsByCategory = new Map<string, any[]>();
    for (const topic of allTopics) {
        if (!topicsByCategory.has(topic.category_id)) {
            topicsByCategory.set(topic.category_id, []);
        }
        topicsByCategory.get(topic.category_id)!.push({
            id: topic.id,
            name: topic.name,
            description: topic.description || undefined,
            threadCount: topic.thread_count,
            postCount: topic.post_count,
            lastActivity: topic.last_activity,
            lastPostBy: topic.last_post_by || undefined,
        });
    }

    // Group threads by category
    const threadsByCategory = new Map<string, Thread[]>();
    
    for (const thread of allThreads) {
        const threadAuthor = Array.isArray(thread.author) ? thread.author[0] : thread.author;
        const lastReplyBy = thread.last_reply_by
            ? (Array.isArray(thread.last_reply_by) ? thread.last_reply_by[0] : thread.last_reply_by)
            : threadAuthor;

        const transformedThread: Thread = {
            id: thread.id,
            title: thread.title,
            excerpt: thread.excerpt || undefined,
            author: {
                id: threadAuthor.id,
                username: threadAuthor.username,
                avatar: threadAuthor.custom_avatar || threadAuthor.avatar,
                banner: undefined, // Removed from main category fetch for speed
                postCount: threadAuthor.post_count,
                reputation: threadAuthor.reputation,
                joinDate: threadAuthor.join_date,
                isOnline: threadAuthor.is_online,
                rank: threadAuthor.rank || 'Newcomer',
                role: threadAuthor.role || 'member',
            },
            categoryId: thread.category_id,
            topicId: thread.topic_id || undefined,
            createdAt: thread.created_at,
            lastReplyAt: thread.last_reply_at,
            lastReplyBy: {
                id: lastReplyBy.id,
                username: lastReplyBy.username,
                avatar: lastReplyBy.custom_avatar || lastReplyBy.avatar,
                banner: undefined, // Removed from main category fetch for speed
                postCount: lastReplyBy.post_count,
                reputation: lastReplyBy.reputation,
                joinDate: lastReplyBy.join_date,
                isOnline: lastReplyBy.is_online,
                rank: lastReplyBy.rank || 'Newcomer',
                role: lastReplyBy.role || 'member',
            },
            replyCount: thread.reply_count,
            viewCount: thread.view_count,
            isPinned: thread.is_pinned,
            isLocked: thread.is_locked,
            isHot: thread.is_hot,
            hasUnread: thread.has_unread,
            tags: thread.tags || undefined,
            upvotes: thread.upvotes,
            downvotes: thread.downvotes,
        };

        if (!threadsByCategory.has(thread.category_id)) {
            threadsByCategory.set(thread.category_id, []);
        }
        threadsByCategory.get(thread.category_id)!.push(transformedThread);
    }

    // Build categories with their threads and topics
    return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        threadCount: cat.thread_count,
        postCount: cat.post_count,
        lastActivity: cat.last_activity,
        threads: threadsByCategory.get(cat.id) || [],
        topics: topicsByCategory.get(cat.id) || undefined,
        isSticky: cat.is_sticky || undefined,
        isImportant: cat.is_important || undefined,
    }));
}

/**
 * Fetch posts for a thread (optimized)
 * - Single query without heavy joins
 * - Reactions loaded separately only when needed
 * - Much faster for threads with many posts
 */
export async function fetchPostsForThread(
    threadId: string,
    currentUserId: string,
    page: number = 0,
    pageSize: number = 50
): Promise<PostData[]> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Fetch posts without reactions join (much faster)
    const { data: posts, error } = await supabase
        .from('posts')
        .select(`
            id, thread_id, content, created_at, edited_at, likes, upvotes, downvotes, is_answer, reply_to, signature,
            author:forum_users!posts_author_id_fkey(id, username, avatar, custom_avatar, banner, custom_banner, post_count, reputation, join_date, is_online, rank, role)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
        .range(from, to);

    if (error) throw error;
    if (!posts || posts.length === 0) return [];

    // Get post IDs for reaction query
    const postIds = posts.map(p => p.id);

    // Fetch reactions for all posts in parallel (only if there are posts)
    const { data: reactions } = await supabase
        .from('post_reactions')
        .select('post_id, emoji, label, user_id')
        .in('post_id', postIds);

    // Group reactions by post ID
    const reactionsByPost = new Map<string, Reaction[]>();
    if (reactions) {
        for (const r of reactions) {
            if (!reactionsByPost.has(r.post_id)) {
                reactionsByPost.set(r.post_id, []);
            }
            
            const postReactions = reactionsByPost.get(r.post_id)!;
            const existing = postReactions.find(pr => pr.emoji === r.emoji);
            
            if (existing) {
                existing.count++;
                if (r.user_id === currentUserId) {
                    existing.reacted = true;
                }
            } else {
                postReactions.push({
                    emoji: r.emoji,
                    label: r.label,
                    count: 1,
                    reacted: r.user_id === currentUserId,
                });
            }
        }
    }

    return posts.map(post => {
        const postAuthor = Array.isArray(post.author) ? post.author[0] : post.author;

        return {
            id: post.id,
            threadId: post.thread_id,
            content: post.content,
            author: {
                id: postAuthor.id,
                username: postAuthor.username,
                avatar: postAuthor.custom_avatar || postAuthor.avatar,
                banner: postAuthor.custom_banner || postAuthor.banner || undefined,
                postCount: postAuthor.post_count,
                reputation: postAuthor.reputation,
                joinDate: postAuthor.join_date,
                isOnline: postAuthor.is_online,
                rank: postAuthor.rank || 'Newcomer',
                role: postAuthor.role || 'member',
            },
            createdAt: post.created_at,
            editedAt: post.edited_at || undefined,
            likes: post.likes,
            upvotes: post.upvotes,
            downvotes: post.downvotes,
            isAnswer: post.is_answer,
            replyTo: post.reply_to || undefined,
            signature: post.signature || undefined,
            reactions: reactionsByPost.get(post.id) || [],
        };
    });
}

/**
 * Fetch poll data for a thread (optimized)
 * - Parallel queries for options and votes
 */
export async function fetchPollForThread(threadId: string, currentUserId: string): Promise<PollData | null> {
    try {
        const { data: poll, error: pollError } = await supabase
            .from('polls')
            .select('id, question, total_votes, ends_at, is_multiple_choice')
            .eq('thread_id', threadId)
            .maybeSingle();

        if (pollError || !poll) return null;

        // Fetch options and votes in parallel
        const [optionsResult, votesResult] = await Promise.all([
            supabase
                .from('poll_options')
                .select('id, text, votes')
                .eq('poll_id', poll.id)
                .order('position'),
            
            supabase
                .from('poll_votes')
                .select('user_id, option_id')
                .eq('poll_id', poll.id)
                .eq('user_id', currentUserId)
        ]);

        if (optionsResult.error) return null;

        const userVotes = votesResult.data || [];

        return {
            question: poll.question,
            options: optionsResult.data?.map(opt => ({ id: opt.id, text: opt.text, votes: opt.votes })) || [],
            totalVotes: poll.total_votes,
            endsAt: poll.ends_at,
            isMultipleChoice: poll.is_multiple_choice,
            hasVoted: userVotes.length > 0,
            votedOptionIds: userVotes.map(v => v.option_id),
        };
    } catch (error) {
        console.warn('[ForumDataFetchers] Error fetching poll:', error);
        return null;
    }
}

/**
 * Fetch forum statistics (optimized)
 * - All count queries run in parallel
 * - Reduced from 6 sequential to 1 parallel batch
 */
export async function fetchForumStats(): Promise<ForumStats> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Run all queries in parallel
    const [
        threadsResult,
        postsResult,
        usersResult,
        onlineResult,
        newPostsResult,
        newestMemberResult
    ] = await Promise.all([
        supabase.from('threads').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('forum_users').select('*', { count: 'exact', head: true }),
        supabase.from('forum_users').select('*', { count: 'exact', head: true }).eq('is_online', true),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', oneDayAgo),
        supabase.from('forum_users').select('username').order('join_date', { ascending: false }).limit(1).maybeSingle()
    ]);

    // Check for errors
    if (threadsResult.error) throw threadsResult.error;
    if (postsResult.error) throw postsResult.error;
    if (usersResult.error) throw usersResult.error;
    if (onlineResult.error) throw onlineResult.error;
    if (newPostsResult.error) throw newPostsResult.error;

    return {
        totalThreads: threadsResult.count || 0,
        totalPosts: postsResult.count || 0,
        totalUsers: usersResult.count || 0,
        activeUsers: onlineResult.count || 0,
        newPostsToday: newPostsResult.count || 0,
        newestMember: newestMemberResult.data?.username || 'Unknown',
        onlineUsers: onlineResult.count || 0,
    };
}
