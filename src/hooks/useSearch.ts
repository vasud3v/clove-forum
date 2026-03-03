import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface QuickSearchResult {
    id: string;
    type: 'thread' | 'user';
    title: string;
    subtitle: string;
    avatar?: string;
    link: string;
    categoryName?: string;
    createdAt?: string;
}

const RECENT_SEARCHES_KEY = 'chuglii_recent_searches';
const MAX_RECENT = 8;
const DEBOUNCE_MS = 300;

function getRecentSearches(): string[] {
    try {
        const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveRecentSearches(searches: string[]) {
    try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)));
    } catch {
        // localStorage might be full or disabled
    }
}

export function useSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<QuickSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const performQuickSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        // Cancel any in-flight request
        if (abortRef.current) {
            abortRef.current.abort();
        }
        abortRef.current = new AbortController();

        setIsLoading(true);

        try {
            const searchResults: QuickSearchResult[] = [];

            // Fetch threads (top 5)
            const { data: threads } = await supabase
                .from('threads')
                .select(`
          id, title, excerpt, created_at, author_id,
          author:forum_users!threads_author_id_fkey(username, avatar),
          category:categories!threads_category_id_fkey(name)
        `)
                .ilike('title', `%${q}%`)
                .order('created_at', { ascending: false })
                .limit(5);

            if (threads) {
                for (const t of threads) {
                    const author = Array.isArray(t.author) ? t.author[0] : t.author;
                    const category = Array.isArray(t.category) ? t.category[0] : t.category;
                    searchResults.push({
                        id: t.id,
                        type: 'thread',
                        title: t.title,
                        subtitle: (author as any)?.username || 'Unknown',
                        avatar: (author as any)?.avatar,
                        link: `/thread/${t.id}`,
                        categoryName: (category as any)?.name,
                        createdAt: t.created_at,
                    });
                }
            }

            // Fetch users (top 3)
            const { data: users } = await supabase
                .from('forum_users')
                .select('id, username, avatar, reputation, post_count')
                .ilike('username', `%${q}%`)
                .order('reputation', { ascending: false })
                .limit(3);

            if (users) {
                for (const u of users) {
                    searchResults.push({
                        id: u.id,
                        type: 'user',
                        title: u.username,
                        subtitle: `${u.post_count} posts · ${u.reputation} rep`,
                        avatar: u.avatar,
                        link: `/user/${u.id}`,
                    });
                }
            }

            setResults(searchResults);
        } catch (error: any) {
            if (error?.name !== 'AbortError') {
                console.error('Quick search error:', error);
                setResults([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounced search whenever query changes
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (!query.trim()) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        debounceRef.current = setTimeout(() => {
            performQuickSearch(query);
        }, DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, performQuickSearch]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortRef.current) {
                abortRef.current.abort();
            }
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const addRecentSearch = useCallback((term: string) => {
        const trimmed = term.trim();
        if (!trimmed) return;
        setRecentSearches((prev) => {
            const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
            const updated = [trimmed, ...filtered].slice(0, MAX_RECENT);
            saveRecentSearches(updated);
            return updated;
        });
    }, []);

    const removeRecentSearch = useCallback((term: string) => {
        setRecentSearches((prev) => {
            const updated = prev.filter((s) => s !== term);
            saveRecentSearches(updated);
            return updated;
        });
    }, []);

    const clearRecentSearches = useCallback(() => {
        setRecentSearches([]);
        saveRecentSearches([]);
    }, []);

    return {
        query,
        setQuery,
        results,
        isLoading,
        recentSearches,
        addRecentSearch,
        removeRecentSearch,
        clearRecentSearches,
    };
}
