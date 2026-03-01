import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

export type NotificationType =
    | 'reply'
    | 'mention'
    | 'upvote'
    | 'reaction'
    | 'best_answer'
    | 'follow'
    | 'follow_request'
    | 'milestone'
    | 'system';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
    actorId?: string;
    actorName?: string;
    actorAvatar?: string;
    targetType?: 'thread' | 'post' | 'user';
    targetId?: string;
}

export interface CreateNotificationData {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    actorId?: string;
    actorName?: string;
    actorAvatar?: string;
    targetType?: 'thread' | 'post' | 'user';
    targetId?: string;
}

// ============================================================================
// Transform helpers
// ============================================================================

function transformDbNotification(row: any): Notification {
    return {
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        link: row.link || undefined,
        isRead: row.is_read,
        createdAt: row.created_at,
        actorId: row.actor_id || undefined,
        actorName: row.actor_name || undefined,
        actorAvatar: row.actor_avatar || undefined,
        targetType: row.target_type || undefined,
        targetId: row.target_id || undefined,
    };
}

// ============================================================================
// Hook
// ============================================================================

export function useNotificationsHook(currentUserId: string | null) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const channelRef = useRef<any>(null);

    // Fetch notifications from Supabase
    const fetchNotifications = useCallback(async () => {
        if (!currentUserId || currentUserId === 'guest') return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', currentUserId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.warn('[useNotifications] Failed to fetch notifications:', error.message);
                return;
            }

            setNotifications((data || []).map(transformDbNotification));
        } catch (err) {
            console.warn('[useNotifications] Error:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    // Subscribe to realtime changes
    useEffect(() => {
        if (!currentUserId || currentUserId === 'guest') {
            setNotifications([]);
            return;
        }

        fetchNotifications();

        // Realtime subscription for new notifications
        const channel = supabase
            .channel(`notifications-${currentUserId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${currentUserId}`,
                },
                (payload: any) => {
                    const newNotif = transformDbNotification(payload.new);
                    setNotifications(prev => [newNotif, ...prev]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${currentUserId}`,
                },
                (payload: any) => {
                    const updated = transformDbNotification(payload.new);
                    setNotifications(prev =>
                        prev.map(n => (n.id === updated.id ? updated : n))
                    );
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${currentUserId}`,
                },
                (payload: any) => {
                    const deletedId = payload.old?.id;
                    if (deletedId) {
                        setNotifications(prev => prev.filter(n => n.id !== deletedId));
                    }
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [currentUserId, fetchNotifications]);

    // Computed
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Mark single notification as read
    const markAsRead = useCallback(async (notificationId: string) => {
        if (!currentUserId) return;

        // Optimistic update
        setNotifications(prev =>
            prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
        );

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', currentUserId);

        if (error) {
            console.warn('[useNotifications] Failed to mark as read:', error.message);
            // Revert on failure
            setNotifications(prev =>
                prev.map(n => (n.id === notificationId ? { ...n, isRead: false } : n))
            );
        }
    }, [currentUserId]);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        if (!currentUserId) return;

        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', currentUserId)
            .eq('is_read', false);

        if (error) {
            console.warn('[useNotifications] Failed to mark all as read:', error.message);
            fetchNotifications(); // Re-fetch to revert
        }
    }, [currentUserId, notifications, fetchNotifications]);

    // Delete single notification
    const deleteNotification = useCallback(async (notificationId: string) => {
        if (!currentUserId) return;

        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', currentUserId);

        if (error) {
            console.warn('[useNotifications] Failed to delete notification:', error.message);
            fetchNotifications(); // Re-fetch to revert
        }
    }, [currentUserId, fetchNotifications]);

    // Clear all notifications
    const clearAll = useCallback(async () => {
        if (!currentUserId) return;

        // Optimistic update
        setNotifications([]);

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', currentUserId);

        if (error) {
            console.warn('[useNotifications] Failed to clear notifications:', error.message);
            fetchNotifications(); // Re-fetch to revert
        }
    }, [currentUserId, fetchNotifications]);

    // Create a notification for another user
    const createNotification = useCallback(async (data: CreateNotificationData) => {
        // Don't notify yourself
        if (data.userId === data.actorId) return;
        // Don't create notifications for guest users
        if (!data.userId || data.userId === 'guest') return;

        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: data.userId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    link: data.link || null,
                    actor_id: data.actorId || null,
                    actor_name: data.actorName || null,
                    actor_avatar: data.actorAvatar || null,
                    target_type: data.targetType || null,
                    target_id: data.targetId || null,
                });

            if (error) {
                console.warn('[useNotifications] Failed to create notification:', error.message);
            }
        } catch (err) {
            console.warn('[useNotifications] Error creating notification:', err);
        }
    }, []);

    // Reset on logout
    const resetNotifications = useCallback(() => {
        setNotifications([]);
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
    }, []);

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        createNotification,
        resetNotifications,
    };
}
