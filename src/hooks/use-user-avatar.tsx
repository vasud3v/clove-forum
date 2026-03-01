import { useMemo } from 'react';
import { useForumContext } from '@/context/ForumContext';
import { getUserAvatar } from '@/lib/avatar';

/**
 * Hook to get the correct avatar for a user
 * Prioritizes: custom avatar > forum_users avatar > generated avatar
 */
export function useUserAvatar(userId: string, username: string, baseAvatar?: string) {
  const { getUserProfile } = useForumContext();
  
  return useMemo(() => {
    const profileCustom = getUserProfile(userId);
    const avatarUrl = profileCustom.avatar || baseAvatar;
    return avatarUrl || getUserAvatar('', username);
  }, [userId, username, baseAvatar, getUserProfile]);
}
