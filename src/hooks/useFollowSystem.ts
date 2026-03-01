import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';
import { CreateNotificationData } from '@/hooks/forum/useNotifications';

export interface FollowStatus {
  isFollowing: boolean;
  isPending: boolean;
  isFollower: boolean;
  status: 'none' | 'pending' | 'accepted' | 'rejected';
}

export function useFollowSystem(
  targetUserId: string,
  currentUserId: string,
  createNotification?: (data: CreateNotificationData) => Promise<void>,
  currentUserName?: string,
  currentUserAvatar?: string,
) {
  const [followStatus, setFollowStatus] = useState<FollowStatus>({
    isFollowing: false,
    isPending: false,
    isFollower: false,
    status: 'none'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;

    fetchFollowStatus();

    // Subscribe to follow changes
    const channel = supabase
      .channel(`follow-${currentUserId}-${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_follows',
          filter: `follower_id=eq.${currentUserId},following_id=eq.${targetUserId}`
        },
        () => {
          fetchFollowStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, targetUserId]);

  const fetchFollowStatus = async () => {
    try {
      // Check if current user follows target
      const { data: followData } = await supabase
        .from('user_follows')
        .select('status')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      // Check if target follows current user
      const { data: followerData } = await supabase
        .from('user_follows')
        .select('status')
        .eq('follower_id', targetUserId)
        .eq('following_id', currentUserId)
        .maybeSingle();

      setFollowStatus({
        isFollowing: followData?.status === 'accepted',
        isPending: followData?.status === 'pending',
        isFollower: followerData?.status === 'accepted',
        status: followData?.status || 'none'
      });
    } catch (error) {
      console.error('Error fetching follow status:', error);
    }
  };

  const followUser = async () => {
    if (!currentUserId || !targetUserId) return;

    // Check if user is authenticated (not a guest)
    if (currentUserId === 'guest') {
      toast.error('Please log in to follow users');
      return;
    }

    setLoading(true);
    try {
      // Check if target user is private
      const { data: targetUser } = await supabase
        .from('forum_users')
        .select('is_private, username')
        .eq('id', targetUserId)
        .single();

      const status = targetUser?.is_private ? 'pending' : 'accepted';

      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: currentUserId,
          following_id: targetUserId,
          status
        });

      if (error) {
        // Check if it's an RLS error
        if (error.message.includes('row-level security') || error.message.includes('policy')) {
          throw new Error('Please log in to follow users');
        }
        throw error;
      }

      const message = status === 'pending'
        ? `Follow request sent to ${targetUser?.username}`
        : `Now following ${targetUser?.username}`;
      toast.success(message);

      // Notify target user
      if (createNotification) {
        createNotification({
          userId: targetUserId,
          type: status === 'pending' ? 'follow_request' : 'follow',
          title: status === 'pending' ? 'Follow Request' : 'New Follower',
          message: status === 'pending'
            ? `${currentUserName || 'Someone'} sent you a follow request`
            : `${currentUserName || 'Someone'} started following you`,
          link: `/user/${currentUserId}`,
          actorId: currentUserId,
          actorName: currentUserName,
          actorAvatar: currentUserAvatar,
          targetType: 'user',
          targetId: targetUserId,
        });
      }

      fetchFollowStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to follow user');
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async () => {
    if (!currentUserId || !targetUserId) return;

    // Check if user is authenticated (not a guest)
    if (currentUserId === 'guest') {
      toast.error('Please log in to unfollow users');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);

      if (error) {
        // Check if it's an RLS error
        if (error.message.includes('row-level security') || error.message.includes('policy')) {
          throw new Error('Please log in to unfollow users');
        }
        throw error;
      }

      toast.success('You have unfollowed this user');

      fetchFollowStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to unfollow user');
    } finally {
      setLoading(false);
    }
  };

  const acceptFollowRequest = async (followerId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_follows')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('follower_id', followerId)
        .eq('following_id', currentUserId);

      if (error) throw error;

      toast.success('Follow request accepted');

      fetchFollowStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept request');
    } finally {
      setLoading(false);
    }
  };

  const rejectFollowRequest = async (followerId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', currentUserId);

      if (error) throw error;

      toast.success('Follow request rejected');

      fetchFollowStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  return {
    followStatus,
    loading,
    followUser,
    unfollowUser,
    acceptFollowRequest,
    rejectFollowRequest,
    refreshStatus: fetchFollowStatus
  };
}
