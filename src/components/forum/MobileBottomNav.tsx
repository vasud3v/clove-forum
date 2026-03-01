import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Plus, Bell, User } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { useForumContext } from '@/context/ForumContext';
import { useState } from 'react';
import NewThreadModal from '@/components/forum/NewThreadModal';

export default function MobileBottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const { unreadCount } = useNotifications();
    const { isAuthenticated } = useAuth();
    const { currentUser } = useForumContext();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const navItems = [
        {
            icon: Home,
            label: 'Home',
            href: '/',
            active: location.pathname === '/',
        },
        {
            icon: Search,
            label: 'Search',
            href: '/search',
            active: location.pathname === '/search',
        },
        {
            icon: Plus,
            label: 'New',
            href: '#new',
            active: false,
            isAction: true,
        },
        ...(isAuthenticated ? [{
            icon: Bell,
            label: 'Alerts',
            href: '#alerts',
            active: false,
            badge: unreadCount,
        }] : []),
        {
            icon: User,
            label: 'Profile',
            href: isAuthenticated ? `/user/${currentUser.id}` : '/login',
            active: location.pathname.startsWith('/user/'),
        },
    ];

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-forum-border bg-forum-card/95 backdrop-blur-md">
                <div className="flex items-center justify-around h-14 px-2">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => {
                                if (item.isAction) {
                                    setIsModalOpen(true);
                                } else {
                                    navigate(item.href);
                                }
                            }}
                            className={`relative flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-forum ${item.active
                                ? 'text-forum-pink'
                                : 'text-forum-muted hover:text-forum-text'
                                }`}
                        >
                            {item.isAction ? (
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-forum-pink text-white shadow-lg shadow-forum-pink/40">
                                    <item.icon size={16} />
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <item.icon size={18} />
                                        {item.badge && item.badge > 0 && (
                                            <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-forum-pink text-[7px] font-bold text-white">
                                                {item.badge > 9 ? '9+' : item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[8px] font-mono">{item.label}</span>
                                </>
                            )}
                            {item.active && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-forum-pink rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </nav>
            <NewThreadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
