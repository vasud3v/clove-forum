import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X, User } from 'lucide-react';
import { toast } from '@/components/forum/Toast';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

interface FollowRequest {
  follower_id: string;
  created_at: string;
  follower: {
    id: string;
    username: string;
    avatar: string;
    follower_count: number;
    following_count: number;
  };
}

export function FollowRequestsPage() {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserData, setCurrentUserData] = useState<{ username: string; avatar: string } | null>(null);
  const { createNotification } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchFollowRequests();
      
      // Fetch current user data for notifications
      supabase
        .from('forum_users')
        .select('username, avatar')
        .eq('id', currentUserId)
        .single()
        .then(({ data }) => {
          if (data) {
            setCurrentUserData(data);
          }
        });
      
      // Subscribe to changes
      const channel = supabase
        .channel('follow-requests')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_follows',
            filter: `following_id=eq.${currentUserId}`
          },
          () => {
            fetchFollowRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchFollowRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          follower_id,
          created_at,
          follower:forum_users!user_follows_follower_id_fkey (
            id,
            username,
            avatar,
            follower_count,
            following_count
          )
        `)
        .eq('following_id', currentUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching follow requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (followerId: string) => {
    try {
      const { error } = await supabase
        .from('user_follows')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('follower_id', followerId)
        .eq('following_id', currentUserId);

      if (error) throw error;

      toast.success('Follow request accepted');

      // Send notification to the follower that their request was accepted
      if (currentUserData) {
        await createNotification({
          userId: followerId,
          type: 'follow',
          title: 'Follow Request Accepted',
          message: `${currentUserData.username} accepted your follow request`,
          link: `/profile/${currentUserData.username}`,
          actorId: currentUserId,
          actorName: currentUserData.username,
          actorAvatar: currentUserData.avatar,
          targetType: 'user',
          targetId: currentUserId,
        });
      }

      fetchFollowRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept request');
    }
  };

  const handleReject = async (followerId: string) => {
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', currentUserId);

      if (error) throw error;

      toast.success('Follow request rejected');

      fetchFollowRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Follow Requests</h1>

      {requests.length === 0 ? (
        <Card className="p-8 text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No pending follow requests</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.follower_id} className="p-4">
              <div className="flex items-center justify-between">
                <Link 
                  to={`/profile/${request.follower.username}`}
                  className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={request.follower.avatar}
                    alt={request.follower.username}
                    className="w-12 h-12 "
                  />
                  <div>
                    <h3 className="font-semibold">{request.follower.username}</h3>
                    <p className="text-sm text-muted-foreground">
                      {request.follower.follower_count} followers · {request.follower.following_count} following
                    </p>
                  </div>
                </Link>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAccept(request.follower_id)}
                    size="sm"
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleReject(request.follower_id)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
