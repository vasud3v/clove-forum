import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface UnreadReply {
  postId: string;
  createdAt: string;
}

export function useUnreadReplies(threadId: string | undefined, userId: string) {
  const [unreadReplies, setUnreadReplies] = useState<UnreadReply[]>([]);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch last read timestamp
  useEffect(() => {
    if (!threadId || userId === 'guest') {
      setLastReadTimestamp(null);
      setUnreadReplies([]);
      return;
    }

    const fetchLastRead = async () => {
      try {
        setError(null);
        const { data, error } = await supabase
          .from('thread_watches')
          .select('last_read_at')
          .eq('thread_id', threadId)
          .eq('user_id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (isMountedRef.current) {
          setLastReadTimestamp(data?.last_read_at || null);
        }
      } catch (err) {
        console.error('Error fetching last read timestamp:', err);
        if (isMountedRef.current) {
          setError('Failed to fetch read status');
        }
      }
    };

    fetchLastRead();
  }, [threadId, userId]);

  // Calculate unread replies
  useEffect(() => {
    if (!threadId || !lastReadTimestamp) {
      setUnreadReplies([]);
      return;
    }

    const fetchUnreadReplies = async () => {
      try {
        setError(null);
        const { data, error } = await supabase
          .from('posts')
          .select('id, created_at')
          .eq('thread_id', threadId)
          .gt('created_at', lastReadTimestamp)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (isMountedRef.current) {
          setUnreadReplies(
            (data || []).map(post => ({
              postId: post.id,
              createdAt: post.created_at,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching unread replies:', err);
        if (isMountedRef.current) {
          setError('Failed to fetch unread replies');
          setUnreadReplies([]);
        }
      }
    };

    fetchUnreadReplies();
  }, [threadId, lastReadTimestamp]);

  const markAsRead = useCallback(async () => {
    if (!threadId || userId === 'guest') return false;

    setLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();

      // Update or insert thread watch
      const { error } = await supabase
        .from('thread_watches')
        .upsert({
          thread_id: threadId,
          user_id: userId,
          last_read_at: now,
          unread_count: 0,
        }, {
          onConflict: 'thread_id,user_id',
        });

      if (error) throw error;

      if (isMountedRef.current) {
        setLastReadTimestamp(now);
        setUnreadReplies([]);
      }
      return true;
    } catch (err) {
      console.error('Error marking as read:', err);
      if (isMountedRef.current) {
        setError('Failed to mark as read');
      }
      return false;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [threadId, userId]);

  const jumpToFirstUnread = useCallback(() => {
    if (unreadReplies.length === 0) {
      console.warn('No unread replies to jump to');
      return false;
    }

    const firstUnreadId = unreadReplies[0].postId;
    const element = document.getElementById(firstUnreadId);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-forum-pink', 'ring-opacity-50');
      setTimeout(() => {
        if (element) {
          element.classList.remove('ring-2', 'ring-forum-pink', 'ring-opacity-50');
        }
      }, 2000);
      return true;
    } else {
      console.warn(`Element with id ${firstUnreadId} not found`);
      return false;
    }
  }, [unreadReplies]);

  return {
    unreadCount: unreadReplies.length,
    unreadReplies,
    markAsRead,
    jumpToFirstUnread,
    loading,
    error,
  };
}
