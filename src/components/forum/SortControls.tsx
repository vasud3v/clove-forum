import { SortOption } from '@/types/forum';
import { ArrowUpDown, Clock, Eye, MessageCircle } from 'lucide-react';

interface SortControlsProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function SortControls({ activeSort, onSortChange }: SortControlsProps) {
  const sorts: { value: SortOption; label: string; icon: typeof Clock }[] = [
    { value: 'latest', label: 'Latest', icon: Clock },
    { value: 'views', label: 'Views', icon: Eye },
    { value: 'replies', label: 'Replies', icon: MessageCircle },
  ];

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown size={11} className="text-forum-muted/50" />
      <span className="text-[9px] font-mono font-semibold text-forum-muted/50 uppercase tracking-wider hidden sm:inline">Sort:</span>
      <div className="flex gap-1">
        {sorts.map((sort) => {
          const Icon = sort.icon;
          return (
            <button
              key={sort.value}
              onClick={() => onSortChange(sort.value)}
              className={`transition-forum  px-2.5 py-1.5 text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                activeSort === sort.value
                  ? 'bg-primary to-forum-pink/90 text-white shadow-[0_0_14px_rgba(255,45,146,0.35)] border border-primary/60'
                  : 'border border-forum-border/50 bg-transparent text-forum-muted hover:bg-forum-hover hover:text-forum-text hover:border-primary/30 hover:shadow-[0_0_8px_rgba(255,45,146,0.1)]'
              }`}
            >
              <Icon size={10} />
              {sort.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
