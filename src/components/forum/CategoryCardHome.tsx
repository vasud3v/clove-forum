import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Wrench,
  Rocket,
  Newspaper,
  Shield,
  LucideProps,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Eye,
  Hash,
  Clock,
  Pin,
  Lock,
  Flame,
} from 'lucide-react';
import { Category, Topic } from '@/types/forum';

const iconMap: Record<string, React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>> = {
  MessageSquare,
  Wrench,
  Rocket,
  Newspaper,
  Shield,
};

interface CategoryCardHomeProps {
  category: Category;
}

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

function TopicRow({ topic, isLast, onNavigate }: { topic: Topic; isLast: boolean; onNavigate: () => void }) {
  return (
    <div
      onClick={onNavigate}
      className={`group/topic flex items-center gap-4 px-4 py-3 cursor-pointer transition-forum hover:bg-forum-pink/[0.03] ${
        !isLast ? 'border-b border-white/[0.03]' : ''
      }`}
    >
      {/* Topic icon */}
      <div className="flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-forum-pink/[0.06] border border-forum-pink/10 group-hover/topic:bg-forum-pink/10 group-hover/topic:border-forum-pink/20 transition-forum">
          <Hash size={14} className="text-forum-pink/60 group-hover/topic:text-forum-pink transition-forum" />
        </div>
      </div>

      {/* Topic name + description */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-mono font-semibold text-forum-text/90 group-hover/topic:text-forum-pink transition-forum truncate">
          {topic.name}
        </div>
        {topic.description && (
          <div className="text-[9px] font-mono text-forum-muted/60 mt-0.5 truncate">
            {topic.description}
          </div>
        )}
      </div>

      {/* Stats columns */}
      <div className="hidden md:flex items-center gap-6 flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-[72px]">
          <MessageCircle size={10} className="text-forum-muted/60" />
          <span className="text-[11px] font-mono text-forum-muted">
            {topic.threadCount.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 min-w-[72px]">
          <Eye size={10} className="text-forum-muted/60" />
          <span className="text-[11px] font-mono text-forum-muted">
            {topic.postCount.toLocaleString()}
          </span>
        </div>
        <div className="min-w-[100px]">
          <div className="flex items-center gap-1.5">
            <Clock size={10} className="text-forum-pink/40" />
            <span className="text-[10px] font-mono text-forum-muted">
              {formatTimeAgo(topic.lastActivity)}
            </span>
          </div>
          {topic.lastPostBy && (
            <div className="text-[8px] font-mono text-forum-muted/40 mt-0.5 ml-[16px]">
              by <span className="text-forum-pink/40">{topic.lastPostBy}</span>
            </div>
          )}
        </div>
      </div>

      <ChevronRight
        size={14}
        className="flex-shrink-0 text-forum-muted/30 group-hover/topic:text-forum-pink/60 transition-forum"
      />
    </div>
  );
}

function CategoryCardHome({ category }: CategoryCardHomeProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const Icon = iconMap[category.icon] || MessageSquare;

  const hotThreads = category.threads.filter((t) => t.isHot).length;
  const unreadThreads = category.threads.filter((t) => t.hasUnread).length;

  return (
    <div className={`overflow-hidden rounded-md border shadow-card ${
      category.isImportant
        ? 'border-forum-pink/40 bg-forum-card ring-2 ring-forum-pink/20'
        : 'border-forum-pink/[0.08] bg-forum-card'
    }`}>
      {/* Category Header — collapsible toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none border-b transition-forum ${
          category.isImportant
            ? 'bg-gradient-to-r from-forum-pink/15 via-forum-pink/[0.08] to-transparent border-forum-pink/20 hover:from-forum-pink/20'
            : 'bg-gradient-to-r from-forum-pink/[0.06] to-transparent border-forum-pink/[0.08] hover:from-forum-pink/[0.10]'
        }`}
      >
        {/* Collapse chevron */}
        <ChevronDown
          size={14}
          className={`text-forum-pink/50 transition-transform duration-200 flex-shrink-0 ${
            isExpanded ? '' : '-rotate-90'
          }`}
        />

        {/* Category icon */}
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-forum-pink/10 border border-forum-pink/15 flex-shrink-0">
          <Icon size={15} className="text-forum-pink" />
        </div>

        {/* Category name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/category/${category.id}`);
              }}
              className="text-[13px] font-bold text-forum-text font-mono hover:text-forum-pink transition-forum"
            >
              {category.name}
            </h3>
            {category.isSticky && (
              <span className="badge-shine inline-flex items-center gap-1 text-[7px] font-mono font-bold uppercase tracking-widest px-1.5 py-[3px] bg-gradient-to-r from-forum-pink/20 to-forum-pink/10 border border-forum-pink/40 rounded-sm text-forum-pink badge-glow-pink">
                <Pin size={8} className="text-forum-pink drop-shadow-[0_0_3px_rgba(255,45,146,0.5)]" />
                Sticky
              </span>
            )}
            {category.isImportant && (
              <span className="badge-shine inline-flex items-center gap-1 text-[7px] font-mono font-bold uppercase tracking-widest px-1.5 py-[3px] bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/35 rounded-sm text-amber-400 badge-glow-amber">
                <Lock size={8} className="drop-shadow-[0_0_3px_rgba(245,158,11,0.5)]" />
                Mod Only
              </span>
            )}
            {unreadThreads > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-forum-pink to-forum-pink/80 text-[8px] font-mono font-bold text-white px-1 shadow-[0_0_10px_rgba(255,45,146,0.4)] animate-dot-pulse">
                {unreadThreads}
              </span>
            )}
            {hotThreads > 0 && (
              <span className="badge-shine inline-flex items-center gap-1 text-[8px] font-mono font-bold uppercase tracking-wider text-orange-300 bg-gradient-to-br from-orange-500/28 via-red-500/20 to-amber-500/12 border border-orange-500/55 rounded-sm px-2 py-1 badge-glow-orange shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-250">
                <Flame size={9} className="animate-flame text-orange-300 drop-shadow-[0_0_3px_rgba(249,115,22,0.5)]" />
                {hotThreads} hot
              </span>
            )}
          </div>
          <p className="text-[10px] text-forum-muted font-mono mt-0.5 truncate">
            {category.description}
          </p>
        </div>

        {/* Category-level aggregate stats */}
        <div className="hidden sm:flex items-center gap-4 flex-shrink-0 text-center">
          <div className="min-w-[50px]">
            <div className="text-[13px] font-bold font-mono text-forum-text">
              {category.threadCount.toLocaleString()}
            </div>
            <div className="text-[7px] font-mono uppercase tracking-widest text-forum-muted/60">
              threads
            </div>
          </div>
          <div className="w-px h-6 bg-forum-pink/[0.08]" />
          <div className="min-w-[50px]">
            <div className="text-[13px] font-bold font-mono text-forum-text">
              {category.postCount.toLocaleString()}
            </div>
            <div className="text-[7px] font-mono uppercase tracking-widest text-forum-muted/60">
              posts
            </div>
          </div>
          <div className="w-px h-6 bg-forum-pink/[0.08]" />
          <div className="min-w-[56px]">
            <div className="text-[11px] font-bold font-mono text-forum-pink">
              {formatTimeAgo(category.lastActivity)}
            </div>
            <div className="text-[7px] font-mono uppercase tracking-widest text-forum-muted/60">
              latest
            </div>
          </div>
        </div>
      </div>

      {/* Topics List — XenForo-style sub-forum rows */}
      {isExpanded && category.topics && category.topics.length > 0 && (
        <div className="bg-forum-bg/40">
          {/* Column headers */}
          <div className="hidden md:flex items-center gap-4 px-4 py-1.5 border-b border-white/[0.02]">
            <div className="w-9 flex-shrink-0" />
            <div className="flex-1 text-[8px] font-mono uppercase tracking-widest text-forum-muted/40">
              Topic
            </div>
            <div className="flex items-center gap-6 flex-shrink-0">
              <span className="min-w-[72px] text-[8px] font-mono uppercase tracking-widest text-forum-muted/40">
                Threads
              </span>
              <span className="min-w-[72px] text-[8px] font-mono uppercase tracking-widest text-forum-muted/40">
                Posts
              </span>
              <span className="min-w-[100px] text-[8px] font-mono uppercase tracking-widest text-forum-muted/40">
                Last Active
              </span>
            </div>
            <div className="w-[14px] flex-shrink-0" />
          </div>

          {/* Topic rows */}
          {category.topics.map((topic, idx) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              isLast={idx === category.topics!.length - 1}
              onNavigate={() => navigate(`/category/${category.id}?topic=${topic.id}`)}
            />
          ))}
        </div>
      )}

      {/* Collapsed state indicator */}
      {!isExpanded && (
        <div className="px-4 py-2 bg-forum-bg/20 border-t border-white/[0.02]">
          <span className="text-[9px] font-mono text-forum-muted/40">
            {category.topics?.length || 0} topics · Click to expand
          </span>
        </div>
      )}
    </div>
  );
}

export default memo(CategoryCardHome);
