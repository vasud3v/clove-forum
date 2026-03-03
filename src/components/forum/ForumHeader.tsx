import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, Home, MessageSquare, Users, HelpCircle, LogIn, LogOut, Shield, BarChart3, Bookmark, Bell, Mail, UserPlus, LifeBuoy, ChevronDown, Settings, LogIn as LoginIcon, Zap, Target } from 'lucide-react';
import ChugliLogo from '@/components/forum/ChugliLogo';
import NotificationCenter from '@/components/forum/NotificationCenter';
import RoleBadge from '@/components/forum/RoleBadge';
import SearchDropdown from '@/components/forum/SearchDropdown';
import { NavbarBreadcrumb } from '@/components/forum/NavbarBreadcrumb';
import { KeyboardShortcutsHint } from '@/components/forum/KeyboardShortcutsHint';
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
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const navDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target as Node)) {
        setIsNavDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="w-full">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-header border-b border-forum-border bg-gradient-to-r from-forum-card via-forum-card to-forum-card/80 backdrop-blur-xl shadow-lg overflow-visible">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6 gap-4 overflow-visible">
          {/* Logo Section - Enhanced */}
          <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
            <button
              onClick={onMobileMenuToggle}
              className="group transition-all duration-300 rounded-lg p-2 text-forum-muted hover:bg-forum-pink/10 hover:text-forum-pink lg:hidden"
              aria-label="Toggle menu"
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                {isMobileMenuOpen ? (
                  <X size={20} className="transition-transform duration-300 scale-100" />
                ) : (
                  <Menu size={20} className="transition-transform duration-300 scale-100" />
                )}
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-0 cursor-pointer group h-9"
              aria-label="Go to home"
            >
              <div className="transition-all duration-300 group-hover:scale-110 group-active:scale-95">
                <ChugliLogo size={32} />
              </div>
            </button>
          </div>

          {/* Search Bar - Enhanced */}
          <div className="hidden flex-1 max-w-md mx-4 md:block relative z-dropdown overflow-visible">
            <div className="relative group w-full overflow-visible">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forum-muted group-focus-within:text-forum-pink transition-colors duration-200 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search threads, posts, users..."
                value={liveQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={handleFocus}
                className="transition-all duration-200 w-full rounded-lg border border-forum-border bg-forum-bg/40 hover:bg-forum-bg/60 hover:border-forum-border/80 py-2 pl-10 pr-10 text-[12px] font-mono text-forum-text placeholder-forum-muted/70 outline-none focus:border-forum-pink focus:bg-forum-bg focus:placeholder-forum-muted focus:shadow-lg focus:shadow-forum-pink/20 focus:ring-2 focus:ring-forum-pink/30"
              />
              {liveQuery && (
                <button
                  onClick={() => {
                    setLiveQuery('');
                    onSearchChange('');
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forum-muted hover:text-forum-pink transition-all duration-200 hover:rotate-90 hover:scale-110"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
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
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            {/* Mobile Search */}
            <button
              onClick={() => navigate('/search')}
              className="group transition-all duration-200 rounded-lg p-2 text-forum-muted hover:bg-forum-hover hover:text-forum-pink md:hidden"
              aria-label="Open search"
            >
              <Search size={18} className="group-hover:scale-110 transition-transform" />
            </button>

            {/* Keyboard Shortcuts */}
            <KeyboardShortcutsHint />

            {/* Notifications */}
            {isAuthenticated && <NotificationCenter />}

            {/* User Auth Section */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* User Profile Dropdown */}
                <div ref={userDropdownRef} className="relative">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="group transition-all duration-200 flex items-center gap-2 rounded-lg border border-forum-border p-1.5 hover:border-forum-pink/50 hover:bg-forum-hover hover:shadow-md active:scale-95"
                    aria-expanded={isUserDropdownOpen}
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.username}
                      className="h-7 w-7 rounded-md object-cover ring-1 ring-forum-pink/30 group-hover:ring-forum-pink/50 transition-all"
                    />
                    <span className="hidden text-[11px] font-medium text-forum-text font-mono sm:inline-block max-w-[100px] truncate">
                      {currentUser.username}
                    </span>
                    <ChevronDown 
                      size={14} 
                      className={`hidden sm:block transition-transform duration-300 ${isUserDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg border border-forum-border bg-forum-card shadow-xl backdrop-blur-sm z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User Info Header */}
                      <div className="border-b border-forum-border p-3 bg-forum-bg/50">
                        <div className="text-[11px] font-mono text-forum-muted">Signed in as</div>
                        <div className="text-sm font-bold text-forum-text truncate">{currentUser.username}</div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            navigate(`/user/${currentUser.id}`);
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-[11px] font-mono text-forum-muted hover:text-forum-pink hover:bg-forum-hover transition-all duration-150 flex items-center gap-2 group"
                        >
                          <Users size={14} className="group-hover:scale-110 transition-transform" />
                          View Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate(`/user/${currentUser.id}?tab=settings`);
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-[11px] font-mono text-forum-muted hover:text-forum-pink hover:bg-forum-hover transition-all duration-150 flex items-center gap-2 group"
                        >
                          <Settings size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                          Settings
                        </button>
                        {isStaff && (
                          <>
                            <div className="border-t border-forum-border my-1" />
                            <button
                              onClick={() => {
                                navigate('/admin');
                                setIsUserDropdownOpen(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-[11px] font-mono text-forum-muted hover:text-forum-pink hover:bg-forum-hover transition-all duration-150 flex items-center gap-2 group"
                            >
                              <Shield size={14} className="group-hover:scale-110 transition-transform" />
                              Admin Panel
                            </button>
                          </>
                        )}
                      </div>

                      {/* Logout Button */}
                      <div className="border-t border-forum-border p-1">
                        <button
                          onClick={async () => {
                            await signOut();
                            setIsUserDropdownOpen(false);
                            navigate('/');
                          }}
                          className="w-full px-4 py-2.5 text-left text-[11px] font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 flex items-center gap-2 group rounded-md"
                        >
                          <LogOut size={14} className="group-hover:translate-x-1 transition-transform" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="group transition-all duration-200 flex items-center gap-1.5 rounded-lg border border-forum-border px-3 py-2 text-[11px] font-mono font-medium text-forum-muted hover:border-forum-pink/50 hover:bg-forum-hover hover:text-forum-pink active:scale-95"
                >
                  <LoginIcon size={13} className="group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="group transition-all duration-200 flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-forum-pink to-forum-pink/80 px-4 py-2 text-[11px] font-mono font-bold text-white hover:from-forum-pink/90 hover:to-forum-pink/70 hover:shadow-lg hover:shadow-forum-pink/30 active:scale-95"
                >
                  <UserPlus size={13} className="group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Sign Up</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar - Enhanced */}
      <nav className="hidden md:block border-b border-forum-border/50 bg-forum-card-alt/40 backdrop-blur-sm relative">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="flex items-center gap-0.5 h-11 overflow-x-auto scrollbar-hide">
            {navLinks.map((link, idx) => (
              <div key={link.label} className="relative group">
                <button
                  onClick={() => navigate(link.href)}
                  className={`transition-all duration-200 flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[11px] font-mono font-medium whitespace-nowrap relative overflow-hidden ${
                    link.active
                      ? 'text-forum-pink'
                      : 'text-forum-muted hover:text-forum-text'
                  }`}
                >
                  {/* Active indicator underline */}
                  {link.active && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-forum-pink/0 via-forum-pink to-forum-pink/0 animate-pulse" />
                  )}
                  
                  <link.icon 
                    size={13} 
                    className={`transition-all duration-200 ${link.active ? 'scale-110' : 'group-hover:scale-110'}`}
                  />
                  {link.label}
                </button>
                
                {/* Hover background effect */}
                <div className={`absolute inset-0 rounded-md bg-forum-pink/5 -z-10 transition-all duration-200 ${link.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Breadcrumb Navigation */}
      <NavbarBreadcrumb />
    </header>
  );
}

