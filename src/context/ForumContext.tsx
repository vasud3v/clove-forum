import { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { Thread, Category, User, ForumStats, ReputationEvent, ReputationActionType, PostData, PollData, Reaction, ErrorState } from '@/types/forum';
import { ForumError } from '@/lib/supabase';

// Re-export types for consumers that import from ForumContext
export type { PostData, PollData, Reaction };

// ============================================================================
// Hooks
// ============================================================================

import { useForumErrors } from '@/hooks/forum/useForumErrors';
import { useForumUser } from '@/hooks/forum/useForumUser';
import { useCategories } from '@/hooks/forum/useCategories';
import { useRealtime } from '@/hooks/forum/useRealtimeOptimized';
import { usePosts } from '@/hooks/forum/usePostsOptimized';
import { usePolls } from '@/hooks/forum/usePolls';
import { useVoting } from '@/hooks/forum/useVoting';
import { useWatches } from '@/hooks/forum/useWatches';
import { usePostBookmarks } from '@/hooks/forum/usePostBookmarks';
import { useReputation } from '@/hooks/forum/useReputation';
import { useUserProfileSync } from '@/hooks/forum/useUserProfileSync';

// ============================================================================
// Context Type
// ============================================================================

interface ForumContextType {
  // Data
  categories: Category[];
  forumStats: ForumStats;
  currentUser: User;

  // Loading states
  loadingCategories: boolean;
  loadingStats: boolean;
  loadingPosts: Record<string, boolean>;

  // Thread operations
  getThread: (threadId: string) => Thread | null;
  getCategory: (categoryId: string) => Category | null;
  getCategoryForThread: (threadId: string) => Category | null;
  getAllThreads: () => Thread[];
  loadMoreThreads: (categoryId: string) => Promise<void>;
  hasMoreThreads: (categoryId: string) => boolean;
  createThread: (
    title: string, categoryId: string, content: string,
    tags?: string[],
    poll?: { question: string; options: string[]; isMultipleChoice: boolean; endsAt?: string },
    topicId?: string
  ) => Promise<Thread>;

  // Post operations
  getPostsForThread: (threadId: string, page?: number, pageSize?: number) => PostData[];
  prefetchPosts: (threadId: string) => void;
  loadMorePosts: (threadId: string) => Promise<void>;
  hasMorePosts: (threadId: string) => boolean;
  unsubscribeFromThreadPosts: (threadId: string) => void;
  addPost: (threadId: string, content: string, quotedPost?: { author: string; content: string }, replyTo?: string) => Promise<PostData>;
  editPost: (postId: string, newContent: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  togglePostLike: (postId: string) => void;
  togglePostReaction: (postId: string, emoji: string, label: string) => void;

  // Poll operations
  getPollForThread: (threadId: string) => PollData | null;
  votePoll: (threadId: string, optionIds: string[]) => void;

  // Thread actions
  toggleWatch: (threadId: string) => void;
  isWatching: (threadId: string) => boolean;
  markThreadRead: (threadId: string) => void;

  // Post bookmark actions
  togglePostBookmark: (postId: string) => Promise<void>;
  isPostBookmarked: (postId: string) => boolean;

  // Vote operations
  voteThread: (threadId: string, direction: 'up' | 'down') => void;
  getThreadVote: (threadId: string) => 'up' | 'down' | null;
  votePost: (postId: string, direction: 'up' | 'down') => void;
  getPostVote: (postId: string) => 'up' | 'down' | null;

  // Profile operations
  updateUserProfile: (userId: string, updates: { avatar?: string; banner?: string }) => void;
  getUserProfile: (userId: string) => { avatar?: string; banner?: string };

  // Pagination operations
  pageSize: number;
  setPageSize: (size: number) => void;
  availablePageSizes: number[];

  // Reputation operations
  getReputationHistory: (userId: string) => ReputationEvent[];
  getCalculatedReputation: (userId: string) => number;
  getReputationChange24h: (userId: string) => number;
  awardReputation: (userId: string, action: ReputationActionType, details?: {
    threadId?: string; threadTitle?: string; postId?: string;
    triggeredBy?: string; customDescription?: string;
  }) => Promise<void>;
  markBestAnswer: (postId: string, threadId: string) => Promise<void>;
  getBestAnswerPostId: (threadId: string) => string | null;

  // Error management
  errors: Map<string, ErrorState>;
  clearError: (key: string) => void;

  // Connection status
  connectionWarning: string | null;
  dismissConnectionWarning: () => void;
}

// ============================================================================
// Context
// ============================================================================

const ForumContext = createContext<ForumContextType | null>(null);

export function useForumContext() {
  const context = useContext(ForumContext);
  if (!context) {
    throw new Error('useForumContext must be used within ForumProvider');
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

export function ForumProvider({ children }: { children: ReactNode }) {
  // --- Error management ---
  const {
    errors, setError, clearError,
    connectionWarning, setConnectionWarning, dismissConnectionWarning,
  } = useForumErrors();

  // --- User management ---
  const {
    currentUser, forumUser, setForumUser, isAuthenticated, authUserId,
    updateUserProfile, getUserProfile,
    pageSize, setPageSize, availablePageSizes,
  } = useForumUser();

  // --- Reputation ---
  // (declared early so setReputationEvents can be passed to useCategories and usePosts)
  const reputation = useReputation({
    currentUser, isAuthenticated,
    postsMap: {}, // Will be connected below via usePosts
    getThread: () => null, // Will be connected below via useCategories
    setPostsMap: () => { }, // Will be connected below
    setError,
  });

  // --- Categories & Stats ---
  const categories = useCategories({
    currentUser, isAuthenticated, authUserId, pageSize,
    setError, clearError,
    setReputationEvents: reputation.setReputationEvents,
  });

  // --- Realtime ---
  const realtime = useRealtime({
    currentUser, authUserId,
    setCategoriesState: categories.setCategoriesState,
    setPostsMap: (fn) => posts.setPostsMap(fn as any),
    setPollsMap: (fn) => polls.setPollsMap(fn as any),
    setForumUser,
    setConnectionWarning,
  });

  // --- Posts ---
  const posts = usePosts({
    currentUser, isAuthenticated, pageSize,
    setCategoriesState: categories.setCategoriesState,
    setStatsState: categories.setStatsState,
    setReputationEvents: reputation.setReputationEvents,
    subscribeToThreadPosts: realtime.subscribeToThreadPosts,
    setError, clearError,
  });

  // --- Polls ---
  const polls = usePolls({ currentUser, setError });

  // --- Voting ---
  const voting = useVoting({
    currentUser, isAuthenticated,
    setCategoriesState: categories.setCategoriesState,
    setPostsMap: posts.setPostsMap,
    setError,
  });

  // --- Watches ---
  const watches = useWatches({
    currentUser, isAuthenticated, authUserId,
    setCategoriesState: categories.setCategoriesState,
    setError,
  });

  // --- Post Bookmarks ---
  const postBookmarks = usePostBookmarks({
    isAuthenticated, authUserId,
    setError,
  });

  // --- Connect reputation to actual postsMap and getThread ---
  // Re-create reputation with correct references
  const connectedReputation = useReputation({
    currentUser, isAuthenticated,
    postsMap: posts.postsMap,
    getThread: categories.getThread,
    setPostsMap: posts.setPostsMap,
    setError,
  });

  // --- User Profile Sync ---
  // Listen for profile changes and update cached post data
  useUserProfileSync((userId, updates) => {
    // Update posts with new user data
    posts.updateUserInPosts(userId, {
      avatar: updates.avatar || undefined,
      banner: updates.banner || undefined,
      username: updates.username,
      rank: updates.rank,
      role: updates.role,
      postCount: updates.post_count,
      reputation: updates.reputation,
    });
    
    // Update threads with new user data
    categories.setCategoriesState(prev => 
      prev.map(cat => ({
        ...cat,
        threads: cat.threads?.map(thread => {
          if (thread.author.id === userId) {
            return {
              ...thread,
              author: {
                ...thread.author,
                ...(updates.avatar !== undefined && { avatar: updates.avatar || thread.author.avatar }),
                ...(updates.banner !== undefined && { banner: updates.banner || thread.author.banner }),
                ...(updates.username !== undefined && { username: updates.username }),
                ...(updates.rank !== undefined && { rank: updates.rank }),
                ...(updates.role !== undefined && { role: updates.role }),
                ...(updates.post_count !== undefined && { postCount: updates.post_count }),
                ...(updates.reputation !== undefined && { reputation: updates.reputation }),
              }
            };
          }
          if (thread.lastReplyBy.id === userId) {
            return {
              ...thread,
              lastReplyBy: {
                ...thread.lastReplyBy,
                ...(updates.avatar !== undefined && { avatar: updates.avatar || thread.lastReplyBy.avatar }),
                ...(updates.banner !== undefined && { banner: updates.banner || thread.lastReplyBy.banner }),
                ...(updates.username !== undefined && { username: updates.username }),
                ...(updates.rank !== undefined && { rank: updates.rank }),
                ...(updates.role !== undefined && { role: updates.role }),
                ...(updates.post_count !== undefined && { postCount: updates.post_count }),
                ...(updates.reputation !== undefined && { reputation: updates.reputation }),
              }
            };
          }
          return thread;
        })
      }))
    );
  });

  // --- Logout cleanup ---
  useEffect(() => {
    if (!isAuthenticated) {
      realtime.cleanupAllSubscriptions();
      posts.resetPosts();
      polls.resetPolls();
      watches.resetWatches();
      postBookmarks.resetPostBookmarks();
      voting.resetVotes();
      connectedReputation.resetReputation();
      setConnectionWarning(null);
    }
  }, [isAuthenticated]);

  // --- Create thread wrapper (pass setPollsMap) ---
  const createThreadWrapper = async (
    title: string, categoryId: string, content: string,
    tags?: string[],
    poll?: { question: string; options: string[]; isMultipleChoice: boolean; endsAt?: string },
    topicId?: string
  ) => {
    return categories.createThread(title, categoryId, content, tags, poll, polls.setPollsMap, topicId);
  };

  // --- Build context value ---
  const contextValue = useMemo<ForumContextType>(() => ({
    categories: categories.categoriesState,
    forumStats: categories.statsState,
    currentUser,
    loadingCategories: categories.loadingCategories,
    loadingStats: categories.loadingStats,
    loadingPosts: posts.loadingPosts,
    getThread: categories.getThread,
    getCategory: categories.getCategory,
    getCategoryForThread: categories.getCategoryForThread,
    getAllThreads: categories.getAllThreads,
    loadMoreThreads: categories.loadMoreThreads,
    hasMoreThreads: categories.hasMoreThreads,
    createThread: createThreadWrapper,
    getPostsForThread: posts.getPostsForThread,
    prefetchPosts: posts.prefetchPosts,
    loadMorePosts: posts.loadMorePosts,
    hasMorePosts: posts.hasMorePosts,
    unsubscribeFromThreadPosts: realtime.unsubscribeFromThreadPosts,
    addPost: posts.addPost,
    editPost: posts.editPost,
    deletePost: posts.deletePost,
    togglePostLike: posts.togglePostLike,
    togglePostReaction: posts.togglePostReaction,
    getPollForThread: polls.getPollForThread,
    votePoll: polls.votePoll,
    toggleWatch: watches.toggleWatch,
    isWatching: watches.isWatching,
    markThreadRead: watches.markThreadRead,
    togglePostBookmark: postBookmarks.togglePostBookmark,
    isPostBookmarked: postBookmarks.isPostBookmarked,
    voteThread: voting.voteThread,
    getThreadVote: voting.getThreadVote,
    votePost: voting.votePost,
    getPostVote: voting.getPostVote,
    updateUserProfile,
    getUserProfile,
    pageSize,
    setPageSize,
    availablePageSizes,
    getReputationHistory: connectedReputation.getReputationHistory,
    getCalculatedReputation: connectedReputation.getCalculatedReputation,
    getReputationChange24h: connectedReputation.getReputationChange24h,
    awardReputation: connectedReputation.awardReputation,
    markBestAnswer: connectedReputation.markBestAnswer,
    getBestAnswerPostId: connectedReputation.getBestAnswerPostId,
    errors,
    clearError,
    connectionWarning,
    dismissConnectionWarning,
  }), [
    categories.categoriesState, categories.statsState, currentUser,
    categories.loadingCategories, categories.loadingStats, posts.loadingPosts,
    categories.getThread, categories.getCategory, categories.getCategoryForThread, categories.getAllThreads,
    categories.loadMoreThreads, categories.hasMoreThreads, createThreadWrapper,
    posts.getPostsForThread, posts.prefetchPosts, posts.loadMorePosts, posts.hasMorePosts,
    realtime.unsubscribeFromThreadPosts,
    posts.addPost, posts.editPost, posts.deletePost, posts.togglePostLike, posts.togglePostReaction,
    polls.getPollForThread, polls.votePoll,
    watches.toggleWatch, watches.isWatching, watches.markThreadRead,
    postBookmarks.togglePostBookmark, postBookmarks.isPostBookmarked,
    voting.voteThread, voting.getThreadVote, voting.votePost, voting.getPostVote,
    updateUserProfile, getUserProfile, pageSize, setPageSize,
    connectedReputation.getReputationHistory, connectedReputation.getCalculatedReputation,
    connectedReputation.getReputationChange24h, connectedReputation.awardReputation,
    connectedReputation.markBestAnswer, connectedReputation.getBestAnswerPostId,
    errors, clearError, connectionWarning, dismissConnectionWarning,
  ]);

  return (
    <ForumContext.Provider value={contextValue}>
      {children}
    </ForumContext.Provider>
  );
}