import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    useNotificationsHook,
    Notification,
    NotificationType,
    CreateNotificationData,
} from '@/hooks/forum/useNotifications';

// Re-export types for consumers
export type { Notification, NotificationType, CreateNotificationData };

// ============================================================================
// Context Type
// ============================================================================

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;
    clearNotifications: () => void;
    createNotification: (data: CreateNotificationData) => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}

// ============================================================================
// Provider
// ============================================================================

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id || null;

    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        createNotification,
    } = useNotificationsHook(userId);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                clearNotifications: clearAll,
                createNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}
