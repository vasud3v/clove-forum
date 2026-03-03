import {
  Crown,
  ShieldCheck,
  Gem,
  Cog,
  Zap,
  User,
  Shield,
  Sparkles,
  Code2,
  Star,
} from 'lucide-react';
import { createElement } from 'react';

// ============================================================================
// Time Formatting
// ============================================================================

export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDaysLeft(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / (24 * 3600000));
  const hours = Math.floor((diff % (24 * 3600000)) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

// ============================================================================
// Rank Utilities
// ============================================================================

export type RankType = 'Administrator' | 'Moderator' | 'Elite Hacker' | 'Senior Dev' | 'Code Ninja';

const RANK_COLOR_MAP: Record<string, string> = {
  'Administrator': 'text-red-600 bg-gradient-to-r from-red-500/15 to-red-500/5 border-red-500/40 badge-glow-red',
  'Moderator': 'text-black bg-gradient-to-r from-purple-600/40 to-purple-600/20 border-purple-600 badge-glow-purple',
  'Elite Hacker': 'text-black bg-gradient-to-r from-primary/40 to-primary/20 border-primary badge-glow-pink',
  'Senior Dev': 'text-black bg-gradient-to-r from-cyan-600/40 to-cyan-600/20 border-cyan-600 badge-glow-cyan',
  'Code Ninja': 'text-black bg-gradient-to-r from-emerald-600/40 to-emerald-600/20 border-emerald-600 badge-glow-emerald',
};

const RANK_COLOR_COMPACT_MAP: Record<string, string> = {
  'Administrator': 'text-red-600 bg-red-500/10 border-red-500/30',
  'Moderator': 'text-black bg-purple-600/40 border-purple-600',
  'Elite Hacker': 'text-black bg-primary/40 border-primary',
  'Senior Dev': 'text-black bg-cyan-600/40 border-cyan-600',
  'Code Ninja': 'text-black bg-emerald-600/40 border-emerald-600',
};

export function getRankColor(rank?: string): string {
  return RANK_COLOR_MAP[rank || ''] || 'text-forum-muted bg-forum-hover border-forum-border';
}

export function getRankColorCompact(rank?: string): string {
  return RANK_COLOR_COMPACT_MAP[rank || ''] || 'text-forum-muted bg-forum-hover border-forum-border/40';
}

// Icon components for each rank at different sizes
const RANK_ICON_MAP: Record<string, typeof Crown> = {
  'Administrator': Crown,
  'Moderator': ShieldCheck,
  'Elite Hacker': Gem,
  'Senior Dev': Cog,
  'Code Ninja': Zap,
};

// Compact rank icon map (used in PostCard author sidebar)
const RANK_ICON_COMPACT_MAP: Record<string, typeof Shield> = {
  'Administrator': Shield,
  'Moderator': ShieldCheck,
  'Elite Hacker': Sparkles,
  'Senior Dev': Code2,
  'Code Ninja': Crown,
};

export function getRankIcon(rank?: string, size: number = 8) {
  const IconComponent = RANK_ICON_MAP[rank || ''] || User;
  return createElement(IconComponent, { size });
}

export function getRankIconCompact(rank?: string, size: number = 10) {
  const IconComponent = RANK_ICON_COMPACT_MAP[rank || ''] || Star;
  return createElement(IconComponent, { size });
}

// ============================================================================
// Vote Score Utilities
// ============================================================================

export function getVoteScoreColor(score: number): string {
  if (score > 0) return 'text-forum-pink';
  if (score < 0) return 'text-red-600';
  return 'text-forum-text/80';
}

export function formatVoteScore(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

// ============================================================================
// Reputation Utilities
// ============================================================================

export function getReputationColor(reputation: number): string {
  if (reputation > 0) return 'text-black bg-emerald-600/40 border-emerald-600';
  if (reputation < 0) return 'text-red-600 bg-red-500/10 border-red-500/30';
  return 'text-forum-muted bg-forum-hover border-forum-border/40';
}

export function formatReputation(reputation: number): string {
  return reputation > 0 ? `+${reputation}` : `${reputation}`;
}

// ============================================================================
// Text Utilities
// ============================================================================

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}
