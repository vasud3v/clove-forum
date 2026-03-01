/**
 * Hook to sync user profile changes in real-time
 * Listens to forum_users table changes and updates cached user data
 */

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UserProfileUpdate {
  id: string;
  avatar?: string | null;
  banner?: string | null;
  username?: string;
  rank?: string;
  role?: string;
  post_count?: number;
  reputation?: number;
}

export function useUserProfileSync(onUserUpdate: (userId: string, updates: Partial<UserProfileUpdate>) => void) {
  useEffect(() => {
    // Subscribe to forum_users changes
    const channel = supabase
      .channel('user-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'forum_users',
        },
        (payload) => {
          const newData = payload.new as UserProfileUpdate;
          
          // Notify about the update
          onUserUpdate(newData.id, {
            avatar: newData.avatar,
            banner: newData.banner,
            username: newData.username,
            rank: newData.rank,
            role: newData.role,
            post_count: newData.post_count,
            reputation: newData.reputation,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUserUpdate]);
}
