import { useState } from 'react';
import ForumHeader from '@/components/forum/ForumHeader';
import SidebarStatsPanel from '@/components/forum/SidebarStatsPanel';
import OnlineUsers from '@/components/forum/OnlineUsers';
import NewThreadModal from '@/components/forum/NewThreadModal';
import AnnouncementBanner from '@/components/forum/AnnouncementBanner';
import TrendingTicker from '@/components/forum/TrendingTicker';
import RecentActivityFeed from '@/components/forum/RecentActivityFeed';
import PopularTags from '@/components/forum/PopularTags';
import CategoriesSection from '@/components/forum/CategoriesSection';
import { useForumContext } from '@/context/ForumContext';
import { Home as HomeIcon, ChevronRight, Github, Twitter, Heart, Code, BookOpen, Shield, Rss } from 'lucide-react';
import CloveLogo from '@/components/forum/CloveLogo';
import MobileBottomNav from '@/components/forum/MobileBottomNav';

function Home() {
  const { forumStats, categories } = useForumContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-forum-bg pb-20 lg:pb-0">
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
          <span className="text-forum-text hover:text-forum-pink transition-forum cursor-pointer">Forums</span>
          <ChevronRight size={10} />
          <span className="text-forum-muted">Home</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 space-y-4">
        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Trending Ticker */}
        <TrendingTicker />

        {/* Recent Activity Banner */}
        <RecentActivityFeed />

        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Categories and Topics Section */}
            <CategoriesSection categories={categories} />

            {/* Popular Tags (visible on mobile, below categories) */}
            <div className="mt-4 lg:hidden">
              <PopularTags />
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden w-[280px] flex-shrink-0 space-y-3 lg:block">
            <SidebarStatsPanel stats={forumStats} />
            <OnlineUsers />
            <PopularTags />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-forum-border bg-forum-card/50">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
          {/* Top footer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <CloveLogo size={28} />
                <span className="text-[13px] font-mono font-bold text-forum-text">
                  clo<span className="text-forum-pink">ve</span>
                </span>
              </div>
              <p className="text-[10px] font-mono text-forum-muted leading-relaxed mb-3">
                A vibrant community where people connect, share, and discover. Powered by Clove.
              </p>
              <div className="flex items-center gap-2">
                <a href="#" className="transition-forum rounded-md border border-forum-border p-1.5 text-forum-muted hover:text-forum-pink hover:border-forum-pink/30 hover:bg-forum-pink/5">
                  <Github size={13} />
                </a>
                <a href="#" className="transition-forum rounded-md border border-forum-border p-1.5 text-forum-muted hover:text-forum-pink hover:border-forum-pink/30 hover:bg-forum-pink/5">
                  <Twitter size={13} />
                </a>
                <a href="#" className="transition-forum rounded-md border border-forum-border p-1.5 text-forum-muted hover:text-forum-pink hover:border-forum-pink/30 hover:bg-forum-pink/5">
                  <Rss size={13} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-[10px] font-mono font-bold text-forum-text uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Code size={10} className="text-forum-pink" />
                Community
              </h5>
              <div className="space-y-2">
                <a href="/" className="block text-[10px] font-mono text-forum-muted hover:text-forum-pink transition-forum">Forums</a>
                <a href="/members" className="block text-[10px] font-mono text-forum-muted hover:text-forum-pink transition-forum">Members</a>
                <a href="/whats-new" className="block text-[10px] font-mono text-forum-muted hover:text-forum-pink transition-forum">What's New</a>
                <a href="/rules" className="block text-[10px] font-mono text-forum-muted hover:text-forum-pink transition-forum">Rules</a>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h5 className="text-[10px] font-mono font-bold text-forum-text uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BookOpen size={10} className="text-forum-pink" />
                Resources
              </h5>
              <div className="space-y-2">
                <a href="#" className="block text-[10px] font-mono text-forum-muted hover:text-forum-pink transition-forum">About</a>
                <a href="#" className="block text-[10px] font-mono text-forum-muted hover:text-forum-pink transition-forum">Guidelines</a>
                <a href="#" className="block text-[10px] font-mono text-forum-muted hover:text-forum-pink transition-forum">Help Center</a>
                <a href="#" className="block text-[10px] font-mono text-forum-muted hover:text-forum-pink transition-forum">Blog</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h5 className="text-[10px] font-mono font-bold text-forum-text uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield size={10} className="text-forum-pink" />
                Legal
              </h5>
              <div className="space-y-2">
                <a href="#" className="block text-[10px] font-mono text-forum-muted hover:text-forum-pink transition-forum">Terms of Service</a>
                <a href="#" className="block text-[10px] font-mono text-forum-muted hover:text-forum-pink transition-forum">Privacy Policy</a>
                <a href="#" className="block text-[10px] font-mono text-forum-muted hover:text-forum-pink transition-forum">Cookie Policy</a>
                <a href="#" className="block text-[10px] font-mono text-forum-muted hover:text-forum-pink transition-forum">Contact Us</a>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-forum-border to-transparent mb-4" />

          {/* Bottom footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[9px] font-mono text-forum-muted">
              © 2024 Clove. All rights reserved.
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono text-forum-muted">
              Made with <Heart size={10} className="text-forum-pink mx-0.5" /> by the community
            </div>
            <div className="text-[9px] font-mono text-forum-muted flex items-center gap-1.5">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-dot-pulse" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile sidebar drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[300px] overflow-y-auto border-l border-forum-border bg-forum-card p-4 space-y-3">
            <SidebarStatsPanel stats={forumStats} />
            <OnlineUsers />
            <PopularTags />
          </div>
        </div>
      )}

      {/* New Thread Modal */}
      <NewThreadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <MobileBottomNav />
    </div>
  );
}

export default Home;
