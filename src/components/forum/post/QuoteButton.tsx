import { memo, useState } from 'react';
import { Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuoteButtonProps {
  onQuote: () => void;
  onPartialQuote?: (selectedText: string) => void;
}

const QuoteButton = memo(({ onQuote, onPartialQuote }: QuoteButtonProps) => {
  const [showPartialQuote, setShowPartialQuote] = useState(false);

  const handleClick = () => {
    // Check if user has selected text
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0 && onPartialQuote) {
      onPartialQuote(selectedText);
    } else {
      onQuote();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="text-forum-muted hover:text-forum-pink transition-forum text-[10px] font-mono gap-1.5"
      title="Quote this post (or select text for partial quote)"
    >
      <Quote size={12} />
      Quote
    </Button>
  );
});

QuoteButton.displayName = 'QuoteButton';

export default QuoteButton;
