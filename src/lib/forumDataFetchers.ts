/**
 * Extracted data-fetching functions from ForumContext.
 * These handle all Supabase queries for categories, threads, posts, polls, and stats.
 */

import { Thread, Category, User, ForumStats, Reaction, PostData, PollOption, PollData } from '@/types/forum';
import { supabase } from '@/lib/supabase';

// Re-export types from canonical location for backward compat
export type { Reaction, PostData, PollOption, PollData };

/**
 * Fetch categories with nested topics and threads from Supabase
 */
export async function fetchCategories(currentUserId?: string, page: number = 0, pageSize: number = 50): Promise<Category[]> {
    const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select(`
      id, name, description, icon, thread_count, post_count, last_activity,
      is_sticky, is_important,
      topics:topics(
        id, name, description, thread_count, post_count, last_activity,
        last_post_by_user:forum_users!topics_last_post_by_fkey(username)
      )
    `)
        .order('is_sticky', { ascending: false })
        .order('is_important', { ascending: false })
        .order('name');

    if (categoriesError) throw categoriesError;
    if (!categories) return [];

    const from = page * pageSize;
    const to = from + pageSize - 1;

    const categoriesWithThreads = await Promise.all(
        categories.map(async (cat) => {
            const { data: threads, error: threadsError } = await supabase
                .from('threads')
                .select(`
          id, title, excerpt, author_id, category_id, topic_id,
          created_at, last_reply_at, last_reply_by_id,
          reply_count, view_count, is_pinned, is_locked, is_hot,
          has_unread, tags, is_staff_only, is_featured, is_archived,
          trending_score, upvotes, downvotes,
          author:forum_users!threads_author_id_fkey(id, username, avatar, banner, post_count, reputation, join_date, is_online, rank, role),
          last_reply_by:forum_users!threads_last_reply_by_id_fkey(id, username, avatar, banner, post_count, reputation, join_date, is_online, rank, role)
        `)
                .eq('category_id', cat.id)
                .order('is_pinned', { ascending: false })
                .order('last_reply_at', { ascending: false })
                .range(from, to);

            if (threadsError) throw threadsError;

            const transformedThreads: Thread[] = (threads || []).map((thread) => {
                const threadAuthor = Array.isArray(thread.author) ? thread.author[0] : thread.author;
                const lastReplyBy = thread.last_reply_by
                    ? (Array.isArray(thread.last_reply_by) ? thread.last_reply_by[0] : thread.last_reply_by)
                    : threadAuthor;

                return {
                    id: thread.id,
                    title: thread.title,
                    excerpt: thread.excerpt || undefined,
                    author: {
                        id: threadAuthor.id,
                        username: threadAuthor.username,
                        avatar: threadAuthor.avatar,
                        banner: threadAuthor.banner || undefined,
                        postCount: threadAuthor.post_count,
                        reputation: threadAuthor.reputation,
                        joinDate: threadAuthor.join_date,
                        isOnline: threadAuthor.is_online,
                        rank: threadAuthor.rank || undefined,
                        role: threadAuthor.role || 'member',
                    },
                    categoryId: thread.category_id,
                    topicId: thread.topic_id || undefined,
                    createdAt: thread.created_at,
                    lastReplyAt: thread.last_reply_at,
                    lastReplyBy: {
                        id: lastReplyBy.id,
                        username: lastReplyBy.username,
                        avatar: lastReplyBy.avatar,
                        banner: lastReplyBy.banner || undefined,
                        postCount: lastReplyBy.post_count,
                        reputation: lastReplyBy.reputation,
                        joinDate: lastReplyBy.join_date,
                        isOnline: lastReplyBy.is_online,
                        rank: lastReplyBy.rank || undefined,
                        role: lastReplyBy.role || 'member',
                    },
                    replyCount: thread.reply_count,
                    viewCount: thread.view_count,
                    isPinned: thread.is_pinned,
                    isLocked: thread.is_locked,
                    isHot: thread.is_hot,
                    hasUnread: thread.has_unread,
                    tags: thread.tags || undefined,
                    isStaffOnly: thread.is_staff_only || undefined,
                    isFeatured: thread.is_featured || undefined,
                    isArchived: thread.is_archived || undefined,
                    trendingScore: thread.trending_score || undefined,
                    upvotes: thread.upvotes,
                    downvotes: thread.downvotes,
                };
            });

            return {
                id: cat.id,
                name: cat.name,
                description: cat.description,
                icon: cat.icon,
                threadCount: cat.thread_count,
                postCount: cat.post_count,
                lastActivity: cat.last_activity,
                threads: transformedThreads,
                topics: cat.topics?.map((topic: any) => ({
                    id: topic.id,
                    name: topic.name,
                    description: topic.description || undefined,
                    threadCount: topic.thread_count,
                    postCount: topic.post_count,
                    lastActivity: topic.last_activity,
                    lastPostBy: topic.last_post_by_user?.username || undefined,
                })) || undefined,
                isSticky: cat.is_sticky || undefined,
                isImportant: cat.is_important || undefined,
            };
        })
    );

    return categoriesWithThreads;
}

/**
 * Fetch posts for a thread from Supabase with nested author, reactions, and votes
 */
export async function fetchPostsForThread(threadId: string, currentUserId: string, page: number = 0, pageSize: number = 50): Promise<PostData[]> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data: posts, error } = await supabase
        .from('posts')
        .select(`
      *,
      author:forum_users!posts_author_id_fkey(*),
      reactions:post_reactions(emoji, label, user_id),
      votes:post_votes(user_id, direction)
    `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
        .range(from, to);

    if (error) throw error;
    if (!posts) return [];

    return posts.map(post => {
        const reactionMap = new Map<string, Reaction>();

        if (post.reactions) {
            for (const r of post.reactions) {
                const key = r.emoji;
                if (!reactionMap.has(key)) {
                    reactionMap.set(key, { emoji: r.emoji, label: r.label, count: 0, reacted: false });
                }
                const reaction = reactionMap.get(key)!;
                reaction.count++;
                if (r.user_id === currentUserId) {
                    reaction.reacted = true;
                }
            }
        }

        const postAuthor = Array.isArray(post.author) ? post.author[0] : post.author;

        return {
            id: post.id,
            threadId: post.thread_id,
            content: post.content,
            author: {
                id: postAuthor.id,
                username: postAuthor.username,
                avatar: postAuthor.avatar,
                banner: postAuthor.banner || undefined,
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
            reactions: Array.from(reactionMap.values()),
        };
    });
}

/**
 * Fetch poll data for a thread from Supabase
 */
export async function fetchPollForThread(threadId: string, currentUserId: string): Promise<PollData | null> {
    try {
        const { data: poll, error: pollError } = await supabase
            .from('polls')
            .select('*')
            .eq('thread_id', threadId)
            .maybeSingle();

        if (pollError) {
            if (pollError.code === 'PGRST116' || pollError.code === '42P01' || pollError.code === 'PGRST204') {
                return null;
            }
            console.warn('[ForumDataFetchers] Could not fetch poll:', pollError.message);
            return null;
        }

        if (!poll) return null;

        const { data: options, error: optionsError } = await supabase
            .from('poll_options')
            .select('*')
            .eq('poll_id', poll.id);

        if (optionsError) {
            console.warn('[ForumDataFetchers] Could not fetch poll options:', optionsError.message);
            return null;
        }

        const { data: votes, error: votesError } = await supabase
            .from('poll_votes')
            .select('user_id, option_id')
            .eq('poll_id', poll.id);

        if (votesError) {
            console.warn('[ForumDataFetchers] Could not fetch poll votes:', votesError.message);
        }

        const userVotes = votes?.filter((v: any) => v.user_id === currentUserId) || [];

        return {
            question: poll.question,
            options: options?.map((opt: any) => ({ id: opt.id, text: opt.text, votes: opt.votes })) || [],
            totalVotes: poll.total_votes,
            endsAt: poll.ends_at,
            isMultipleChoice: poll.is_multiple_choice,
            hasVoted: userVotes.length > 0,
            votedOptionIds: userVotes.map((v: any) => v.option_id),
        };
    } catch (error) {
        console.warn('[ForumDataFetchers] Error fetching poll:', error);
        return null;
    }
}

/**
 * Fetch forum statistics from Supabase by aggregating data
 */
export async function fetchForumStats(): Promise<ForumStats> {
    const { count: totalThreads, error: threadsError } = await supabase
        .from('threads')
        .select('*', { count: 'exact', head: true });
    if (threadsError) throw threadsError;

    const { count: totalPosts, error: postsError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });
    if (postsError) throw postsError;

    const { count: totalUsers, error: usersError } = await supabase
        .from('forum_users')
        .select('*', { count: 'exact', head: true });
    if (usersError) throw usersError;

    const { count: onlineUsers, error: onlineError } = await supabase
        .from('forum_users')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true);
    if (onlineError) throw onlineError;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: newPostsToday, error: newPostsError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo);
    if (newPostsError) throw newPostsError;

    const { data: newestMemberData, error: newestMemberError } = await supabase
        .from('forum_users')
        .select('username')
        .order('join_date', { ascending: false })
        .limit(1)
        .single();
    if (newestMemberError) throw newestMemberError;

    return {
        totalThreads: totalThreads || 0,
        totalPosts: totalPosts || 0,
        totalUsers: totalUsers || 0,
        activeUsers: onlineUsers || 0,
        newPostsToday: newPostsToday || 0,
        newestMember: newestMemberData?.username || 'Unknown',
        onlineUsers: onlineUsers || 0,
    };
}
