/**
 * Optimized database queries with caching
 */

import { supabase } from './supabase';
import { cache, CacheKeys, CacheTTL, withCache } from './cache';
import { getUserAvatar } from './avatar';

/**
 * Fetch online users with caching
 */
export async function getOnlineUsers() {
  return withCache(
    CacheKeys.onlineUsers(),
    CacheTTL.SHORT,
    async () => {
      const { data, error } = await supabase
        .from('forum_users')
        .select('id, username, avatar, reputation, rank, role, is_online')
        .eq('is_online', true)
        .order('reputation', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data?.map(user => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        reputation: user.reputation,
        rank: user.rank,
        role: user.role || 'member',
        isOnline: user.is_online,
      })) || [];
    }
  );
}

/**
 * Fetch online users count with caching
 */
export async function getOnlineUsersCount() {
  return withCache(
    CacheKeys.onlineUsersCount(),
    CacheTTL.SHORT,
    async () => {
      const { count, error } = await supabase
        .from('forum_users')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true);

      if (error) throw error;
      return count || 0;
    }
  );
}

/**
 * Fetch user profile with caching
 */
export async function getUserProfile(userId: string) {
  return withCache(
    CacheKeys.userProfile(userId),
    CacheTTL.MEDIUM,
    async () => {
      const { data, error } = await supabase
        .from('forum_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    }
  );
}

/**
 * Fetch profile customization with caching
 */
export async function getProfileCustomization(userId: string) {
  return withCache(
    CacheKeys.profileCustomization(userId),
    CacheTTL.LONG,
    async () => {
      const { data, error } = await supabase
        .from('profile_customizations')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore "not found" errors
        throw error;
      }
      return data;
    }
  );
}

/**
 * Invalidate user-related caches
 */
export function invalidateUserCache(userId: string) {
  cache.invalidate(CacheKeys.userProfile(userId));
  cache.invalidate(CacheKeys.profileCustomization(userId));
  cache.invalidate(CacheKeys.onlineUsers());
  cache.invalidate(CacheKeys.onlineUsersCount());
}

/**
 * Invalidate thread-related caches
 */
export function invalidateThreadCache(categoryId?: string, threadId?: string) {
  if (categoryId) {
    cache.invalidatePattern(`category_${categoryId}_threads_`);
  }
  if (threadId) {
    cache.invalidatePattern(`thread_${threadId}_posts_`);
  }
}
