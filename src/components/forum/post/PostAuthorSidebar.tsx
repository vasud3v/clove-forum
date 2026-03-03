import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { User, UserRole } from '@/types/forum';
import RoleBadge from '../RoleBadge';
import ProfileHoverCard from '../ProfileHoverCard';
import { useForumContext } from '@/context/ForumContext';
import { getUserAvatar } from '@/lib/avatar';
import { 
  getRankColorCompact, 
  getRankIconCompact, 
  getReputationColor, 
  formatReputation 
} from '@/lib/forumUtils';

interface PostAuthorSidebarProps {
  author: User;
  isOP: boolean;
  currentUserId: string;
}

const PostAuthorSidebar = memo(({ author, isOP, currentUserId }: PostAuthorSidebarProps) => {
  const navigate = useNavigate();
  const { getUserProfile } = useForumContext();
  
  // Use avatar directly from author data - it's already loaded from forum_users table
  const displayAvatar = author.avatar || getUserAvatar('', author.username);

  return (
    <div className="md:w-[200px] flex-shrink-0 bg-forum-bg/30 border-b md:border-b-0 md:border-r border-forum-border/20 p-4 flex flex-col items-center md:items-center">
      <div className="flex flex-row md:flex-col items-center justify-center w-full gap-4 md:gap-3">
        
        <ProfileHoverCard user={author}>
          <img
            src={displayAvatar}
            alt={author.username}
            className="h-14 w-14 md:h-24 md:w-24  border border-forum-border/50 object-cover cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
            onClick={() => navigate(`/user/${author.id}`)}
          />
        </ProfileHoverCard>
        
        <div className="flex flex-col flex-1 md:w-full items-start md:items-center text-left md:text-center mt-0 md:mt-1">
          <ProfileHoverCard user={author}>
            <span
              className="text-[14px] md:text-[16px] font-bold tracking-wide text-forum-text hover:text-primary transition-forum cursor-pointer leading-tight mb-1 md:mb-2 inline-block relative z-20"
              onClick={() => navigate(`/user/${author.id}`)}
            >
              {author.username}
            </span>
          </ProfileHoverCard>
          
          <div className="flex flex-col items-start md:items-center gap-1.5 mt-1 w-full max-w-[140px]">
            {author.role && author.role !== 'member' && (
              <div className="w-full flex justify-center">
                <RoleBadge role={(author.role as UserRole) || 'member'} size="md" />
              </div>
            )}
            
            {author.rank && (
              <span className={`w-full flex justify-center items-center gap-1.5 rounded border px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider ${getRankColorCompact(author.rank)}`}>
                {getRankIconCompact(author.rank)}
                {author.rank}
              </span>
            )}

            {author.reputation !== undefined && (
              <span className={`w-full flex justify-center items-center gap-1.5 rounded border px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider ${getReputationColor(author.reputation)}`}>
                <Zap size={10} />
                {formatReputation(author.reputation)} Rep
              </span>
            )}
            
            {isOP && (
              <span className="w-full text-center text-[9px] font-bold uppercase tracking-wider px-2 py-1 bg-primary/10 border border-primary/30 rounded text-primary">
                Original Poster
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Author Stats (Hidden on mobile) */}
      <div className="hidden md:flex flex-col w-full mt-5 space-y-2 border-t border-forum-border/20 pt-4 px-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-forum-muted/60">Joined:</span>
          <span className="text-forum-text/90 font-medium">
            {new Date(author.joinDate || Date.now()).toLocaleDateString('en-US', { 
              month: 'short', 
              year: 'numeric' 
            })}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-forum-muted/60">Messages:</span>
          <span className="text-forum-text/90 font-medium">{author.postCount || 0}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-forum-muted/60">Reputation:</span>
          <span className="text-forum-text/90 font-medium">
            {(author.reputation || 0) > 0 ? `+${author.reputation}` : author.reputation || 0}
          </span>
        </div>
      </div>
    </div>
  );
});

PostAuthorSidebar.displayName = 'PostAuthorSidebar';

export default PostAuthorSidebar;
