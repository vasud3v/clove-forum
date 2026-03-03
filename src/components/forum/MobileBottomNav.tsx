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
            <nav className="fixed bottom-0 left-0 right-0 z-mobile-nav lg:hidden border-t-4 border-border bg-card">
                <div className="flex items-center justify-around h-16 px-2">
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
                            className={`relative flex flex-col items-center justify-center gap-1 w-16 h-full transition-all duration-150 font-bold ${item.active
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {item.isAction ? (
                                <div className="flex items-center justify-center h-10 w-10 bg-primary text-white shadow-brutal border-2 border-border transition-all duration-150 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-brutal-lg active:translate-x-[1px] active:translate-y-[1px] active:shadow-brutal-sm">
                                    <item.icon size={18} className="font-bold" strokeWidth={3} />
                                </div>
                            ) : (
                                <>
                                    <div className="relative flex flex-col items-center justify-center">
                                        <item.icon size={20} className="font-bold" strokeWidth={2.5} />
                                        {item.badge && item.badge > 0 && (
                                            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center bg-destructive text-white text-[9px] font-black border border-border shadow-brutal-sm">
                                                {item.badge > 9 ? '9+' : item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[8px] font-mono font-bold tracking-wider">{item.label}</span>
                                </>
                            )}
                            {item.active && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </nav>
            <NewThreadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
