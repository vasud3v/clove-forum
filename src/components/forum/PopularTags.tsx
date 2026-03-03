import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, TrendingUp, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Tag {
  name: string;
  count: number;
  hot?: boolean;
  colorScheme: ColorScheme;
}

interface ColorScheme {
  bg: string;
  border: string;
  text: string;
  hover: string;
  icon: string;
}

// Color schemes for tags
const colorSchemes: ColorScheme[] = [
  {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-black',
    hover: 'hover:bg-cyan-500/20 hover:border-cyan-500/50',
    icon: 'text-cyan-600',
  },
  {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-black',
    hover: 'hover:bg-purple-500/20 hover:border-purple-500/50',
    icon: 'text-purple-600',
  },
  {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-black',
    hover: 'hover:bg-emerald-500/20 hover:border-emerald-500/50',
    icon: 'text-emerald-600',
  },
  {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-black',
    hover: 'hover:bg-amber-500/20 hover:border-amber-500/50',
    icon: 'text-amber-600',
  },
  {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-black',
    hover: 'hover:bg-rose-500/20 hover:border-rose-500/50',
    icon: 'text-rose-600',
  },
  {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-black',
    hover: 'hover:bg-blue-500/20 hover:border-blue-500/50',
    icon: 'text-blue-600',
  },
  {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-black',
    hover: 'hover:bg-indigo-500/20 hover:border-indigo-500/50',
    icon: 'text-indigo-600',
  },
  {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    text: 'text-black',
    hover: 'hover:bg-pink-500/20 hover:border-pink-500/50',
    icon: 'text-pink-600',
  },
];

// Generate consistent color for a tag based on its name
const getColorScheme = (tagName: string, isHot: boolean): ColorScheme => {
  if (isHot) {
    // Hot tags get the pink/forum color
    return {
      bg: 'bg-primary/10',
      border: 'border-primary/40',
      text: 'text-black',
      hover: 'hover:bg-primary/20 hover:border-primary/60',
      icon: 'text-primary',
    };
  }
  
  // Use tag name to generate consistent color index
  const hash = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorSchemes[hash % colorSchemes.length];
};

export default function PopularTags() {
  const navigate = useNavigate();
  const [popularTags, setPopularTags] = useState<Tag[]>([]);

  useEffect(() => {
    const fetchPopularTags = async () => {
      try {
        // Fetch all threads with tags
        const { data: threads, error } = await supabase
          .from('threads')
          .select('tags')
          .not('tags', 'is', null);

        if (error) throw error;

        // Count tag occurrences
        const tagCounts = new Map<string, number>();
        
        if (threads) {
          for (const thread of threads) {
            if (thread.tags && Array.isArray(thread.tags)) {
              for (const tag of thread.tags) {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
              }
            }
          }
        }

        // Convert to array and sort by count
        const sortedTags = Array.from(tagCounts.entries())
          .map(([name, count]) => {
            const hot = count > 5;
            return {
              name,
              count,
              hot,
              colorScheme: getColorScheme(name, hot),
            };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 12); // Top 12 tags

        setPopularTags(sortedTags);
      } catch (error) {
        console.error('Failed to fetch popular tags:', error);
      }
    };

    fetchPopularTags();

    // Refresh every 5 minutes
    const interval = setInterval(fetchPopularTags, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hud-panel overflow-hidden">
      <div className="border-b border-forum-border px-3 py-2 flex items-center gap-1.5">
        <Hash size={11} className="text-primary" />
        <h4 className="text-[10px] font-bold text-forum-text font-mono uppercase tracking-wider">
          Popular Tags
        </h4>
      </div>
      <div className="p-2.5">
        {popularTags.length === 0 ? (
          <div className="text-center py-4">
            <Hash size={20} className="text-forum-muted/30 mx-auto mb-2" />
            <p className="text-[9px] font-mono text-forum-muted">
              No tags yet
            </p>
            <p className="text-[8px] font-mono text-forum-muted/60 mt-1">
              Tags will appear as threads are created
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {popularTags.map((tag) => {
              const { bg, border, text, hover, icon } = tag.colorScheme;
              return (
                <button
                  key={tag.name}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Tag clicked:', tag.name);
                    navigate(`/search?q=${encodeURIComponent(tag.name)}`);
                  }}
                  className={`group transition-all duration-200 flex items-center gap-1  border px-2 py-1 text-[9px] font-mono cursor-pointer active:scale-95 ${bg} ${border} ${text} ${hover}`}
                >
                  {tag.hot ? (
                    <Flame size={9} className={`${icon} animate-pulse`} />
                  ) : (
                    <Hash size={8} className={icon} />
                  )}
                  <span className="font-semibold">
                    {tag.name}
                  </span>
                  <span className={`text-[7px] px-1 py-0.5 rounded ${bg} opacity-70`}>
                    {tag.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
