import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    FileText,
    User,
    Clock,
    X,
    ArrowRight,
    Loader2,
    Trash2,
} from 'lucide-react';
import type { QuickSearchResult } from '@/hooks/useSearch';

interface SearchDropdownProps {
    isOpen: boolean;
    query: string;
    results: QuickSearchResult[];
    isLoading: boolean;
    recentSearches: string[];
    onClose: () => void;
    onSelectResult: (link: string) => void;
    onRecentClick: (term: string) => void;
    onRemoveRecent: (term: string) => void;
    onClearRecent: () => void;
    onViewAll: () => void;
    onActiveIndexChange?: (index: number) => void;
}

export default function SearchDropdown({
    isOpen,
    query,
    results,
    isLoading,
    recentSearches,
    onClose,
    onSelectResult,
    onRecentClick,
    onRemoveRecent,
    onClearRecent,
    onViewAll,
    onActiveIndexChange,
}: SearchDropdownProps) {
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Build a flat list of selectable items for keyboard navigation
    const selectableItems = useMemo(() => {
        const items: { type: 'result' | 'recent' | 'viewAll'; value: string }[] = [];
        if (!query.trim()) {
            recentSearches.forEach((s) => items.push({ type: 'recent', value: s }));
        } else {
            results.forEach((r) => items.push({ type: 'result', value: r.link }));
            if (results.length > 0) {
                items.push({ type: 'viewAll', value: '' });
            }
        }
        return items;
    }, [query, results, recentSearches]);

    // Reset active index when results/query change
    useEffect(() => {
        setActiveIndex(-1);
        onActiveIndexChange?.(-1);
    }, [query, results.length]);

    // Keyboard handler (called from parent's onKeyDown)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) => {
                    const next = prev < selectableItems.length - 1 ? prev + 1 : 0;
                    onActiveIndexChange?.(next);
                    return next;
                });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) => {
                    const next = prev > 0 ? prev - 1 : selectableItems.length - 1;
                    onActiveIndexChange?.(next);
                    return next;
                });
            } else if (e.key === 'Enter' && activeIndex >= 0) {
                e.preventDefault();
                const item = selectableItems[activeIndex];
                if (item.type === 'result') {
                    onSelectResult(item.value);
                } else if (item.type === 'recent') {
                    onRecentClick(item.value);
                } else if (item.type === 'viewAll') {
                    onViewAll();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeIndex, selectableItems, onClose, onSelectResult, onRecentClick, onViewAll]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // Use a short delay so the focus event on the input doesn't immediately trigger close
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClick);
        }, 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClick);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const threads = results.filter((r) => r.type === 'thread');
    const users = results.filter((r) => r.type === 'user');

    const formatTimeAgo = (dateStr?: string) => {
        if (!dateStr) return '';
        const time = new Date(dateStr).getTime();
        if (isNaN(time)) return '';
        const diff = Date.now() - time;
        if (diff < 0) return 'now';
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    const showRecent = !query.trim() && recentSearches.length > 0;
    const showResults = query.trim() && !isLoading && results.length > 0;
    const showEmpty = query.trim() && !isLoading && results.length === 0;
    const showLoading = query.trim() && isLoading;

    let flatIndex = -1;

    return (
        <div ref={containerRef} className="w-full overflow-visible">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute left-0 right-0 top-full mt-2 z-dropdown  border border-forum-border/70 bg-forum-card/95 -lg shadow-brutal-lg shadow-black/40 overflow-hidden min-w-full"
                        style={{ zIndex: 9999 }}
                    >
                        {/* Recent Searches */}
                        {showRecent && (
                            <div className="p-3 border-b border-forum-border/30">
                                <div className="flex items-center justify-between mb-2.5">
                                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-forum-muted/80 flex items-center gap-1.5">
                                        <Clock size={10} className="text-primary/60" />
                                        Recent
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClearRecent();
                                        }}
                                        className="text-[8px] font-mono text-forum-muted hover:text-primary transition-forum flex items-center gap-1 hover:bg-forum-hover/50 px-1.5 py-1 rounded"
                                    >
                                        <Trash2 size={8} />
                                        Clear
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {recentSearches.map((term) => {
                                        flatIndex++;
                                        const idx = flatIndex;
                                        return (
                                            <div
                                                key={term}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => onRecentClick(term)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') onRecentClick(term); }}
                                                className={`w-full flex items-center gap-2.5 px-2.5 py-2  text-left transition-all duration-150 group cursor-pointer ${activeIndex === idx
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-forum-text hover:bg-forum-hover/50'
                                                    }`}
                                            >
                                                <Clock size={12} className="text-forum-muted/60 flex-shrink-0 group-hover:text-primary/60 transition-colors" />
                                                <span className="text-[12px] font-mono truncate flex-1 text-sm">{term}</span>
                                                <span
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveRecent(term);
                                                    }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onRemoveRecent(term); } }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-red-400 cursor-pointer flex-shrink-0"
                                                >
                                                    <X size={10} />
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Loading */}
                        {showLoading && (
                            <div className="flex items-center justify-center py-10 gap-2">
                                <Loader2 size={16} className="text-primary animate-spin" />
                                <span className="text-[11px] font-mono text-forum-muted/70">Searching...</span>
                            </div>
                        )}

                        {/* Results */}
                        {showResults && (
                            <div className="p-2 max-h-[400px] overflow-y-auto space-y-0.5">
                                {/* Threads */}
                                {threads.length > 0 && (
                                    <div className="mb-2">
                                        <div className="px-2 py-1.5 border-b border-forum-border/20">
                                            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-forum-muted/70 flex items-center gap-1.5">
                                                <FileText size={9} className="text-primary/50" />
                                                Threads
                                            </span>
                                        </div>
                                        <div className="space-y-0.5">
                                            {threads.map((result) => {
                                                flatIndex++;
                                                const idx = flatIndex;
                                                return (
                                                    <button
                                                        key={result.id}
                                                        onClick={() => onSelectResult(result.link)}
                                                        className={`w-full flex items-center gap-2.5 px-2.5 py-2  text-left transition-all duration-150 ${activeIndex === idx
                                                            ? 'bg-primary/10'
                                                            : 'hover:bg-forum-hover/50'
                                                            }`}
                                                    >
                                                        {result.avatar ? (
                                                            <img
                                                                src={result.avatar}
                                                                alt=""
                                                                className="h-7 w-7 rounded object-cover border border-forum-border/40 flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="h-7 w-7 rounded border border-forum-border/30 bg-forum-bg/50 flex items-center justify-center flex-shrink-0">
                                                                <FileText size={11} className="text-primary/30" />
                                                            </div>
                                                        )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`text-[12px] font-mono font-medium truncate ${activeIndex === idx ? 'text-primary' : 'text-forum-text'
                                                                }`}>
                                                                {result.title}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                            {result.categoryName && (
                                                                <span className="text-[8px] font-mono text-primary/50 bg-primary/5 px-1.5 py-[1px] rounded">
                                                                    {result.categoryName}
                                                                </span>
                                                            )}
                                                            {result.createdAt && (
                                                                <span className="text-[9px] font-mono text-forum-muted/60">
                                                                    {formatTimeAgo(result.createdAt)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        </div>
                                    </div>
                                )}

                                {/* Users */}
                                {users.length > 0 && (
                                    <div className="mb-2">
                                        <div className="px-2 py-1.5 border-b border-forum-border/20">
                                            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-forum-muted/70 flex items-center gap-1.5">
                                                <User size={9} className="text-primary/50" />
                                                Users
                                            </span>
                                        </div>
                                        <div className="space-y-0.5">
                                            {users.map((result) => {
                                                flatIndex++;
                                                const idx = flatIndex;
                                                return (
                                                    <button
                                                        key={result.id}
                                                        onClick={() => onSelectResult(result.link)}
                                                        className={`w-full flex items-center gap-2.5 px-2.5 py-2  text-left transition-all duration-150 ${activeIndex === idx
                                                            ? 'bg-primary/10'
                                                            : 'hover:bg-forum-hover/50'
                                                            }`}
                                                    >
                                                        {result.avatar ? (
                                                            <img
                                                                src={result.avatar}
                                                                alt=""
                                                                className="h-7 w-7  object-cover border border-forum-border/40 flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="h-7 w-7  border border-forum-border/30 bg-forum-bg/50 flex items-center justify-center flex-shrink-0">
                                                                <User size={11} className="text-primary/30" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <span className={`text-[12px] font-mono font-medium truncate inline-block ${activeIndex === idx ? 'text-primary' : 'text-forum-text'
                                                                }`}>
                                                                {result.title}
                                                            </span>
                                                            <div className="text-[9px] font-mono text-forum-muted/60 mt-0.5 truncate">
                                                                {result.subtitle}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* View All */}
                                {(() => {
                                    flatIndex++;
                                    const idx = flatIndex;
                                    return (
                                        <button
                                            onClick={onViewAll}
                                            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 mt-1  text-[11px] font-mono font-medium transition-all duration-150 border border-forum-border/30 ${activeIndex === idx
                                                ? 'bg-primary/10 text-primary border-primary/30'
                                                : 'text-forum-muted/70 hover:text-primary hover:bg-primary/5 hover:border-primary/30'
                                                }`}
                                        >
                                            View all results
                                            <ArrowRight size={11} />
                                        </button>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Empty state */}
                        {showEmpty && (
                            <div className="flex flex-col items-center justify-center py-10 px-4">
                                <Search size={24} className="text-primary/30 mb-3" />
                                <span className="text-[12px] font-mono text-forum-muted/70 text-center">No results found for your search</span>
                            </div>
                        )}

                        {/* Nothing-yet state (empty query, no recents) */}
                        {!query.trim() && recentSearches.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 px-4">
                                <Search size={24} className="text-primary/30 mb-3" />
                                <span className="text-[12px] font-mono text-forum-muted/70 text-center">Start typing to search for threads, posts, and users</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
