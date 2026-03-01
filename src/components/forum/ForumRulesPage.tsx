import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForumHeader from '@/components/forum/ForumHeader';
import ForumRules from '@/components/forum/ForumRules';
import SidebarStatsPanel from '@/components/forum/SidebarStatsPanel';
import OnlineUsers from '@/components/forum/OnlineUsers';
import NewThreadModal from '@/components/forum/NewThreadModal';
import { useForumContext } from '@/context/ForumContext';
import { Home as HomeIcon, ChevronRight, Shield } from 'lucide-react';

export default function ForumRulesPage() {
  const navigate = useNavigate();
  const { forumStats, currentUser } = useForumContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <span className="text-forum-muted">Rules & Guidelines</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Page header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-forum-pink/10 border border-forum-pink/20">
                <Shield size={14} className="text-forum-pink" />
              </div>
              <div>
                <h1 className="text-[16px] font-bold text-forum-text font-mono">
                  Forum Rules & Guidelines
                </h1>
                <p className="text-[10px] text-forum-muted font-mono">
                  Please read and follow these guidelines to keep our community healthy
                </p>
              </div>
            </div>

            <ForumRules />
          </div>

          {/* Sidebar */}
          <div className="hidden w-[280px] flex-shrink-0 space-y-3 lg:block">
            <SidebarStatsPanel stats={forumStats} />
            <OnlineUsers />
          </div>
        </div>
      </div>

      {/* New Thread Modal */}
      <NewThreadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
