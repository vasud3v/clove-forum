import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, Home, MessageSquare, Users, HelpCircle, LogIn, LogOut, Shield, BarChart3, Bookmark, Bell, Mail, UserPlus, LifeBuoy, ChevronDown, Settings, LogIn as LoginIcon, Zap, Target } from 'lucide-react';
import ChugliLogo from '@/components/forum/ChugliLogo';
import NotificationCenter from '@/components/forum/NotificationCenter';
import RoleBadge from '@/components/forum/RoleBadge';
import SearchDropdown from '@/components/forum/SearchDropdown';
import { NavbarBreadcrumb } from '@/components/forum/NavbarBreadcrumb';
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
      <div className="sticky top-0 z-header border-b-4 border-border bg-primary overflow-visible">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6 gap-4 overflow-visible">
          {/* Logo Section - Enhanced */}
          <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
            <button
              onClick={onMobileMenuToggle}
              className="group transition-all duration-150 p-2 border-2 border-primary-foreground/30 text-primary-foreground hover:bg-secondary hover:text-secondary-foreground lg:hidden"
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
              className="flex items-center gap-0 cursor-pointer group h-10 transition-transform duration-150 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px]"
              aria-label="Go to home"
            >
              <div className="transition-all duration-300 group-hover:scale-110 group-active:scale-95">
                <ChugliLogo size={40} />
              </div>
            </button>
          </div>

          {/* Search Bar - Enhanced */}
          <div className="hidden flex-1 max-w-md mx-4 md:block relative z-dropdown overflow-visible">
            <div className="relative group w-full overflow-visible">
              <Search
                size={16}
                strokeWidth={3}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/70 group-focus-within:text-foreground transition-colors duration-150 pointer-events-none font-bold"
              />
              <input
                type="text"
                placeholder="Search threads, posts, users..."
                value={liveQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={handleFocus}
                className="transition-all duration-150 w-full border-3 border-border bg-background py-2 pl-10 pr-10 text-sm font-bold text-foreground placeholder-muted-foreground outline-none focus:ring-4 focus:ring-accent shadow-brutal-sm"
              />
              {liveQuery && (
                <button
                  onClick={() => {
                    setLiveQuery('');
                    onSearchChange('');
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-all duration-150"
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
              className="group transition-all duration-150 p-2 border-2 border-primary-foreground/30 text-primary-foreground hover:bg-secondary hover:text-secondary-foreground md:hidden"
              aria-label="Open search"
            >
              <Search size={18} className="group-hover:scale-110 transition-transform" />
            </button>

            {/* Notifications */}
            {isAuthenticated && <NotificationCenter />}

            {/* User Auth Section */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* User Profile Dropdown */}
                <div ref={userDropdownRef} className="relative">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="group transition-all duration-150 flex items-center gap-2 border-2 border-primary-foreground/30 p-1.5 hover:bg-secondary hover:text-secondary-foreground hover:border-border active:translate-y-[1px]"
                    aria-expanded={isUserDropdownOpen}
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.username}
                      className="h-7 w-7 object-cover border-2 border-border transition-all"
                    />
                    <span className="hidden text-xs font-bold text-primary-foreground sm:inline-block max-w-[100px] truncate uppercase">
                      {currentUser.username}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`hidden sm:block transition-transform duration-300 ${isUserDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 border-3 border-border bg-background shadow-brutal z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* User Info Header */}
                      <div className="border-b-3 border-border p-3 bg-muted">
                        <div className="text-xs font-bold text-muted-foreground uppercase">Signed in as</div>
                        <div className="text-sm font-black text-foreground truncate">{currentUser.username}</div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            navigate(`/user/${currentUser.id}`);
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-bold text-foreground hover:bg-secondary hover:text-secondary-foreground transition-all duration-150 flex items-center gap-2 group border-b border-border/30"
                        >
                          <Users size={14} className="group-hover:scale-110 transition-transform" />
                          View Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate(`/user/${currentUser.id}?tab=settings`);
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-bold text-foreground hover:bg-secondary hover:text-secondary-foreground transition-all duration-150 flex items-center gap-2 group border-b border-border/30"
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
                              className="w-full px-4 py-2.5 text-left text-xs font-bold text-foreground hover:bg-secondary hover:text-secondary-foreground transition-all duration-150 flex items-center gap-2 group border-b border-border/30"
                            >
                              <Shield size={14} className="group-hover:scale-110 transition-transform" />
                              Admin Panel
                            </button>
                          </>
                        )}
                      </div>

                      {/* Logout Button */}
                      <div className="border-t-3 border-border p-1">
                        <button
                          onClick={async () => {
                            await signOut();
                            setIsUserDropdownOpen(false);
                            navigate('/');
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-black text-destructive uppercase hover:bg-destructive hover:text-destructive-foreground transition-all duration-150 flex items-center gap-2 group"
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
                  className="group transition-all duration-150 flex items-center gap-1.5 border-2 border-primary-foreground/30 px-3 py-2 text-xs font-bold text-primary-foreground uppercase hover:bg-secondary hover:text-secondary-foreground hover:border-border active:translate-y-[1px]"
                >
                  <LoginIcon size={13} className="group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="group transition-all duration-150 flex items-center gap-1.5 bg-secondary text-secondary-foreground border-2 border-border px-4 py-2 text-xs font-black uppercase shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-brutal active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
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
      <nav className="hidden md:block border-b-3 border-border bg-background relative">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="flex items-center gap-0 h-11 overflow-x-auto scrollbar-hide">
            {navLinks.map((link, idx) => (
              <button
                key={link.label}
                onClick={() => navigate(link.href)}
                className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-4 transition-all duration-150 relative ${link.active
                    ? 'text-primary border-b-4 border-primary'
                    : 'text-muted-foreground hover:text-foreground border-b-4 border-transparent hover:border-border'
                  }`}
              >
                <link.icon
                  size={13}
                  className={`transition-transform duration-150 ${link.active ? 'scale-110' : 'group-hover:scale-110'}`}
                />
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Breadcrumb Navigation */}
      <NavbarBreadcrumb />
    </header>
  );
}

