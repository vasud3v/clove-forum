import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole } from '@/types/forum';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getUserAvatar } from '@/lib/avatar';

const AVAILABLE_PAGE_SIZES = [5, 8, 10, 15, 20, 25];

// Fallback guest user for unauthenticated users
const fallbackUser: User = {
    id: 'guest',
    username: 'Guest',
    avatar: getUserAvatar('', 'Guest'),
    postCount: 0,
    reputation: 0,
    joinDate: new Date().toISOString(),
    isOnline: false,
    rank: 'Guest',
    role: 'member',
};

export function useForumUser() {
    const { user: authUser, isAuthenticated } = useAuth();
    const authUserId = authUser?.id;
    const [forumUser, setForumUser] = useState<User | null>(null);
    const [profileCustomizations, setProfileCustomizations] = useState<Record<string, { avatar?: string; banner?: string }>>({});
    const [pageSize, setPageSizeState] = useState<number>(8);

    // Fetch the forum_users record for the authenticated user
    useEffect(() => {
        if (!isAuthenticated || !authUser) {
            setForumUser(null);
            return;
        }

        let cancelled = false;

        const fetchUser = async () => {
            try {
                const { data, error } = await supabase
                    .from('forum_users')
                    .select('*')
                    .eq('id', authUser.id)
                    .maybeSingle();

                if (!cancelled) {
                    if (data) {
                        console.log('[useForumUser] Found existing forum_users record:', data.username);
                        setForumUser({
                            id: data.id,
                            username: data.username,
                            avatar: data.avatar,
                            banner: data.banner || undefined,
                            postCount: data.post_count,
                            reputation: data.reputation,
                            joinDate: data.join_date,
                            isOnline: data.is_online,
                            rank: data.rank || 'Newcomer',
                            role: (data.role as UserRole) || 'member',
                        });
                    } else {
                        console.warn('[useForumUser] No forum_users record found for user:', authUser.id);
                        setForumUser(null);
                    }

                    if (error) {
                        console.warn('[useForumUser] Error fetching forum user:', error);
                    }
                }
            } catch (err) {
                console.warn('[useForumUser] Failed to fetch forum user:', err);
            }
        };

        fetchUser();

        // Subscribe to realtime updates for current user
        const channel = supabase
            .channel(`user-${authUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'forum_users',
                    filter: `id=eq.${authUser.id}`,
                },
                (payload) => {
                    if (!cancelled) {
                        const data = payload.new as any;
                        console.log('[useForumUser] Received realtime update:', data.username);
                        setForumUser({
                            id: data.id,
                            username: data.username,
                            avatar: data.avatar,
                            banner: data.banner || undefined,
                            postCount: data.post_count,
                            reputation: data.reputation,
                            joinDate: data.join_date,
                            isOnline: data.is_online,
                            rank: data.rank || 'Newcomer',
                            role: (data.role as UserRole) || 'member',
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            cancelled = true;
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated, authUser?.id]);

    // Build the currentUser
    const currentUser: User = useMemo(() => {
        if (isAuthenticated && forumUser) {
            return forumUser;
        }
        if (isAuthenticated && authUser) {
            const username = authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user';
            return {
                id: authUser.id,
                username,
                avatar: getUserAvatar('', username),
                postCount: 0,
                reputation: 0,
                joinDate: authUser.created_at || new Date().toISOString(),
                isOnline: true,
                rank: 'Newcomer',
                role: 'member' as UserRole,
            };
        }
        return fallbackUser;
    }, [isAuthenticated, authUser, forumUser]);

    // Load profile customizations from Supabase on mount (optimized - only load current user)
    useEffect(() => {
        if (!isAuthenticated || !authUser?.id) return;

        (async () => {
            try {
                const { data, error } = await supabase
                    .from('profile_customizations')
                    .select('user_id')
                    .eq('user_id', authUser.id)
                    .maybeSingle();

                if (error) {
                    console.warn('Failed to load profile customizations from Supabase:', error.message);
                    return;
                }

                if (data) {
                    setProfileCustomizations({
                        [data.user_id]: {
                            ...(data.avatar ? { avatar: data.avatar } : {}),
                            ...(data.banner ? { banner: data.banner } : {}),
                        },
                    });
                }
            } catch (err) {
                console.warn('Error loading profile customizations from Supabase:', err);
            }
        })();
    }, [isAuthenticated, authUser?.id]);

    // Load current user's page size preference
    useEffect(() => {
        if (!isAuthenticated || !currentUser?.id) return;

        (async () => {
            try {
                const { data, error } = await supabase
                    .from('profile_customizations')
                    .select('page_size')
                    .eq('user_id', currentUser.id)
                    .maybeSingle();

                if (error) {
                    console.warn('Failed to load page size from Supabase:', error.message);
                    return;
                }
                const ps = (data as any)?.page_size;
                if (ps && AVAILABLE_PAGE_SIZES.includes(ps)) {
                    setPageSizeState(ps);
                }
            } catch (err) {
                console.warn('Error loading page size from Supabase:', err);
            }
        })();
    }, [isAuthenticated, currentUser?.id]);

    // Update user profile (avatar/banner)
    const updateUserProfile = useCallback(async (userId: string, updates: { avatar?: string; banner?: string }) => {
        if (!isAuthenticated || !currentUser?.id) {
            console.warn('[useForumUser] Cannot update profile: user not authenticated');
            return;
        }
        if (userId !== currentUser.id) {
            console.warn('[useForumUser] Cannot update profile: can only update own profile');
            return;
        }

        setProfileCustomizations((prev) => ({
            ...prev,
            [userId]: { ...prev[userId], ...updates },
        }));

        try {
            const updateData: any = {};
            if (updates.avatar !== undefined) updateData.avatar = updates.avatar || null;
            if (updates.banner !== undefined) updateData.banner = updates.banner || null;

            const { error } = await supabase
                .from('forum_users')
                .update(updateData)
                .eq('id', userId);

            if (error) {
                console.error('[useForumUser] Failed to save profile:', error);
            } else {
                console.log('[useForumUser] Profile saved successfully');
                if (forumUser && forumUser.id === userId) {
                    setForumUser({
                        ...forumUser,
                        avatar: updates.avatar !== undefined ? (updates.avatar || forumUser.avatar) : forumUser.avatar,
                        banner: updates.banner !== undefined ? (updates.banner || forumUser.banner) : forumUser.banner,
                    });
                }
            }
        } catch (err) {
            console.error('[useForumUser] Error persisting profile:', err);
        }
    }, [isAuthenticated, currentUser, forumUser]);

    const getUserProfile = useCallback((userId: string): { avatar?: string; banner?: string } => {
        return profileCustomizations[userId] || {};
    }, [profileCustomizations]);

    const setPageSize = useCallback((size: number) => {
        if (AVAILABLE_PAGE_SIZES.includes(size)) {
            setPageSizeState(size);

            if (isAuthenticated && currentUser?.id) {
                (async () => {
                    try {
                        const { error } = await supabase
                            .from('profile_customizations')
                            .upsert(
                                { user_id: currentUser.id, page_size: size, updated_at: new Date().toISOString() },
                                { onConflict: 'user_id' }
                            );
                        if (error) console.warn('Failed to save page size to Supabase:', error.message);
                    } catch (err) {
                        console.warn('Error persisting page size:', err);
                    }
                })();
            }
        }
    }, [isAuthenticated, currentUser?.id]);

    return {
        currentUser,
        forumUser,
        setForumUser,
        isAuthenticated,
        authUserId,
        profileCustomizations,
        updateUserProfile,
        getUserProfile,
        pageSize,
        setPageSize,
        availablePageSizes: AVAILABLE_PAGE_SIZES,
    };
}
