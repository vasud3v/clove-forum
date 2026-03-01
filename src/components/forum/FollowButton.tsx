import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Clock, MessageCircle } from 'lucide-react';
import { useFollowSystem } from '@/hooks/useFollowSystem';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FollowButtonProps {
  targetUserId: string;
  currentUserId: string;
  showMessageButton?: boolean;
  onMessageClick?: () => void;
}

export function FollowButton({ 
  targetUserId, 
  currentUserId, 
  showMessageButton = false,
  onMessageClick 
}: FollowButtonProps) {
  const navigate = useNavigate();
  const { createNotification } = useNotifications();
  const { user } = useAuth();
  const [currentUserData, setCurrentUserData] = useState<{ username: string; avatar: string } | null>(null);

  // Fetch current user data for notifications
  useEffect(() => {
    if (user?.id) {
      supabase
        .from('forum_users')
        .select('username, avatar')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setCurrentUserData(data);
          }
        });
    }
  }, [user?.id]);

  const { followStatus, loading, followUser, unfollowUser } = useFollowSystem(
    targetUserId,
    currentUserId,
    createNotification,
    currentUserData?.username,
    currentUserData?.avatar
  );

  if (currentUserId === targetUserId) return null;

  const handleMessageClick = () => {
    if (onMessageClick) {
      onMessageClick();
    } else {
      navigate(`/messages?user=${targetUserId}`);
    }
  };

  return (
    <div className="flex gap-2">
      {followStatus.isFollowing ? (
        <Button
          onClick={unfollowUser}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <UserMinus className="w-4 h-4" />
          Unfollow
        </Button>
      ) : followStatus.isPending ? (
        <Button
          onClick={unfollowUser}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Clock className="w-4 h-4" />
          Pending
        </Button>
      ) : (
        <Button
          onClick={followUser}
          disabled={loading}
          size="sm"
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Follow
        </Button>
      )}

      {showMessageButton && followStatus.isFollowing && (
        <Button
          onClick={handleMessageClick}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Message
        </Button>
      )}
    </div>
  );
}
