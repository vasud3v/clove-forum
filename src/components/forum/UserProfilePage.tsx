import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ForumHeader from '@/components/forum/ForumHeader';
import SidebarStatsPanel from '@/components/forum/SidebarStatsPanel';
import OnlineUsers from '@/components/forum/OnlineUsers';
import PopularTags from '@/components/forum/PopularTags';
import NewThreadModal from '@/components/forum/NewThreadModal';
import EditProfileModal from '@/components/forum/EditProfileModal';
import ImageAdjustModal from '@/components/forum/ImageAdjustModal';
import { useForumContext } from '@/context/ForumContext';
import { ReputationEvent, ReputationActionType } from '@/types/forum';
import { supabase } from '@/lib/supabase';
import { getUserAvatar } from '@/lib/avatar';
import { User } from '@/types/forum';
import { FollowButton } from './FollowButton';
import {
  Home as HomeIcon,
  ChevronRight,
  MessageSquare,
  Eye,
  Clock,
  Award,
  Crown,
  ShieldCheck,
  Code2,
  Sparkles,
  Zap,
  Star,
  Trophy,
  Target,
  ThumbsUp,
  Calendar,
  MapPin,
  Globe,
  Edit3,
  Check,
  BarChart3,
  TrendingUp,
  BookOpen,
  Users,
  ArrowUpRight,
  Gem,
  Camera,
  Image as ImageIcon,
  X,
} from 'lucide-react';

// Extended user profile data
interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
}

interface ReputationBreakdown {
  category: string;
  points: number;
  color: string;
}

const getReputationBreakdown = (events: ReputationEvent[]): ReputationBreakdown[] => {
  const categoryMap: Record<string, { points: number; color: string }> = {
    'Upvotes Received': { points: 0, color: '#FF2D92' },
    'Best Answers': { points: 0, color: '#22d3ee' },
    'Helpful Posts': { points: 0, color: '#a855f7' },
    'Thread Creation': { points: 0, color: '#10b981' },
    'Reactions': { points: 0, color: '#f59e0b' },
    'Posts & Replies': { points: 0, color: '#6366f1' },
    'Streaks & Milestones': { points: 0, color: '#ec4899' },
  };

  const actionToCategory: Record<ReputationActionType, string> = {
    post_upvoted: 'Upvotes Received',
    post_downvoted: 'Upvotes Received',
    best_answer: 'Best Answers',
    helpful_post: 'Helpful Posts',
    thread_created: 'Thread Creation',
    reaction_received: 'Reactions',
    post_created: 'Posts & Replies',
    milestone_bonus: 'Streaks & Milestones',
    streak_bonus: 'Streaks & Milestones',
  };

  for (const event of events) {
    const category = actionToCategory[event.action];
    if (category && categoryMap[category]) {
      categoryMap[category].points += event.points;
    }
  }

  return Object.entries(categoryMap)
    .map(([category, { points, color }]) => ({ category, points: Math.max(0, points), color }))
    .filter(item => item.points > 0)
    .sort((a, b) => b.points - a.points);
};

type ProfileTab = 'posts' | 'threads' | 'badges' | 'reputation';

const getActionIcon = (action: ReputationActionType) => {
  switch (action) {
    case 'post_upvoted':
      return <ThumbsUp size={9} className="text-emerald-400" />;
    case 'post_downvoted':
      return <ThumbsUp size={9} className="text-red-400 rotate-180" />;
    case 'best_answer':
      return <Award size={9} className="text-cyan-400" />;
    case 'thread_created':
      return <BookOpen size={9} className="text-purple-400" />;
    case 'helpful_post':
      return <Star size={9} className="text-forum-pink" />;
    case 'reaction_received':
      return <Sparkles size={9} className="text-amber-400" />;
    case 'post_created':
      return <MessageSquare size={9} className="text-forum-muted" />;
    case 'milestone_bonus':
      return <Trophy size={9} className="text-forum-pink" />;
    case 'streak_bonus':
      return <Zap size={9} className="text-forum-pink" />;
    default:
      return <Star size={9} className="text-forum-muted" />;
  }
};

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { categories, forumStats, currentUser, getAllThreads, updateUserProfile, getUserProfile, getReputationHistory, getCalculatedReputation, getReputationChange24h } = useForumContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [imageAdjustModal, setImageAdjustModal] = useState<{ isOpen: boolean; imageUrl: string; type: 'avatar' | 'banner' }>({
    isOpen: false,
    imageUrl: '',
    type: 'avatar',
  });
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user from Supabase
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('forum_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUser({
          id: data.id,
          username: data.username,
          avatar: data.avatar,
          banner: data.banner,
          postCount: data.post_count,
          reputation: data.reputation,
          joinDate: data.join_date,
          isOnline: data.is_online,
          rank: data.rank,
          role: data.role || 'member',
          followerCount: data.follower_count || 0,
          followingCount: data.following_count || 0,
          isPrivate: data.is_private || false,
        });
      } else {
        console.error('Error fetching user:', error);
      }
      setLoading(false);
    };

    fetchUser();

    // Subscribe to real-time updates for this user
    if (!userId) return;

    const channel = supabase
      .channel(`user-profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'forum_users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('[UserProfilePage] User update received:', payload);
          if (payload.new) {
            const updated = payload.new;
            setUser((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                username: updated.username,
                avatar: updated.avatar,
                banner: updated.banner,
                postCount: updated.post_count,
                reputation: updated.reputation,
                isOnline: updated.is_online,
                rank: updated.rank,
                followerCount: updated.follower_count || 0,
                followingCount: updated.following_count || 0,
                isPrivate: updated.is_private || false,
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const isOwnProfile = user?.id === currentUser.id;

  const allThreads = useMemo(() => getAllThreads(), [getAllThreads]);
  const userThreads = useMemo(
    () => allThreads.filter((t) => t.author.id === userId),
    [allThreads, userId]
  );
  const userRepliedThreads = useMemo(
    () => allThreads.filter((t) => t.lastReplyBy.id === userId && t.author.id !== userId),
    [allThreads, userId]
  );

  const userBadges = useMemo(() => {
    // TODO: Fetch badges from Supabase when badge system is implemented
    return [];
  }, [userId]);

  const repHistory = useMemo(() => {
    if (!userId) return [];
    return getReputationHistory(userId);
  }, [userId, getReputationHistory]);

  const calculatedRep = useMemo(() => {
    if (!userId) return 0;
    return getCalculatedReputation(userId);
  }, [userId, getCalculatedReputation]);

  const repChange24h = useMemo(() => {
    if (!userId) return 0;
    return getReputationChange24h(userId);
  }, [userId, getReputationChange24h]);

  const reputationBreakdown = useMemo(() => {
    return getReputationBreakdown(repHistory);
  }, [repHistory]);

  const profileCustom = useMemo(() => {
    if (!userId) return {};
    return getUserProfile(userId);
  }, [userId, getUserProfile]);

  // Avatar and banner are now stored directly in forum_users table
  // No need to fetch from profile_customizations

  const currentAvatar = profileCustom.avatar || user?.avatar || '';
  const currentBanner = profileCustom.banner || user?.banner || '';

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'banner'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, GIF, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Open the adjust modal instead of directly saving
      setImageAdjustModal({
        isOpen: true,
        imageUrl: dataUrl,
        type: type,
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleImageAdjustSave = async (adjustedImageUrl: string) => {
    if (!userId) return;
    
    try {
      // Upload to Supabase Storage instead of storing data URL
      const { uploadAvatar } = await import('@/lib/avatarUpload');
      const publicUrl = await uploadAvatar(userId, adjustedImageUrl, imageAdjustModal.type);
      
      // Update user profile with storage URL
      updateUserProfile(userId, { [imageAdjustModal.type]: publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleRemoveBanner = () => {
    if (!userId) return;
    updateUserProfile(userId, { banner: '' });
  };

  const handleRemoveAvatar = () => {
    if (!userId) return;
    updateUserProfile(userId, { avatar: '' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeAgo = (dateStr: string) => {
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
  };

  const getRankIcon = (rank?: string) => {
    switch (rank) {
      case 'Administrator': return <Crown size={12} className="text-red-400" />;
      case 'Moderator': return <ShieldCheck size={12} className="text-purple-400" />;
      case 'Elite Hacker': return <Zap size={12} className="text-forum-pink" />;
      case 'Senior Dev': return <Code2 size={12} className="text-cyan-400" />;
      case 'Code Ninja': return <Sparkles size={12} className="text-emerald-400" />;
      default: return <Star size={12} className="text-forum-muted" />;
    }
  };

  const getRankColor = (rank?: string) => {
    switch (rank) {
      case 'Administrator': return 'text-red-400 border-red-500/40 bg-red-500/10';
      case 'Moderator': return 'text-purple-400 border-purple-500/40 bg-purple-500/10';
      case 'Elite Hacker': return 'text-forum-pink border-forum-pink/40 bg-forum-pink/10';
      case 'Senior Dev': return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
      case 'Code Ninja': return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
      default: return 'text-forum-muted border-forum-border bg-forum-hover';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500/30 bg-gray-500/10 text-gray-400';
      case 'uncommon': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
      case 'rare': return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
      case 'epic': return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
      case 'legendary': return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
      default: return 'border-forum-border bg-forum-hover text-forum-muted';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '0 0 20px rgba(245, 158, 11, 0.3)';
      case 'epic': return '0 0 15px rgba(168, 85, 247, 0.25)';
      case 'rare': return '0 0 12px rgba(59, 130, 246, 0.2)';
      default: return 'none';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forum-bg">
        <ForumHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-6 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forum-pink mb-4"></div>
          <p className="text-[12px] text-forum-muted font-mono">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-forum-bg">
        <ForumHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-6 flex flex-col items-center">
          <Users size={48} className="text-forum-pink mb-4" />
          <h2 className="text-[16px] font-bold text-forum-text font-mono mb-2">User Not Found</h2>
          <p className="text-[12px] text-forum-muted font-mono mb-4">The profile you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded bg-forum-pink/10 border border-forum-pink/30 text-forum-pink text-[11px] font-mono font-bold hover:bg-forum-pink/20 transition-forum"
          >
            Back to Forums
          </button>
        </div>
      </div>
    );
  }

  const handleProfileUpdateSuccess = async () => {
    // Refresh user data after profile update
    if (!userId) return;
    
    const { data, error } = await supabase
      .from('forum_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUser({
        id: data.id,
        username: data.username,
        avatar: data.avatar,
        banner: data.banner,
        postCount: data.post_count,
        reputation: data.reputation,
        joinDate: data.join_date,
        isOnline: data.is_online,
        rank: data.rank,
        role: data.role || 'member',
        followerCount: data.follower_count || 0,
        followingCount: data.following_count || 0,
        isPrivate: data.is_private || false,
      });
    }
  };

  const totalRepPoints = reputationBreakdown.reduce((sum, r) => sum + r.points, 0);

  return (
    <div className="min-h-screen bg-forum-bg">
      <ForumHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-4 pb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted">
          <HomeIcon size={11} className="text-forum-pink" />
          <span
            className="text-forum-text hover:text-forum-pink transition-forum cursor-pointer"
            onClick={() => navigate('/')}
          >
            Forums
          </span>
          <ChevronRight size={10} />
          <span className="text-forum-text hover:text-forum-pink transition-forum cursor-pointer">
            Members
          </span>
          <ChevronRight size={10} />
          <span className="text-forum-muted">{user.username}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Profile Banner Card */}
            <div className="hud-panel overflow-hidden">
              {/* Banner */}
              <div className="relative h-32 overflow-hidden group/banner">
                {currentBanner ? (
                  <img
                    src={currentBanner}
                    alt="Profile banner"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-forum-pink/20 via-forum-card to-forum-pink/5" />
                    <div
                      className="absolute inset-0 opacity-[0.03]"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,45,146,0.2) 3px, rgba(255,45,146,0.2) 4px)',
                      }}
                    />
                    {/* Grid overlay */}
                    <div
                      className="absolute inset-0 opacity-[0.02]"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,45,146,0.3) 40px, rgba(255,45,146,0.3) 41px), repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,45,146,0.3) 40px, rgba(255,45,146,0.3) 41px)',
                      }}
                    />
                  </>
                )}
                {/* Banner darkening overlay when has image */}
                {currentBanner && (
                  <div className="absolute inset-0 bg-gradient-to-t from-forum-card/80 via-transparent to-transparent" />
                )}

                {/* Banner upload controls (visible on hover for own profile) */}
                {isOwnProfile && (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-forum-bg/40 opacity-0 group-hover/banner:opacity-100 transition-all duration-250 backdrop-blur-[2px]">
                    <button
                      onClick={() => bannerInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-forum-bg/80 border border-forum-pink/40 text-[10px] font-mono font-bold text-forum-pink hover:bg-forum-pink/20 transition-forum"
                    >
                      <ImageIcon size={12} />
                      {currentBanner ? 'Change Banner' : 'Upload Banner'}
                    </button>
                    {currentBanner && (
                      <button
                        onClick={handleRemoveBanner}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-forum-bg/80 border border-red-500/40 text-[10px] font-mono font-bold text-red-400 hover:bg-red-500/20 transition-forum"
                      >
                        <X size={12} />
                        Remove
                      </button>
                    )}
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'banner')}
                    />
                  </div>
                )}

                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditProfileModalOpen(true)}
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded bg-forum-bg/80 border border-forum-pink/30 text-[10px] font-mono font-bold text-forum-pink hover:bg-forum-pink/10 transition-forum backdrop-blur-sm z-10"
                  >
                    <Edit3 size={11} />
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Profile info */}
              <div className="px-6 pb-5 -mt-12 relative z-10">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 group/avatar">
                    <img
                      src={currentAvatar}
                      alt={user.username}
                      className="h-24 w-24 rounded-lg border-3 border-forum-pink/40 object-cover shadow-pink-glow"
                      style={{ borderWidth: '3px' }}
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-3 ${user.isOnline ? 'bg-emerald-400' : 'bg-forum-muted/50'
                        }`}
                      style={{ borderWidth: '3px', borderColor: '#0d0d12' }}
                    />
                    {/* Avatar upload overlay (visible on hover for own profile) */}
                    {isOwnProfile && (
                      <>
                        <div
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute inset-0 rounded-lg flex flex-col items-center justify-center bg-forum-bg/60 opacity-0 group-hover/avatar:opacity-100 transition-all duration-250 cursor-pointer backdrop-blur-[2px]"
                          style={{ borderWidth: '3px', borderColor: 'transparent' }}
                        >
                          <Camera size={18} className="text-forum-pink mb-1" />
                          <span className="text-[8px] font-mono font-bold text-forum-pink">Change</span>
                        </div>
                        {profileCustom.avatar && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAvatar();
                            }}
                            className="absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full bg-red-500/90 border border-red-400 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-250 hover:bg-red-500 z-20"
                          >
                            <X size={10} className="text-white" />
                          </button>
                        )}
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'avatar')}
                        />
                      </>
                    )}
                  </div>

                  {/* Name & details */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-[20px] font-bold text-forum-text font-mono">
                        {user.username}
                      </h1>
                      {user.rank && (
                        <span
                          className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${getRankColor(user.rank)}`}
                        >
                          {getRankIcon(user.rank)}
                          {user.rank}
                        </span>
                      )}
                      {user.isOnline && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Online
                        </span>
                      )}
                    </div>

                    {/* Bio */}
                    <div className="mt-2">
                      <p className="text-[11px] font-mono text-forum-muted leading-relaxed max-w-2xl">
                        {/* TODO: Fetch bio from Supabase user profile when implemented */}
                        No bio yet.
                      </p>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="flex items-center gap-1 text-[10px] font-mono text-forum-muted">
                        <Calendar size={10} className="text-forum-pink/60" />
                        Joined {formatDate(user.joinDate)}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-mono text-forum-muted">
                        <Users size={10} className="text-forum-pink/60" />
                        {user.followerCount || 0} followers · {user.followingCount || 0} following
                      </span>
                      {/* TODO: Add location and website fields to Supabase user profile */}
                    </div>

                    {/* Follow Button */}
                    {!isOwnProfile && (
                      <div className="mt-4">
                        <FollowButton
                          targetUserId={user.id}
                          currentUserId={currentUser.id}
                          showMessageButton={true}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
                  {[
                    { label: 'Posts', value: user.postCount.toLocaleString(), icon: MessageSquare, color: 'text-forum-pink' },
                    { label: 'Reputation', value: calculatedRep.toLocaleString(), icon: TrendingUp, color: 'text-cyan-400' },
                    { label: 'Threads', value: userThreads.length.toString(), icon: BookOpen, color: 'text-purple-400' },
                    { label: 'Followers', value: (user.followerCount || 0).toString(), icon: Users, color: 'text-emerald-400' },
                    { label: 'Following', value: (user.followingCount || 0).toString(), icon: Users, color: 'text-blue-400' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-forum-bg/60 border border-forum-border rounded px-3 py-2.5 text-center"
                    >
                      <stat.icon size={14} className={`${stat.color} mx-auto mb-1`} />
                      <div className="text-[14px] font-bold text-forum-text font-mono">{stat.value}</div>
                      <div className="text-[8px] text-forum-muted font-mono uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="hud-panel">
              <div className="flex border-b border-forum-border">
                {(
                  [
                    { id: 'posts' as ProfileTab, label: 'Recent Activity', icon: Clock },
                    { id: 'threads' as ProfileTab, label: 'Threads', icon: MessageSquare },
                    { id: 'badges' as ProfileTab, label: 'Badges', icon: Award },
                    { id: 'reputation' as ProfileTab, label: 'Reputation', icon: BarChart3 },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-[11px] font-mono font-bold transition-forum border-b-2 ${activeTab === tab.id
                      ? 'text-forum-pink border-forum-pink bg-forum-pink/5'
                      : 'text-forum-muted border-transparent hover:text-forum-text hover:bg-forum-hover'
                      }`}
                  >
                    <tab.icon size={12} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {/* Recent Activity Tab */}
                {activeTab === 'posts' && (
                  <div className="space-y-2">
                    {[...userThreads, ...userRepliedThreads]
                      .sort(
                        (a, b) =>
                          new Date(b.lastReplyAt).getTime() - new Date(a.lastReplyAt).getTime()
                      )
                      .slice(0, 15)
                      .map((thread) => (
                        <div
                          key={thread.id}
                          onClick={() => navigate(`/thread/${thread.id}`)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded border border-transparent hover:border-forum-pink/10 hover:bg-forum-hover cursor-pointer transition-forum group"
                        >
                          <div className="flex-shrink-0">
                            {thread.author.id === userId ? (
                              <img
                                src={profileCustom.avatar || thread.author.avatar}
                                alt={thread.author.username}
                                className="h-8 w-8 rounded object-cover border border-forum-border"
                              />
                            ) : (
                              <img
                                src={getUserProfile(thread.author.id).avatar || thread.author.avatar}
                                alt={thread.author.username}
                                className="h-8 w-8 rounded object-cover border border-forum-border"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-mono text-forum-text group-hover:text-forum-pink transition-forum truncate">
                              {thread.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-mono text-forum-muted">
                                {thread.author.id === userId ? 'Created thread' : 'Replied'}
                              </span>
                              <span className="text-[9px] font-mono text-forum-muted/50">•</span>
                              <span className="text-[9px] font-mono text-forum-muted">
                                {formatTimeAgo(thread.lastReplyAt)}
                              </span>
                              <span className="text-[9px] font-mono text-forum-muted/50">•</span>
                              <span className="flex items-center gap-0.5 text-[9px] font-mono text-forum-muted">
                                <MessageSquare size={8} /> {thread.replyCount}
                              </span>
                              <span className="flex items-center gap-0.5 text-[9px] font-mono text-forum-muted">
                                <Eye size={8} /> {thread.viewCount}
                              </span>
                            </div>
                          </div>
                          <ArrowUpRight
                            size={12}
                            className="text-forum-muted/30 group-hover:text-forum-pink transition-forum flex-shrink-0"
                          />
                        </div>
                      ))}
                    {userThreads.length === 0 && userRepliedThreads.length === 0 && (
                      <div className="text-center py-12">
                        <Clock size={32} className="text-forum-muted/30 mx-auto mb-3" />
                        <p className="text-[12px] font-mono text-forum-muted">No recent activity</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Threads Tab */}
                {activeTab === 'threads' && (
                  <div className="space-y-2">
                    {userThreads.length > 0 ? (
                      userThreads
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        )
                        .map((thread) => (
                          <div
                            key={thread.id}
                            onClick={() => navigate(`/thread/${thread.id}`)}
                            className="flex items-start gap-3 px-3 py-3 rounded border border-transparent hover:border-forum-pink/10 hover:bg-forum-hover cursor-pointer transition-forum group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[12px] font-mono font-bold text-forum-text group-hover:text-forum-pink transition-forum truncate">
                                  {thread.title}
                                </span>
                                {thread.isPinned && (
                                  <span className="text-[8px] font-mono text-amber-400 border border-amber-500/30 bg-amber-500/10 px-1.5 rounded">
                                    PINNED
                                  </span>
                                )}
                                {thread.isHot && (
                                  <span className="text-[8px] font-mono text-orange-400 border border-orange-500/30 bg-orange-500/10 px-1.5 rounded">
                                    🔥 HOT
                                  </span>
                                )}
                                {thread.isLocked && (
                                  <span className="text-[8px] font-mono text-forum-muted border border-forum-border bg-forum-hover px-1.5 rounded">
                                    LOCKED
                                  </span>
                                )}
                              </div>
                              {thread.excerpt && (
                                <p className="text-[10px] font-mono text-forum-muted mt-1 line-clamp-1">
                                  {thread.excerpt}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[9px] font-mono text-forum-muted">
                                  {formatTimeAgo(thread.createdAt)}
                                </span>
                                <span className="flex items-center gap-0.5 text-[9px] font-mono text-forum-muted">
                                  <MessageSquare size={8} /> {thread.replyCount} replies
                                </span>
                                <span className="flex items-center gap-0.5 text-[9px] font-mono text-forum-muted">
                                  <Eye size={8} /> {thread.viewCount} views
                                </span>
                                <span className="flex items-center gap-0.5 text-[9px] font-mono text-forum-pink">
                                  <ThumbsUp size={8} /> {thread.upvotes - thread.downvotes}
                                </span>
                              </div>
                            </div>
                            <ArrowUpRight
                              size={12}
                              className="text-forum-muted/30 group-hover:text-forum-pink transition-forum mt-1 flex-shrink-0"
                            />
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-12">
                        <MessageSquare size={32} className="text-forum-muted/30 mx-auto mb-3" />
                        <p className="text-[12px] font-mono text-forum-muted">No threads created yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Badges Tab */}
                {activeTab === 'badges' && (
                  <div>
                    {/* Badge rarity legend */}
                    <div className="flex items-center gap-3 mb-4 px-1">
                      {['common', 'uncommon', 'rare', 'epic', 'legendary'].map((rarity) => (
                        <span
                          key={rarity}
                          className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${getRarityColor(rarity)}`}
                        >
                          {rarity}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {userBadges.map((badge) => (
                        <div
                          key={badge.id}
                          className={`rounded border p-3 text-center transition-forum hover:scale-[1.02] ${getRarityColor(badge.rarity)}`}
                          style={{ boxShadow: getRarityGlow(badge.rarity) }}
                        >
                          <div className="text-2xl mb-1.5">{badge.icon}</div>
                          <div className="text-[10px] font-mono font-bold text-forum-text mb-0.5">
                            {badge.name}
                          </div>
                          <div className="text-[8px] font-mono text-forum-muted leading-relaxed mb-2">
                            {badge.description}
                          </div>
                          <div className="text-[7px] font-mono text-forum-muted/50 uppercase tracking-wider">
                            {formatDate(badge.earnedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reputation Tab */}
                {activeTab === 'reputation' && (
                  <div className="space-y-6">
                    {/* Total reputation with 24h change */}
                    <div className="text-center py-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Trophy size={20} className="text-forum-pink" />
                        <span className="text-[28px] font-bold text-forum-text font-mono">
                          {calculatedRep.toLocaleString()}
                        </span>
                        {repChange24h !== 0 && (
                          <span
                            className={`flex items-center gap-0.5 text-[12px] font-mono font-bold px-2 py-0.5 rounded border ${repChange24h > 0
                              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                              : 'text-red-400 border-red-500/30 bg-red-500/10'
                              }`}
                          >
                            <TrendingUp size={11} className={repChange24h < 0 ? 'rotate-180' : ''} />
                            {repChange24h > 0 ? '+' : ''}{repChange24h}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-forum-muted">
                        Total Reputation Points
                        {repChange24h > 0 && (
                          <span className="text-emerald-400 ml-1">• +{repChange24h} in last 24h</span>
                        )}
                      </p>
                    </div>

                    {/* Breakdown bars */}
                    <div className="space-y-3">
                      {reputationBreakdown.map((item) => {
                        const pct = totalRepPoints > 0 ? (item.points / totalRepPoints) * 100 : 0;
                        return (
                          <div key={item.category}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-mono text-forum-text">
                                {item.category}
                              </span>
                              <span className="text-[10px] font-mono font-bold" style={{ color: item.color }}>
                                {item.points.toLocaleString()} pts
                              </span>
                            </div>
                            <div className="h-2 bg-forum-bg rounded-full overflow-hidden border border-forum-border">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: item.color,
                                  boxShadow: `0 0 8px ${item.color}40`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Milestones */}
                    <div className="border-t border-forum-border pt-4">
                      <h4 className="text-[11px] font-mono font-bold text-forum-text mb-3 flex items-center gap-1.5">
                        <Target size={12} className="text-forum-pink" />
                        Reputation Milestones
                      </h4>
                      <div className="space-y-2">
                        {[
                          { threshold: 100, label: 'Newcomer', icon: '🌱' },
                          { threshold: 500, label: 'Contributor', icon: '⭐' },
                          { threshold: 1000, label: 'Expert', icon: '💎' },
                          { threshold: 2500, label: 'Veteran', icon: '🏅' },
                          { threshold: 5000, label: 'Legend', icon: '🏆' },
                          { threshold: 10000, label: 'Mythic', icon: '👑' },
                        ].map((milestone) => {
                          const reached = calculatedRep >= milestone.threshold;
                          const progress = Math.min(
                            100,
                            (calculatedRep / milestone.threshold) * 100
                          );
                          return (
                            <div
                              key={milestone.threshold}
                              className={`flex items-center gap-3 px-3 py-2 rounded border transition-forum ${reached
                                ? 'border-forum-pink/20 bg-forum-pink/5'
                                : 'border-forum-border bg-forum-bg/30'
                                }`}
                            >
                              <span className="text-lg">{milestone.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span
                                    className={`text-[10px] font-mono font-bold ${reached ? 'text-forum-pink' : 'text-forum-muted'
                                      }`}
                                  >
                                    {milestone.label}
                                  </span>
                                  <span className="text-[9px] font-mono text-forum-muted">
                                    {milestone.threshold.toLocaleString()} pts
                                  </span>
                                </div>
                                <div className="h-1 bg-forum-bg rounded-full overflow-hidden border border-forum-border/50">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${progress}%`,
                                      backgroundColor: reached ? '#FF2D92' : '#6b6b80',
                                      boxShadow: reached
                                        ? '0 0 6px rgba(255, 45, 146, 0.4)'
                                        : 'none',
                                    }}
                                  />
                                </div>
                              </div>
                              {reached && (
                                <Check size={12} className="text-forum-pink flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reputation History Timeline */}
                    <div className="border-t border-forum-border pt-4">
                      <h4 className="text-[11px] font-mono font-bold text-forum-text mb-3 flex items-center gap-1.5">
                        <Clock size={12} className="text-forum-pink" />
                        Reputation History
                      </h4>
                      <div className="space-y-0">
                        {repHistory.slice(0, showAllHistory ? 100 : 20).map((event, idx) => {
                          const isPositive = event.points > 0;
                          return (
                            <div
                              key={event.id}
                              className="flex items-start gap-3 relative group"
                            >
                              {/* Timeline line */}
                              {idx < (showAllHistory ? Math.min(repHistory.length, 100) : Math.min(repHistory.length, 20)) - 1 && (
                                <div className="absolute left-[11px] top-6 bottom-0 w-[1px] bg-forum-border/50" />
                              )}

                              {/* Dot */}
                              <div
                                className={`relative z-10 mt-1 flex-shrink-0 h-[22px] w-[22px] rounded-full border flex items-center justify-center ${isPositive
                                  ? 'border-emerald-500/40 bg-emerald-500/10'
                                  : 'border-red-500/40 bg-red-500/10'
                                  }`}
                              >
                                {getActionIcon(event.action)}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 pb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-mono text-forum-text">
                                    {event.description}
                                  </span>
                                  <span
                                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isPositive
                                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                      : 'text-red-400 bg-red-500/10 border border-red-500/20'
                                      }`}
                                  >
                                    {isPositive ? '+' : ''}{event.points}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {event.threadTitle && (
                                    <span
                                      className="text-[8px] font-mono text-forum-pink/70 hover:text-forum-pink cursor-pointer truncate max-w-[200px]"
                                      onClick={() => event.threadId && navigate(`/thread/${event.threadId}`)}
                                    >
                                      {event.threadTitle}
                                    </span>
                                  )}
                                  {event.triggeredBy && (
                                    <span className="text-[8px] font-mono text-forum-muted">
                                      by {event.triggeredBy}
                                    </span>
                                  )}
                                  <span className="text-[8px] font-mono text-forum-muted/50">
                                    {formatTimeAgo(event.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {repHistory.length > 20 && !showAllHistory && (
                        <button
                          onClick={() => setShowAllHistory(true)}
                          className="w-full mt-2 py-2 rounded border border-forum-border bg-forum-bg/50 text-[10px] font-mono font-bold text-forum-pink hover:bg-forum-pink/5 hover:border-forum-pink/30 transition-forum"
                        >
                          Show More ({repHistory.length - 20} older events)
                        </button>
                      )}
                      {repHistory.length === 0 && (
                        <div className="text-center py-8">
                          <Trophy size={32} className="text-forum-muted/30 mx-auto mb-3" />
                          <p className="text-[12px] font-mono text-forum-muted">No reputation history yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden w-[280px] flex-shrink-0 space-y-3 lg:block">
            {/* Quick Info Card */}
            <div className="hud-panel p-3 space-y-2">
              <h4 className="text-[10px] font-mono font-bold text-forum-text uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Gem size={10} className="text-forum-pink" />
                Quick Info
              </h4>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between py-1">
                  <span className="text-[9px] font-mono text-forum-muted">Member Since</span>
                  <span className="text-[9px] font-mono text-forum-text">
                    {new Date(user.joinDate).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="h-[1px] bg-forum-border/50" />
                <div className="flex items-center justify-between py-1">
                  <span className="text-[9px] font-mono text-forum-muted">Total Posts</span>
                  <span className="text-[9px] font-mono text-forum-text">{user.postCount.toLocaleString()}</span>
                </div>
                <div className="h-[1px] bg-forum-border/50" />
                <div className="flex items-center justify-between py-1">
                  <span className="text-[9px] font-mono text-forum-muted">Reputation</span>
                  <span className="flex items-center gap-1 text-[9px] font-mono text-forum-pink font-bold">
                    {calculatedRep.toLocaleString()}
                    {repChange24h > 0 && (
                      <span className="text-[7px] text-emerald-400 font-normal">+{repChange24h}</span>
                    )}
                  </span>
                </div>
                <div className="h-[1px] bg-forum-border/50" />
                <div className="flex items-center justify-between py-1">
                  <span className="text-[9px] font-mono text-forum-muted">Rank</span>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold ${getRankColor(user.rank).split(' ')[0]}`}>
                    {getRankIcon(user.rank)}
                    {user.rank || 'Member'}
                  </span>
                </div>
                <div className="h-[1px] bg-forum-border/50" />
                <div className="flex items-center justify-between py-1">
                  <span className="text-[9px] font-mono text-forum-muted">Status</span>
                  <span className={`flex items-center gap-1 text-[9px] font-mono ${user.isOnline ? 'text-emerald-400' : 'text-forum-muted'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${user.isOnline ? 'bg-emerald-400' : 'bg-forum-muted/50'}`} />
                    {user.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Badges (sidebar) */}
            <div className="hud-panel p-3">
              <h4 className="text-[10px] font-mono font-bold text-forum-text uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Award size={10} className="text-forum-pink" />
                Top Badges
              </h4>
              <div className="space-y-1">
                {userBadges
                  .sort((a, b) => {
                    const order = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
                    return (order[a.rarity] ?? 5) - (order[b.rarity] ?? 5);
                  })
                  .slice(0, 5)
                  .map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-forum-hover transition-forum"
                    >
                      <span className="text-sm">{badge.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-mono font-bold text-forum-text truncate">
                          {badge.name}
                        </div>
                        <div className={`text-[7px] font-mono uppercase tracking-wider ${getRarityColor(badge.rarity).split(' ')[2]}`}>
                          {badge.rarity}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <SidebarStatsPanel stats={forumStats} />
            <OnlineUsers />
            <PopularTags />
          </div>
        </div>
      </div>

      {/* New Thread Modal */}
      <NewThreadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Edit Profile Modal */}
      {user && (
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          currentUsername={user.username}
          userId={user.id}
          onSuccess={handleProfileUpdateSuccess}
        />
      )}

      {/* Image Adjust Modal */}
      <ImageAdjustModal
        isOpen={imageAdjustModal.isOpen}
        onClose={() => setImageAdjustModal({ ...imageAdjustModal, isOpen: false })}
        imageUrl={imageAdjustModal.imageUrl}
        type={imageAdjustModal.type}
        onSave={handleImageAdjustSave}
      />
    </div>
  );
}
