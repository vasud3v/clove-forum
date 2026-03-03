import { memo, useState, useRef, useEffect } from 'react';
import { FileText, ChevronDown } from 'lucide-react';

interface QuickReplyTemplatesProps {
  onSelectTemplate: (template: string) => void;
}

const TEMPLATES = [
  { label: 'Thanks', content: 'Thanks for the helpful response!' },
  { label: 'Question', content: 'Could you clarify what you mean by...' },
  { label: 'Agree', content: 'I agree with this approach. ' },
  { label: 'Alternative', content: 'Here\'s an alternative solution:\n\n' },
  { label: 'Follow-up', content: 'Following up on this, ' },
  { label: 'Solved', content: 'This solved my issue! Thanks!' },
];

const QuickReplyTemplates = memo(({ onSelectTemplate }: QuickReplyTemplatesProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelect = (template: string) => {
    onSelectTemplate(template);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded text-forum-muted hover:text-forum-text hover:bg-forum-card transition-colors border border-forum-border/20"
        title="Quick Reply Templates"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FileText size={11} />
        <span className="hidden sm:inline">Templates</span>
        <ChevronDown size={9} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 z-20 hud-panel p-1.5 min-w-[180px]"
          role="menu"
        >
          {TEMPLATES.map((template) => (
            <button
              key={template.label}
              type="button"
              onClick={() => handleSelect(template.content)}
              className="w-full text-left px-3 py-2 text-[10px] font-mono text-forum-text hover:bg-primary/10 hover:text-primary rounded transition-colors"
              role="menuitem"
            >
              {template.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

QuickReplyTemplates.displayName = 'QuickReplyTemplates';

export default QuickReplyTemplates;
