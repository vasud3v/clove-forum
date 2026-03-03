// ============================================================================
// Role System
// ============================================================================

export type UserRole = 'admin' | 'super_moderator' | 'moderator' | 'member' | 'restricted';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  super_moderator: 80,
  moderator: 60,
  member: 20,
  restricted: 0,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  super_moderator: 'Super Moderator',
  moderator: 'Moderator',
  member: 'Member',
  restricted: 'Restricted',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'text-red-600',
  super_moderator: 'text-orange-700',
  moderator: 'text-blue-600',
  member: 'text-forum-muted',
  restricted: 'text-gray-500',
};

export const ROLE_BG_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-500/10 border-red-500/30',
  super_moderator: 'bg-orange-500/10 border-orange-500/30',
  moderator: 'bg-blue-500/10 border-blue-500/30',
  member: 'bg-forum-hover border-forum-border/30',
  restricted: 'bg-gray-500/10 border-gray-500/30',
};

// ============================================================================
// Core Entities
// ============================================================================

export interface User {
  id: string;
  username: string;
  avatar: string;
  banner?: string;
  postCount: number;
  reputation: number;
  joinDate: string;
  isOnline: boolean;
  rank?: string;
  role: UserRole;
  isBanned?: boolean;
  banReason?: string;
  banExpiresAt?: string;
  followerCount?: number;
  followingCount?: number;
  isPrivate?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  excerpt?: string;
  author: User;
  categoryId: string;
  topicId?: string;
  createdAt: string;
  lastReplyAt: string;
  lastReplyBy: User;
  replyCount: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isHot: boolean;
  hasUnread: boolean;
  tags?: string[];
  isStaffOnly?: boolean;
  isFeatured?: boolean;
  isArchived?: boolean;
  trendingScore?: number;
  upvotes: number;
  downvotes: number;
  banner?: string;
  thumbnail?: string; // Thread-specific avatar/thumbnail
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  threadCount: number;
  postCount: number;
  lastActivity: string;
  lastPostBy?: string;
  latestThreadId?: string;
  latestThreadTitle?: string;
  latestThreadAuthor?: string;
  latestThreadAuthorAvatar?: string;
  lastPostAvatar?: string;
  icon?: string;
  badge?: string;
  lastPostAvatar?: string;
  badges?: Array<{
    label: string;
    type: 'news' | 'request' | 'instagram' | 'cam' | 'default';
  }>;
  subLinks?: Array<{
    label: string;
    icon?: string;
  }>;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  threadCount: number;
  postCount: number;
  lastActivity: string;
  threads: Thread[];
  topics?: Topic[];
  isSticky?: boolean;
  isImportant?: boolean;
}

export interface ForumStats {
  totalThreads: number;
  totalPosts: number;
  totalUsers: number;
  activeUsers: number;
  newPostsToday: number;
  newestMember: string;
  onlineUsers: number;
}

// ============================================================================
// Post Types
// ============================================================================

export interface Reaction {
  emoji: string;
  label: string;
  count: number;
  reacted: boolean;
}

export interface PostData {
  id: string;
  threadId: string;
  content: string;
  author: User;
  createdAt: string;
  likes: number;
  isAnswer: boolean;
  replyTo?: string;
  reactions: Reaction[];
  editedAt?: string;
  signature?: string;
  upvotes: number;
  downvotes: number;
  version?: number;
  lastEditReason?: string;
  wordCount?: number;
  readTimeMinutes?: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollData {
  question: string;
  options: PollOption[];
  totalVotes: number;
  endsAt: string;
  isMultipleChoice: boolean;
  hasVoted: boolean;
  votedOptionIds: string[];
}

// ============================================================================
// Error Types
// ============================================================================

export interface ErrorState {
  message: string;
  code: string;
  timestamp: number;
  operation: string;
}

// ============================================================================
// Reputation System
// ============================================================================

export type ReputationActionType =
  | 'post_upvoted'
  | 'post_downvoted'
  | 'best_answer'
  | 'thread_created'
  | 'helpful_post'
  | 'reaction_received'
  | 'post_created'
  | 'milestone_bonus'
  | 'streak_bonus';

export interface ReputationEvent {
  id: string;
  userId: string;
  action: ReputationActionType;
  points: number;
  description: string;
  threadId?: string;
  threadTitle?: string;
  postId?: string;
  triggeredBy?: string;
  createdAt: string;
}

export const REPUTATION_POINTS: Record<ReputationActionType, number> = {
  post_upvoted: 10,
  post_downvoted: -2,
  best_answer: 50,
  thread_created: 5,
  helpful_post: 15,
  reaction_received: 3,
  post_created: 2,
  milestone_bonus: 100,
  streak_bonus: 25,
};

export const REPUTATION_ACTION_DESCRIPTIONS: Record<ReputationActionType, string> = {
  post_upvoted: 'Post received an upvote',
  post_downvoted: 'Post received a downvote',
  best_answer: 'Post marked as best answer',
  thread_created: 'Created a new thread',
  helpful_post: 'Posted a helpful reply',
  reaction_received: 'Received a reaction',
  post_created: 'Posted a reply',
  milestone_bonus: 'Reached a milestone',
  streak_bonus: 'Maintained an activity streak',
};

// ============================================================================
// Moderation Types
// ============================================================================

export type ReportReason = 'spam' | 'harassment' | 'off_topic' | 'inappropriate' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ContentReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  targetType: 'thread' | 'post';
  targetId: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  resolvedBy?: string;
  resolvedAt?: string;
  actionTaken?: string;
  createdAt: string;
  // Joined data
  targetTitle?: string;
  targetContent?: string;
  targetAuthorName?: string;
}

export type ModActionType =
  | 'thread_pin'
  | 'thread_unpin'
  | 'thread_lock'
  | 'thread_unlock'
  | 'thread_delete'
  | 'thread_move'
  | 'thread_merge'
  | 'thread_feature'
  | 'thread_unfeature'
  | 'thread_archive'
  | 'thread_create'
  | 'post_delete'
  | 'post_edit'
  | 'user_ban'
  | 'user_unban'
  | 'user_warn'
  | 'user_role_change'
  | 'user_restrict'
  | 'category_create'
  | 'category_edit'
  | 'category_delete'
  | 'category_reorder'
  | 'report_resolve'
  | 'report_dismiss';

export interface ModerationLog {
  id: string;
  moderatorId: string;
  moderatorName?: string;
  action: ModActionType;
  targetType: 'thread' | 'post' | 'user' | 'category' | 'report';
  targetId: string;
  targetUserId?: string;
  targetUserName?: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface UserWarning {
  id: string;
  userId: string;
  userName?: string;
  issuedBy: string;
  issuedByName?: string;
  reason: string;
  points: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

// ============================================================================
// Sort & Filter
// ============================================================================

export type SortOption = 'latest' | 'views' | 'replies';
export type FilterOption = 'all' | 'trending' | 'unanswered' | 'my-threads';

// ============================================================================
// Threaded Replies (Phase 5)
// ============================================================================

export interface ThreadedPost {
  post: PostData;
  children: ThreadedPost[];
  depth: number;
}

export type ThreadViewMode = 'flat' | 'threaded';
