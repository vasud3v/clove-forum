import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ForumHeader from '@/components/forum/ForumHeader';
import SidebarStatsPanel from '@/components/forum/SidebarStatsPanel';
import NewThreadModal from '@/components/forum/NewThreadModal';
import { useForumContext } from '@/context/ForumContext';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/forum';
import { getUserAvatar } from '@/lib/avatar';
import {
  Home as HomeIcon,
  ChevronRight,
  Users as UsersIcon,
  Search,
  Crown,
  ShieldCheck,
  Star,
  Zap,
  MessageSquare,
  TrendingUp,
  Calendar,
} from 'lucide-react';

type MemberSort = 'reputation' | 'posts' | 'newest' | 'alphabetical';

export default function MembersPage() {
  const navigate = useNavigate();
  const { forumStats, currentUser, getCalculatedReputation, getUserProfile } = useForumContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<MemberSort>('reputation');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Fetch all users from Supabase
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('forum_users')
        .select('*');

      if (!error && data) {
        setUsers(data.map(user => ({
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          
          postCount: user.post_count,
          reputation: user.reputation,
          joinDate: user.join_date,
          isOnline: user.is_online,
          rank: user.rank,
          role: user.role || 'member',
        })));
      }
    };

    fetchUsers();
  }, []);

  const sortedMembers = useMemo(() => {
    let filtered = [...users];

    // Apply search
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.rank?.toLowerCase().includes(q)
      );
    }

    // Apply sort
    switch (sortBy) {
      case 'posts':
        filtered.sort((a, b) => b.postCount - a.postCount);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.username.localeCompare(b.username));
        break;
      case 'reputation':
      default:
        filtered.sort((a, b) => getCalculatedReputation(b.id) - getCalculatedReputation(a.id));
        break;
    }

    return filtered;
  }, [users, memberSearch, sortBy, getCalculatedReputation]);

  const getRankIcon = (rank?: string) => {
    switch (rank?.toLowerCase()) {
      case 'admin':
        return <ShieldCheck size={10} className="text-red-400" />;
      case 'moderator':
        return <ShieldCheck size={10} className="text-cyan-400" />;
      case 'elite':
        return <Crown size={10} className="text-amber-400" />;
      case 'veteran':
        return <Star size={10} className="text-purple-400" />;
      default:
        return <Zap size={10} className="text-forum-pink" />;
    }
  };

  const getRankBadgeClasses = (rank?: string) => {
    switch (rank?.toLowerCase()) {
      case 'admin':
        return 'border-red-500/30 bg-red-500/10 text-red-400';
      case 'moderator':
        return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400';
      case 'elite':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
      case 'veteran':
        return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
      default:
        return 'border-forum-pink/30 bg-forum-pink/10 text-forum-pink';
    }
  };

  const sortOptions: { key: MemberSort; label: string }[] = [
    { key: 'reputation', label: 'Reputation' },
    { key: 'posts', label: 'Post Count' },
    { key: 'newest', label: 'Newest' },
    { key: 'alphabetical', label: 'A-Z' },
  ];

  return (
    <div className="min-h-screen bg-forum-bg">
      <ForumHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-4 pb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted">
          <HomeIcon size={11} className="text-forum-pink" />
          <span
            className="text-forum-text hover:text-forum-pink transition-forum cursor-pointer"
            onClick={() => navigate('/')}
          >
            Forums
          </span>
          <ChevronRight size={10} />
          <span className="text-forum-muted">Members</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Page header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-forum-pink/10 border border-forum-pink/20">
                  <UsersIcon size={14} className="text-forum-pink" />
                </div>
                <div>
                  <h1 className="text-[16px] font-bold text-forum-text font-mono">
                    Members
                  </h1>
                  <p className="text-[10px] text-forum-muted font-mono">
                    {users.length} registered members
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Sort bar */}
            <div className="hud-panel p-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-forum-muted" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="transition-forum w-full rounded border border-forum-border bg-forum-bg py-2 pl-8 pr-4 text-[11px] font-mono text-forum-text placeholder-forum-muted outline-none focus:border-forum-pink focus:ring-1 focus:ring-forum-pink/30"
                  />
                </div>
                <div className="flex items-center gap-1">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSortBy(opt.key)}
                      className={`transition-forum rounded px-2.5 py-1.5 text-[9px] font-mono font-medium ${sortBy === opt.key
                          ? 'bg-forum-pink/10 text-forum-pink border border-forum-pink/20'
                          : 'text-forum-muted hover:text-forum-text hover:bg-forum-hover border border-transparent'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Members grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sortedMembers.map((member, index) => {
                const rep = getCalculatedReputation(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => navigate(`/user/${member.id}`)}
                    className="transition-forum hud-panel p-3 flex items-center gap-3 hover:border-forum-pink/30 hover:shadow-[0_0_20px_rgba(255,45,146,0.1)] hover:-translate-y-[1px] group text-left"
                  >
                    {/* Rank number */}
                    <span className="text-[10px] font-mono text-forum-muted/30 w-4 flex-shrink-0 text-right">
                      {index + 1}
                    </span>

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={member.avatar}
                        alt={member.username}
                        className="h-10 w-10 rounded-lg object-cover border border-forum-border group-hover:border-forum-pink/30 transition-forum"
                      />
                      {member.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-forum-card bg-emerald-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-forum-text font-mono group-hover:text-forum-pink transition-forum truncate">
                          {member.username}
                        </span>
                        {member.rank && (
                          <span className={`inline-flex items-center gap-0.5 rounded-sm border px-1.5 py-[1px] text-[7px] font-mono font-bold uppercase tracking-wider ${getRankBadgeClasses(member.rank)}`}>
                            {getRankIcon(member.rank)}
                            {member.rank}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[9px] font-mono text-forum-muted">
                          <MessageSquare size={8} />
                          {member.postCount.toLocaleString()} posts
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-mono text-forum-pink">
                          <TrendingUp size={8} />
                          {rep.toLocaleString()} rep
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-mono text-forum-muted/60">
                          <Calendar size={8} />
                          {member.joinDate}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {sortedMembers.length === 0 && (
              <div className="flex flex-col items-center justify-center hud-panel px-6 py-16">
                <UsersIcon size={40} className="text-forum-pink mx-auto mb-3" />
                <h3 className="text-[13px] font-bold text-forum-text font-mono mb-1">
                  No members found
                </h3>
                <p className="text-[11px] text-forum-muted font-mono">
                  Try adjusting your search query
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden w-[280px] flex-shrink-0 space-y-3 lg:block">
            <SidebarStatsPanel stats={forumStats} />
          </div>
        </div>
      </div>

      {/* New Thread Modal */}
      <NewThreadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
