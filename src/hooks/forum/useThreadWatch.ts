import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ThreadWatchData {
  threadId: string;
  userId: string;
  lastReadAt: string;
  unreadCount: number;
}

export function useThreadWatch(threadId: string | undefined, userId: string) {
  const [watchData, setWatchData] = useState<ThreadWatchData | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch watch status
  useEffect(() => {
    if (!threadId || userId === 'guest') return;

    const fetchWatchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('thread_watches')
          .select('*')
          .eq('thread_id', threadId)
          .eq('user_id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setWatchData(data);
          setIsWatching(true);
        } else {
          setWatchData(null);
          setIsWatching(false);
        }
      } catch (error) {
        console.error('Error fetching watch status:', error);
      }
    };

    fetchWatchStatus();
  }, [threadId, userId]);

  const toggleWatch = useCallback(async () => {
    if (!threadId || userId === 'guest') return;

    setLoading(true);
    try {
      if (isWatching) {
        // Unwatch
        const { error } = await supabase
          .from('thread_watches')
          .delete()
          .eq('thread_id', threadId)
          .eq('user_id', userId);

        if (error) throw error;
        setIsWatching(false);
        setWatchData(null);
      } else {
        // Watch
        const { data, error } = await supabase
          .from('thread_watches')
          .insert({
            thread_id: threadId,
            user_id: userId,
            last_read_at: new Date().toISOString(),
            unread_count: 0,
          })
          .select()
          .single();

        if (error) throw error;
        setIsWatching(true);
        setWatchData(data);
      }
    } catch (error) {
      console.error('Error toggling watch:', error);
    } finally {
      setLoading(false);
    }
  }, [threadId, userId, isWatching]);

  const markAsRead = useCallback(async () => {
    if (!threadId || userId === 'guest' || !isWatching) return;

    try {
      const { error } = await supabase
        .from('thread_watches')
        .update({
          last_read_at: new Date().toISOString(),
          unread_count: 0,
        })
        .eq('thread_id', threadId)
        .eq('user_id', userId);

      if (error) throw error;

      setWatchData(prev => prev ? { ...prev, unread_count: 0, lastReadAt: new Date().toISOString() } : null);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [threadId, userId, isWatching]);

  return {
    isWatching,
    watchData,
    loading,
    toggleWatch,
    markAsRead,
    unreadCount: watchData?.unreadCount || 0,
  };
}
