import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface ForumPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ForumPagination({
  currentPage,
  totalPages,
  onPageChange,
}: ForumPaginationProps) {
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
    
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis-start');
    }

    // Show pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis-end');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5">
      {/* First page */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="transition-forum flex items-center justify-center rounded border border-forum-border bg-forum-card w-8 h-8 text-[10px] font-mono font-semibold text-forum-muted hover:bg-forum-hover hover:text-forum-text hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-forum-card disabled:hover:border-forum-border"
        title="First page"
      >
        <ChevronsLeft size={12} />
      </button>

      {/* Previous */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="transition-forum flex items-center gap-1 rounded border border-forum-border bg-forum-card px-2.5 h-8 text-[10px] font-mono font-semibold text-forum-muted hover:bg-forum-hover hover:text-forum-text hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-forum-card disabled:hover:border-forum-border"
      >
        <ChevronLeft size={12} />
        <span className="hidden sm:inline">Prev</span>
      </button>

      <div className="flex gap-1">
        {visiblePages.map((page, idx) => {
          if (typeof page === 'string') {
            return (
              <span
                key={page}
                className="flex items-center justify-center w-8 h-8 text-[10px] font-mono text-forum-muted/40"
              >
                ···
              </span>
            );
          }
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`transition-forum  w-8 h-8 text-[10px] font-mono font-bold ${
                currentPage === page
                  ? 'bg-primary to-forum-pink/90 text-white shadow-[0_0_12px_rgba(255,45,146,0.3)] border border-primary/60'
                  : 'border border-forum-border bg-forum-card text-forum-muted hover:bg-forum-hover hover:text-forum-text hover:border-primary/30'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="transition-forum flex items-center gap-1 rounded border border-forum-border bg-forum-card px-2.5 h-8 text-[10px] font-mono font-semibold text-forum-muted hover:bg-forum-hover hover:text-forum-text hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-forum-card disabled:hover:border-forum-border"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={12} />
      </button>

      {/* Last page */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="transition-forum flex items-center justify-center rounded border border-forum-border bg-forum-card w-8 h-8 text-[10px] font-mono font-semibold text-forum-muted hover:bg-forum-hover hover:text-forum-text hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-forum-card disabled:hover:border-forum-border"
        title="Last page"
      >
        <ChevronsRight size={12} />
      </button>
    </div>
  );
}
