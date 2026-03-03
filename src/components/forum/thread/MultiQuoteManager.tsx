import { memo, useState, useCallback } from 'react';
import { PostData } from '@/types/forum';
import { X, MessageSquareQuote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuotedItem {
  postId: string;
  author: string;
  content: string;
  isPartial: boolean;
}

interface MultiQuoteManagerProps {
  quotes: QuotedItem[];
  onInsertQuotes: (quotes: QuotedItem[]) => void;
  onRemoveQuote: (index: number) => void;
  onClearAll: () => void;
}

const MultiQuoteManager = memo(({ quotes, onInsertQuotes, onRemoveQuote, onClearAll }: MultiQuoteManagerProps) => {
  const insertAllQuotes = useCallback(() => {
    if (quotes.length > 0) {
      onInsertQuotes(quotes);
    }
  }, [quotes, onInsertQuotes]);

  if (quotes.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-6 z-50 w-80 hud-panel  shadow-brutal-lg border-2 border-primary/30">
      {/* Header */}
      <div className="px-4 py-2 bg-primary/10 border-b border-forum-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareQuote size={14} className="text-primary" />
          <span className="text-[11px] font-mono font-bold text-forum-text">
            Multi-Quote ({quotes.length})
          </span>
        </div>
        <button
          onClick={onClearAll}
          className="text-forum-muted hover:text-primary transition-colors"
          title="Clear all"
        >
          <X size={14} />
        </button>
      </div>

      {/* Quote List */}
      <div className="max-h-60 overflow-y-auto p-2 space-y-2">
        {quotes.map((quote, index) => (
          <div
            key={`${quote.postId}-${index}`}
            className="bg-forum-bg/50 rounded border border-forum-border/20 p-2 group"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-[10px] font-mono text-primary font-semibold">
                @{quote.author}
              </span>
              <button
                onClick={() => onRemoveQuote(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-forum-muted hover:text-red-400"
              >
                <X size={12} />
              </button>
            </div>
            <p className="text-[10px] font-mono text-forum-muted line-clamp-2">
              {quote.isPartial && '... '}
              {quote.content}
              {quote.isPartial && ' ...'}
            </p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-3 py-2 bg-forum-bg/30 border-t border-forum-border/20 flex gap-2">
        <Button
          onClick={insertAllQuotes}
          className="flex-1 bg-primary hover:bg-primary/80 text-white text-[10px] font-mono h-8"
        >
          Insert All Quotes
        </Button>
      </div>
    </div>
  );
});

MultiQuoteManager.displayName = 'MultiQuoteManager';

export default MultiQuoteManager;
export type { QuotedItem };
