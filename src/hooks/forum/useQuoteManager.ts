import { useState, useCallback } from 'react';
import { PostData } from '@/types/forum';

interface QuoteItem {
  postId: string;
  author: string;
  content: string;
  isPartial: boolean;
  timestamp?: string;
}

export const useQuoteManager = () => {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [activeQuote, setActiveQuote] = useState<QuoteItem | null>(null);

  // Add a quote to multi-quote collection
  const addToMultiQuote = useCallback((post: PostData, partialContent?: string) => {
    const quoteItem: QuoteItem = {
      postId: post.id,
      author: post.author.username,
      content: partialContent || post.content,
      isPartial: !!partialContent,
      timestamp: post.createdAt,
    };

    setQuotes(prev => {
      // Check if already exists
      const exists = prev.find(
        q => q.postId === post.id && q.content === quoteItem.content
      );
      if (exists) return prev;
      
      return [...prev, quoteItem];
    });
  }, []);

  // Remove a quote from multi-quote collection
  const removeFromMultiQuote = useCallback((index: number) => {
    setQuotes(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all quotes
  const clearAllQuotes = useCallback(() => {
    setQuotes([]);
  }, []);

  // Set active quote for immediate reply
  const setQuote = useCallback((post: PostData, partialContent?: string) => {
    setActiveQuote({
      postId: post.id,
      author: post.author.username,
      content: partialContent || post.content,
      isPartial: !!partialContent,
      timestamp: post.createdAt,
    });
  }, []);

  // Clear active quote
  const clearQuote = useCallback(() => {
    setActiveQuote(null);
  }, []);

  // Format quotes as markdown
  const formatQuotesAsMarkdown = useCallback((quotesToFormat: QuoteItem[]) => {
    return quotesToFormat
      .map(quote => {
        const prefix = quote.isPartial ? '...' : '';
        const suffix = quote.isPartial ? '...' : '';
        return `> **@${quote.author}** wrote:\n> ${prefix}${quote.content}${suffix}\n\n`;
      })
      .join('\n');
  }, []);

  // Get all quotes as markdown
  const getAllQuotesAsMarkdown = useCallback(() => {
    return formatQuotesAsMarkdown(quotes);
  }, [quotes, formatQuotesAsMarkdown]);

  // Get active quote as markdown
  const getActiveQuoteAsMarkdown = useCallback(() => {
    if (!activeQuote) return '';
    return formatQuotesAsMarkdown([activeQuote]);
  }, [activeQuote, formatQuotesAsMarkdown]);

  return {
    // Multi-quote state
    quotes,
    addToMultiQuote,
    removeFromMultiQuote,
    clearAllQuotes,
    getAllQuotesAsMarkdown,
    
    // Single quote state
    activeQuote,
    setQuote,
    clearQuote,
    getActiveQuoteAsMarkdown,
  };
};
