import { Bell, BellOff } from 'lucide-react';

interface PostSortingBarProps {
  sortBy: 'date' | 'votes';
  onSortChange: (sort: 'date' | 'votes') => void;
  isWatching: boolean;
  onToggleWatch: () => void;
}

export default function PostSortingBar({
  sortBy,
  onSortChange,
  isWatching,
  onToggleWatch,
}: PostSortingBarProps) {

  return (
    <div className="flex items-center justify-between bg-forum-card/60 border border-forum-border/30 rounded-t-md px-4 py-2 mt-4  -mb-2">
      <div className="flex gap-4 text-[13px] font-mono">
        <button
          onClick={() => onSortChange('date')}
          className={`pb-1 border-b-2 transition-colors ${
            sortBy === 'date' 
              ? 'border-primary text-forum-text' 
              : 'border-transparent text-forum-muted hover:text-forum-text/80'
          }`}
        >
          Sort by date
        </button>
        <button
          onClick={() => onSortChange('votes')}
          className={`pb-1 border-b-2 transition-colors ${
            sortBy === 'votes' 
              ? 'border-primary text-forum-text' 
              : 'border-transparent text-forum-muted hover:text-forum-text/80'
          }`}
        >
          Sort by votes
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Watch Button */}
        <button
          onClick={onToggleWatch}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono rounded text-forum-muted hover:text-forum-text hover:bg-forum-card transition-colors border border-forum-border/30"
        >
          {isWatching ? (
            <>
              <BellOff size={11} className="text-primary" />
              <span className="hidden sm:inline">Unwatch</span>
            </>
          ) : (
            <>
              <Bell size={11} />
              <span className="hidden sm:inline">Watch</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
