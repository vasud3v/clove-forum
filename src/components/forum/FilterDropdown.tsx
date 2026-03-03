import { FilterOption } from '@/types/forum';
import { ChevronDown, Filter } from 'lucide-react';

interface FilterDropdownProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
}

export default function FilterDropdown({ activeFilter, onFilterChange }: FilterDropdownProps) {
  const filters: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All Threads' },
    { value: 'trending', label: 'Trending' },
    { value: 'unanswered', label: 'Unanswered' },
    { value: 'my-threads', label: 'My Threads' },
  ];

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <Filter size={11} className="text-forum-muted/50" />
      <div className="relative">
        <select
          value={activeFilter}
          onChange={(e) => onFilterChange(e.target.value as FilterOption)}
          className={`transition-forum appearance-none  border px-2.5 py-1.5 pr-7 text-[10px] font-mono font-bold outline-none cursor-pointer ${
            activeFilter !== 'all'
              ? 'border-primary/40 bg-primary to-forum-pink/[0.04] text-primary shadow-[0_0_10px_rgba(255,45,146,0.15)] focus:border-primary/60 focus:ring-1 focus:ring-primary focus:shadow-[0_0_14px_rgba(255,45,146,0.25)]'
              : 'border-forum-border/50 bg-transparent text-forum-text focus:border-primary focus:ring-1 focus:ring-primary hover:bg-forum-hover hover:border-primary/30'
          }`}
        >
          {filters.map((filter) => (
            <option key={filter.value} value={filter.value} className="bg-forum-card text-forum-text">
              {filter.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={11}
          className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${
            activeFilter !== 'all' ? 'text-primary/50' : 'text-forum-muted/50'
          }`}
        />
      </div>
    </div>
  );
}
