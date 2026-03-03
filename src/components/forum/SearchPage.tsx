import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search,
    MessageCircle,
    Eye,
    Clock,
    User,
    FileText,
    ArrowUpDown,
    ChevronRight,
    Home as HomeIcon,
    Loader2,
    Inbox,
    X,
    Trash2,
    AlertCircle,
    TrendingUp,
} from 'lucide-react';
import ForumHeader from '@/components/forum/ForumHeader';
import MobileBottomNav from '@/components/forum/MobileBottomNav';
import { getUserAvatar } from '@/lib/avatar';
import { supabase } from '@/lib/supabase';
import { useForumContext } from '@/context/ForumContext';
import { useSearch } from '@/hooks/useSearch';

interface SearchResult {
    id: string;
    type: 'thread' | 'post' | 'user';
    title: string;
    excerpt: string;
    authorId?: string;
    author?: string;
    authorAvatar?: string;
    categoryName?: string;
    replyCount?: number;
    viewCount?: number;
    createdAt: string;
    link: string;
}

// Sanitize and escape special regex characters
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Highlight matching text with a styled <mark>
function HighlightText({ text, query }: { text: string; query: string }) {
    // Edge case: empty or invalid inputs
    if (!query?.trim() || !text) return <>{text || ''}</>;
    
    try {
        const escaped = escapeRegex(query.trim());
        const regex = new RegExp(`(${escaped})`, 'gi');
        const parts = text.split(regex);
        
        return (
            <>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <mark key={i} className="bg-primary/20 text-primary  px-0.5 font-medium">
                            {part}
                        </mark>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </>
        );
    } catch (error) {
        // Fallback if regex fails
        console.error('HighlightText error:', error);
        return <>{text}</>;
    }
}

export default function SearchPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [searchQuery, setSearchQuery] = useState('');
    const [pageSearchQuery, setPageSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'threads' | 'posts' | 'users'>('threads');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'views'>('relevance');
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const { getUserProfile } = useForumContext();
    const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useSearch();
    const hasInitRef = useRef(false);

    // Auto-focus on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Sync from URL query params (handles both initial load and header search navigation)
    useEffect(() => {
        const urlQuery = new URLSearchParams(location.search).get('q') || '';
        if (urlQuery) {
            setPageSearchQuery(urlQuery);
            performSearchFn(urlQuery, activeTab);
        } else if (hasInitRef.current) {
            // Only clear if not first render
            setPageSearchQuery('');
            setResults([]);
            setError(null);
        }
        hasInitRef.current = true;
    }, [location.search]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const performSearchFn = useCallback(async (query: string, tab: string) => {
        // Edge case: empty or whitespace-only query
        const trimmedQuery = query?.trim();
        if (!trimmedQuery) {
            setResults([]);
            setError(null);
            return;
        }

        // Edge case: query too long (prevent performance issues)
        if (trimmedQuery.length > 200) {
            setError('Search query is too long. Please use fewer than 200 characters.');
            setResults([]);
            return;
        }

        // Cancel any in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setError(null);

        try {
            const searchResults: SearchResult[] = [];

            // Sanitize query for SQL ILIKE (escape % and _)
            const sanitizedQuery = trimmedQuery.replace(/[%_]/g, '\\$&');

            if (tab === 'threads' || tab === 'all') {
                const { data: threads, error: threadsError } = await supabase
                    .from('threads')
                    .select(`
                        id, title, excerpt, created_at, reply_count, view_count, author_id,
                        author:forum_users!threads_author_id_fkey(username, avatar),
                        category:categories!threads_category_id_fkey(name)
                    `)
                    .or(`title.ilike.%${sanitizedQuery}%,excerpt.ilike.%${sanitizedQuery}%`)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (threadsError) throw threadsError;

                if (threads) {
                    for (const t of threads) {
                        const author = Array.isArray(t.author) ? t.author[0] : t.author;
                        const category = Array.isArray(t.category) ? t.category[0] : t.category;
                        searchResults.push({
                            id: t.id,
                            type: 'thread',
                            title: t.title || 'Untitled Thread',
                            excerpt: t.excerpt || '',
                            authorId: t.author_id,
                            author: (author as any)?.username || 'Unknown',
                            authorAvatar: (author as any)?.avatar,
                            categoryName: (category as any)?.name,
                            replyCount: t.reply_count || 0,
                            viewCount: t.view_count || 0,
                            createdAt: t.created_at,
                            link: `/thread/${t.id}`,
                        });
                    }
                }
            }

            if (tab === 'posts') {
                const { data: posts, error: postsError } = await supabase
                    .from('posts')
                    .select(`
                        id, content, created_at, thread_id, author_id,
                        author:forum_users!posts_author_id_fkey(username, avatar),
                        thread:threads!posts_thread_id_fkey(title)
                    `)
                    .ilike('content', `%${sanitizedQuery}%`)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (postsError) throw postsError;

                if (posts) {
                    for (const p of posts) {
                        const author = Array.isArray(p.author) ? p.author[0] : p.author;
                        const thread = Array.isArray(p.thread) ? p.thread[0] : p.thread;
                        
                        // Edge case: handle missing or null content
                        const content = p.content || '';
                        const excerpt = content.length > 200 ? content.substring(0, 200) + '...' : content;
                        
                        searchResults.push({
                            id: p.id,
                            type: 'post',
                            title: (thread as any)?.title || 'Post',
                            excerpt: excerpt,
                            authorId: p.author_id,
                            author: (author as any)?.username || 'Unknown',
                            authorAvatar: (author as any)?.avatar,
                            createdAt: p.created_at,
                            link: `/thread/${p.thread_id}#post-${p.id}`,
                        });
                    }
                }
            }

            if (tab === 'users') {
                const { data: users, error: usersError } = await supabase
                    .from('forum_users')
                    .select('id, username, avatar, reputation, post_count, join_date')
                    .ilike('username', `%${sanitizedQuery}%`)
                    .order('reputation', { ascending: false })
                    .limit(50);

                if (usersError) throw usersError;

                if (users) {
                    for (const u of users) {
                        searchResults.push({
                            id: u.id,
                            type: 'user',
                            title: u.username || 'Unknown User',
                            excerpt: `${u.post_count || 0} posts · ${u.reputation || 0} reputation`,
                            authorId: u.id,
                            authorAvatar: u.avatar,
                            createdAt: u.join_date,
                            link: `/user/${u.id}`,
                        });
                    }
                }
            }

            // Apply sorting
            if (sortBy === 'date') {
                searchResults.sort((a, b) => {
                    const dateA = new Date(a.createdAt).getTime();
                    const dateB = new Date(b.createdAt).getTime();
                    // Edge case: handle invalid dates
                    if (isNaN(dateA)) return 1;
                    if (isNaN(dateB)) return -1;
                    return dateB - dateA;
                });
            } else if (sortBy === 'views' && tab === 'threads') {
                searchResults.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
            }

            setResults(searchResults);
        } catch (error: any) {
            // Edge case: handle aborted requests
            if (error?.name === 'AbortError') {
                return;
            }
            
            console.error('Search error:', error);
            setError('An error occurred while searching. Please try again.');
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [sortBy]);

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = pageSearchQuery.trim();
        
        // Edge case: prevent empty searches
        if (!trimmed) {
            inputRef.current?.focus();
            return;
        }

        // Edge case: prevent duplicate searches
        const currentQuery = new URLSearchParams(location.search).get('q');
        if (currentQuery === trimmed) {
            return;
        }

        addRecentSearch(trimmed);
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    };

    const handleTabChange = (tab: 'threads' | 'posts' | 'users') => {
        setActiveTab(tab);
        if (pageSearchQuery.trim()) {
            performSearchFn(pageSearchQuery, tab);
        }
    };

    const handleClearSearch = () => {
        setPageSearchQuery('');
        setResults([]);
        setError(null);
        navigate('/search');
        inputRef.current?.focus();
    };

    const formatTimeAgo = (dateStr: string) => {
        // Edge case: handle missing or invalid dates
        if (!dateStr) return 'Unknown';
        
        const time = new Date(dateStr).getTime();
        if (isNaN(time)) return 'Unknown';
        
        const diff = Date.now() - time;
        if (diff < 0) return 'just now';
        
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        
        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo ago`;
        
        const years = Math.floor(months / 12);
        return `${years}y ago`;
    };

    const tabs = [
        { key: 'threads' as const, label: 'Threads', icon: FileText },
        { key: 'posts' as const, label: 'Posts', icon: MessageCircle },
        { key: 'users' as const, label: 'Users', icon: User },
    ];

    const showRecentSearches = !pageSearchQuery.trim() && recentSearches.length > 0;

    return (
        <div className="min-h-screen bg-forum-bg">
            <ForumHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMobileMenuOpen={isMobileMenuOpen}
            />

            {/* Breadcrumb */}
            <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-4 pb-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted">
                    <HomeIcon size={11} className="text-primary" />
                    <span
                        className="text-forum-text hover:text-primary transition-forum cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        Forums
                    </span>
                    <ChevronRight size={10} />
                    <span className="text-forum-muted">Search</span>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-4 py-4 lg:px-6 pb-24 lg:pb-8 space-y-4">
                {/* Search Header */}
                <div className="hud-panel p-6 shadow-brutal">
                    <h1 className="text-[18px] font-mono font-bold text-forum-text mb-4 flex items-center gap-2">
                        <Search size={18} className="text-primary" />
                        Search Forum
                    </h1>
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forum-muted pointer-events-none" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search threads, posts, users..."
                            value={pageSearchQuery}
                            onChange={(e) => setPageSearchQuery(e.target.value)}
                            maxLength={200}
                            className="transition-all duration-200 w-full  border border-forum-border bg-forum-bg/40 hover:bg-forum-bg/60 hover:border-forum-border/80 py-3 pl-11 pr-10 text-[13px] font-mono text-forum-text placeholder-forum-muted/70 outline-none focus:border-primary focus:bg-forum-bg focus:placeholder-forum-muted focus:shadow-brutal focus:shadow-brutal-sm focus:ring-2 focus:ring-primary"
                        />
                        {pageSearchQuery && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-forum-muted hover:text-primary transition-forum"
                                aria-label="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </form>
                    {pageSearchQuery.length > 180 && (
                        <p className="text-[9px] font-mono text-forum-muted mt-2">
                            {pageSearchQuery.length}/200 characters
                        </p>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="hud-panel p-4 border-red-500/30 bg-red-500/5">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[12px] font-mono text-red-400 font-medium">Search Error</p>
                                <p className="text-[11px] font-mono text-forum-muted mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Searches (when query is empty) */}
                {showRecentSearches && (
                    <div className="hud-panel p-4 shadow-brutal-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-forum-muted flex items-center gap-1.5">
                                <Clock size={11} className="text-primary/60" />
                                Recent Searches
                            </span>
                            <button
                                onClick={clearRecentSearches}
                                className="text-[9px] font-mono text-forum-muted hover:text-primary transition-forum flex items-center gap-1"
                                aria-label="Clear all recent searches"
                            >
                                <Trash2 size={9} />
                                Clear all
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {recentSearches.map((term) => (
                                <button
                                    key={term}
                                    onClick={() => {
                                        setPageSearchQuery(term);
                                        navigate(`/search?q=${encodeURIComponent(term)}`);
                                    }}
                                    className="group flex items-center gap-1.5  border border-forum-border/40 bg-forum-bg px-3 py-1.5 text-[11px] font-mono text-forum-text hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-forum"
                                >
                                    <Clock size={10} className="text-forum-muted group-hover:text-primary transition-colors" />
                                    <span className="max-w-[200px] truncate">{term}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeRecentSearch(term);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-red-400"
                                        aria-label={`Remove ${term} from recent searches`}
                                    >
                                        <X size={9} />
                                    </button>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs + Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1 flex-wrap">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`transition-forum flex items-center gap-1.5  px-3 py-2 text-[11px] font-mono font-medium ${
                                    activeTab === tab.key
                                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                                        : 'text-forum-muted hover:text-forum-text hover:bg-forum-hover border border-transparent'
                                }`}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const next = sortBy === 'relevance' ? 'date' : sortBy === 'date' ? 'views' : 'relevance';
                                setSortBy(next);
                                if (pageSearchQuery.trim()) {
                                    performSearchFn(pageSearchQuery, activeTab);
                                }
                            }}
                            disabled={!pageSearchQuery.trim() || isLoading}
                            className="transition-forum flex items-center gap-1.5  px-3 py-2 text-[10px] font-mono text-forum-muted hover:text-primary border border-forum-border/30 hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowUpDown size={10} />
                            Sort: {sortBy}
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="space-y-2">
                    {isLoading ? (
                        <div className="hud-panel flex flex-col items-center justify-center py-16">
                            <Loader2 size={32} className="text-primary animate-spin mb-3" />
                            <span className="text-[12px] font-mono text-forum-muted">Searching...</span>
                        </div>
                    ) : results.length > 0 ? (
                        <>
                            {results.map((result) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => navigate(result.link)}
                                    className="transition-forum w-full text-left hud-panel p-4 hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-md group"
                                >
                                    <div className="flex items-start gap-3">
                                        {result.type === 'user' || result.authorAvatar ? (
                                            <img
                                                src={result.authorAvatar || getUserAvatar('', result.title)}
                                                alt={result.title}
                                                className="h-10 w-10 border border-forum-border object-cover flex-shrink-0"
                                                style={{ borderRadius: result.type === 'user' ? '0.375rem' : '4px' }}
                                                onError={(e) => {
                                                    e.currentTarget.src = getUserAvatar('', result.title);
                                                }}
                                            />
                                        ) : (
                                            <div className="h-10 w-10  border border-forum-border/30 bg-forum-bg flex items-center justify-center flex-shrink-0">
                                                {result.type === 'thread' ? (
                                                    <FileText size={16} className="text-primary/50" />
                                                ) : (
                                                    <MessageCircle size={16} className="text-primary/50" />
                                                )}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-[7px] font-mono font-bold uppercase tracking-wider px-1.5 py-[1px]  border border-forum-border/30 text-forum-muted bg-forum-bg">
                                                    {result.type}
                                                </span>
                                                {result.categoryName && (
                                                    <span className="text-[8px] font-mono text-primary/60 truncate max-w-[150px]">
                                                        {result.categoryName}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-[13px] font-mono font-semibold text-forum-text group-hover:text-primary transition-colors line-clamp-2 break-words">
                                                <HighlightText text={result.title} query={pageSearchQuery} />
                                            </h3>
                                            {result.excerpt && (
                                                <p className="text-[11px] font-mono text-forum-muted line-clamp-2 mt-1 break-words">
                                                    <HighlightText text={result.excerpt} query={pageSearchQuery} />
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-2 text-[9px] font-mono text-forum-muted flex-wrap">
                                                {result.author && (
                                                    <span className="flex items-center gap-1">
                                                        <User size={9} /> 
                                                        <span className="truncate max-w-[100px]">{result.author}</span>
                                                    </span>
                                                )}
                                                {result.replyCount !== undefined && (
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle size={9} /> {result.replyCount}
                                                    </span>
                                                )}
                                                {result.viewCount !== undefined && (
                                                    <span className="flex items-center gap-1">
                                                        <Eye size={9} /> {result.viewCount?.toLocaleString()}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock size={9} /> {formatTimeAgo(result.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </>
                    ) : pageSearchQuery.trim() && !error ? (
                        <div className="hud-panel flex flex-col items-center justify-center py-16">
                            <Inbox size={48} className="text-primary/20 mb-4" />
                            <h3 className="text-[14px] font-bold text-forum-text font-mono mb-2">
                                No results found
                            </h3>
                            <p className="text-[11px] text-forum-muted font-mono text-center max-w-sm">
                                Try different keywords, check your spelling, or switch to a different tab
                            </p>
                        </div>
                    ) : !showRecentSearches && !error ? (
                        <div className="hud-panel flex flex-col items-center justify-center py-16">
                            <Search size={48} className="text-primary/20 mb-4" />
                            <h3 className="text-[14px] font-bold text-forum-text font-mono mb-2">
                                Search the forum
                            </h3>
                            <p className="text-[11px] text-forum-muted font-mono text-center max-w-sm">
                                Enter a query above to search threads, posts, and users
                            </p>
                        </div>
                    ) : null}
                </div>

                {/* Result count */}
                {!isLoading && results.length > 0 && (
                    <div className="text-[10px] font-mono text-forum-muted text-center py-2 flex items-center justify-center gap-2">
                        <TrendingUp size={10} className="text-primary/60" />
                        Showing {results.length} result{results.length !== 1 ? 's' : ''} for "{pageSearchQuery}"
                    </div>
                )}
            </div>

            <MobileBottomNav />
        </div>
    );
}
