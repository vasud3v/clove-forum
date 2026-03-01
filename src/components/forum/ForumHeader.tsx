import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, Home, MessageSquare, Users, HelpCircle, LogIn, LogOut, Shield, BarChart3, Bookmark, Bell, Mail, UserPlus, LifeBuoy } from 'lucide-react';
import CloveLogo from '@/components/forum/CloveLogo';
import NotificationCenter from '@/components/forum/NotificationCenter';
import RoleBadge from '@/components/forum/RoleBadge';
import SearchDropdown from '@/components/forum/SearchDropdown';
import { useAuth } from '@/context/AuthContext';
import { useForumContext } from '@/context/ForumContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useSearch } from '@/hooks/useSearch';

interface ForumHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export default function ForumHeader({
  searchQuery,
  onSearchChange,
  onMobileMenuToggle,
  isMobileMenuOpen,
}: ForumHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, signOut } = useAuth();
  const { currentUser } = useForumContext();
  const { isStaff } = usePermissions();
  const {
    query: liveQuery,
    setQuery: setLiveQuery,
    results: liveResults,
    isLoading: liveLoading,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useSearch();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownActiveIndex, setDropdownActiveIndex] = useState(-1);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Don't handle Enter here if dropdown has an active keyboard selection
    if (e.key === 'Enter' && liveQuery.trim() && dropdownActiveIndex < 0) {
      addRecentSearch(liveQuery.trim());
      setIsDropdownOpen(false);
      navigate(`/search?q=${encodeURIComponent(liveQuery.trim())}`);
    }
  };

  const handleSearchChange = (value: string) => {
    setLiveQuery(value);
    onSearchChange(value);
    if (!isDropdownOpen) setIsDropdownOpen(true);
  };

  const handleFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleSelectResult = (link: string) => {
    if (liveQuery.trim()) addRecentSearch(liveQuery.trim());
    setIsDropdownOpen(false);
    navigate(link);
  };

  const handleRecentClick = (term: string) => {
    setLiveQuery(term);
    onSearchChange(term);
    setIsDropdownOpen(false);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleViewAll = () => {
    if (liveQuery.trim()) addRecentSearch(liveQuery.trim());
    setIsDropdownOpen(false);
    navigate(`/search?q=${encodeURIComponent(liveQuery.trim())}`);
  };

  const navLinks = [
    { label: 'Forums', icon: Home, active: location.pathname === '/', href: '/' },
    { label: "What's New", icon: MessageSquare, active: location.pathname === '/whats-new', href: '/whats-new' },
    { label: 'Members', icon: Users, active: location.pathname === '/members', href: '/members' },
    { label: 'Rules', icon: HelpCircle, active: location.pathname === '/rules', href: '/rules' },
    { label: 'Support', icon: LifeBuoy, active: location.pathname === '/support', href: '/support' },
    ...(isAuthenticated ? [
      { label: 'Watched', icon: Bell, active: location.pathname === '/watched', href: '/watched' },
      { label: 'Bookmarks', icon: Bookmark, active: location.pathname === '/bookmarks', href: '/bookmarks' },
      { label: 'Messages', icon: Mail, active: location.pathname === '/messages', href: '/messages' },
      { label: 'Following', icon: UserPlus, active: location.pathname === '/following-feed', href: '/following-feed' }
    ] : []),
    ...(isStaff ? [
      { label: 'Analytics', icon: BarChart3, active: location.pathname === '/analytics', href: '/analytics' },
      { label: 'Admin', icon: Shield, active: location.pathname === '/admin', href: '/admin' }
    ] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar */}
      <div className="border-b border-forum-border bg-forum-card/95 backdrop-blur-md shadow-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMobileMenuToggle}
              className="transition-forum rounded-md p-2 text-forum-muted hover:bg-forum-hover hover:text-forum-pink lg:hidden"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="transition-forum group-hover:shadow-pink-glow">
                <CloveLogo size={32} />
              </div>
              <span className="text-lg font-bold tracking-tight text-forum-text font-mono">
                clo<span className="text-forum-pink text-glow-pink">ve</span>
              </span>
            </div>
          </div>

          {/* Search with Dropdown */}
          <div className="hidden flex-1 max-w-md mx-8 md:block relative">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-forum-muted"
              />
              <input
                type="text"
                placeholder="Search threads, posts, users..."
                value={liveQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={handleFocus}
                className="transition-forum w-full rounded-md border border-forum-border bg-forum-bg py-2 pl-9 pr-4 text-[12px] font-mono text-forum-text placeholder-forum-muted outline-none focus:border-forum-pink focus:shadow-pink-glow focus:ring-1 focus:ring-forum-pink/30"
              />
              {liveQuery && (
                <button
                  onClick={() => {
                    setLiveQuery('');
                    onSearchChange('');
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forum-muted hover:text-forum-pink transition-forum"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <SearchDropdown
              isOpen={isDropdownOpen}
              query={liveQuery}
              results={liveResults}
              isLoading={liveLoading}
              recentSearches={recentSearches}
              onClose={() => setIsDropdownOpen(false)}
              onSelectResult={handleSelectResult}
              onRecentClick={handleRecentClick}
              onRemoveRecent={removeRecentSearch}
              onClearRecent={clearRecentSearches}
              onViewAll={handleViewAll}
              onActiveIndexChange={setDropdownActiveIndex}
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Mobile search */}
            <button
              onClick={() => navigate('/search')}
              className="transition-forum rounded-md p-2 text-forum-muted hover:bg-forum-hover hover:text-forum-pink md:hidden"
            >
              <Search size={16} />
            </button>

            {/* Notifications */}
            {isAuthenticated && <NotificationCenter />}

            {/* User avatar / Auth buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/user/${currentUser.id}`)}
                  className="transition-forum flex items-center gap-2 rounded-md border border-forum-border p-1.5 hover:border-forum-pink/40 hover:bg-forum-hover hover:shadow-pink-glow"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="h-7 w-7 rounded object-cover ring-1 ring-forum-pink/30"
                  />
                  <span className="hidden text-[11px] font-medium text-forum-text font-mono sm:block">
                    {currentUser.username}
                  </span>
                </button>
                <button
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                  className="transition-forum flex items-center gap-1.5 rounded-md border border-forum-border p-1.5 px-2.5 text-forum-muted hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                  <span className="hidden text-[11px] font-medium font-mono sm:block">
                    Logout
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="transition-forum flex items-center gap-1.5 rounded-md border border-forum-border px-3 py-1.5 text-[11px] font-mono font-medium text-forum-muted hover:border-forum-pink/40 hover:bg-forum-hover hover:text-forum-pink"
                >
                  <LogIn size={13} />
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="transition-forum flex items-center gap-1.5 rounded-md bg-forum-pink px-3 py-1.5 text-[11px] font-mono font-bold text-white hover:bg-forum-pink/90 hover:shadow-pink-glow"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="border-b border-forum-border bg-forum-card-alt/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <nav className="hidden md:flex items-center gap-1 h-10 overflow-x-auto">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.href)}
                className={`transition-forum flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-mono font-medium whitespace-nowrap ${link.active
                  ? 'bg-forum-pink/10 text-forum-pink border border-forum-pink/20'
                  : 'text-forum-muted hover:text-forum-text hover:bg-forum-hover'
                  }`}
              >
                <link.icon size={13} />
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

