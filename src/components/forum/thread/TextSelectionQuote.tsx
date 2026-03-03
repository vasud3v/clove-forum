import { memo, useState, useEffect, useCallback } from 'react';
import { Quote, Plus } from 'lucide-react';

interface TextSelectionQuoteProps {
  onQuote: (selectedText: string) => void;
  onAddToMultiQuote?: (selectedText: string) => void;
}

const TextSelectionQuote = memo(({ onQuote, onAddToMultiQuote }: TextSelectionQuoteProps) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
        setSelectedText(text);
      }
    } else {
      setPosition(null);
      setSelectedText('');
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('selectionchange', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, [handleSelection]);

  const handleQuote = () => {
    if (selectedText) {
      onQuote(selectedText);
      window.getSelection()?.removeAllRanges();
      setPosition(null);
    }
  };

  const handleAddToMultiQuote = () => {
    if (selectedText && onAddToMultiQuote) {
      onAddToMultiQuote(selectedText);
      window.getSelection()?.removeAllRanges();
      setPosition(null);
    }
  };

  if (!position) return null;

  return (
    <div
      className="fixed z-50 flex items-center gap-1 bg-forum-bg border-2 border-primary/40  shadow-brutal px-2 py-1.5 animate-in fade-in zoom-in duration-150"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <button
        onClick={handleQuote}
        className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-semibold text-primary hover:bg-primary/10 rounded transition-colors"
        title="Quote selected text"
      >
        <Quote size={12} />
        Quote
      </button>
      
      {onAddToMultiQuote && (
        <>
          <div className="w-px h-4 bg-forum-border/30" />
          <button
            onClick={handleAddToMultiQuote}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-semibold text-primary hover:bg-primary/10 rounded transition-colors"
            title="Add to multi-quote"
          >
            <Plus size={12} />
            Add
          </button>
        </>
      )}
    </div>
  );
});

TextSelectionQuote.displayName = 'TextSelectionQuote';

export default TextSelectionQuote;
