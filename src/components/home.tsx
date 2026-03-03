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
import ChugliLogo from '@/components/forum/ChugliLogo';
import MobileBottomNav from '@/components/forum/MobileBottomNav';

function Home() {
  const { forumStats, categories } = useForumContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <ForumHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-4 pb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
          <HomeIcon size={11} className="text-primary" strokeWidth={3} />
          <span className="text-foreground hover:text-primary transition-forum cursor-pointer font-bold">Forums</span>
          <ChevronRight size={10} />
          <span className="text-muted-foreground">Home</span>
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
      <footer className="mt-8 border-t-4 border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
          {/* Top footer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <ChugliLogo size={28} />
              </div>
              <p className="text-[10px] font-mono text-muted-foreground leading-relaxed mb-3">
                A vibrant community where people connect, share, and discover. Powered by Chuglii.
              </p>
              <div className="flex items-center gap-2">
                <a href="#" className="transition-all duration-150 border-2 border-border p-2 text-muted-foreground hover:text-primary hover:border-primary hover:bg-secondary/10 hover:translate-x-[-1px] hover:translate-y-[-1px]">
                  <Github size={14} strokeWidth={2.5} />
                </a>
                <a href="#" className="transition-all duration-150 border-2 border-border p-2 text-muted-foreground hover:text-primary hover:border-primary hover:bg-secondary/10 hover:translate-x-[-1px] hover:translate-y-[-1px]">
                  <Twitter size={14} strokeWidth={2.5} />
                </a>
                <a href="#" className="transition-all duration-150 border-2 border-border p-2 text-muted-foreground hover:text-primary hover:border-primary hover:bg-secondary/10 hover:translate-x-[-1px] hover:translate-y-[-1px]">
                  <Rss size={14} strokeWidth={2.5} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-[10px] font-mono font-black text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Code size={11} className="text-primary" strokeWidth={3} />
                Community
              </h5>
              <div className="space-y-2">
                <a href="/" className="block text-[10px] font-mono text-muted-foreground hover:text-primary transition-all duration-150 hover:font-bold">Forums</a>
                <a href="/members" className="block text-[10px] font-mono text-muted-foreground hover:text-primary transition-all duration-150 hover:font-bold">Members</a>
                <a href="/whats-new" className="block text-[10px] font-mono text-muted-foreground hover:text-primary transition-all duration-150 hover:font-bold">What's New</a>
                <a href="/rules" className="block text-[10px] font-mono text-muted-foreground hover:text-primary transition-all duration-150 hover:font-bold">Rules</a>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h5 className="text-[10px] font-mono font-black text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BookOpen size={11} className="text-primary" strokeWidth={3} />
                Resources
              </h5>
              <div className="space-y-2">
                <a href="#" className="block text-[10px] font-mono text-muted-foreground hover:text-primary transition-all duration-150 hover:font-bold">About</a>
                <a href="#" className="block text-[10px] font-mono text-muted-foreground hover:text-primary transition-all duration-150 hover:font-bold">Guidelines</a>
                <a href="#" className="block text-[10px] font-mono text-muted-foreground hover:text-primary transition-all duration-150 hover:font-bold">Help Center</a>
                <a href="#" className="block text-[10px] font-mono text-muted-foreground hover:text-primary transition-all duration-150 hover:font-bold">Blog</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h5 className="text-[10px] font-mono font-black text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield size={11} className="text-primary" strokeWidth={3} />
                Legal
              </h5>
              <div className="space-y-2">
                <a href="#" className="block text-[10px] font-mono text-muted-foreground hover:text-primary transition-all duration-150 hover:font-bold">Terms of Service</a>
                <a href="#" className="block text-[10px] font-mono text-muted-foreground hover:text-primary transition-all duration-150 hover:font-bold">Privacy Policy</a>
                <a href="#" className="block text-[10px] font-mono text-muted-foreground hover:text-primary transition-all duration-150 hover:font-bold">Cookie Policy</a>
                <a href="#" className="block text-[10px] font-mono text-muted-foreground hover:text-primary transition-all duration-150 hover:font-bold">Contact Us</a>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-[3px] bg-border mb-6" />

          {/* Bottom footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[9px] font-mono text-muted-foreground">
              © 2024 Chuglii. All rights reserved.
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground">
              Made with <Heart size={11} className="text-primary mx-0.5" strokeWidth={3} /> by the community
            </div>
            <div className="text-[9px] font-mono text-muted-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 bg-primary animate-dot-pulse border border-border" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile sidebar drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[300px] overflow-y-auto border-l-4 border-border bg-card p-4 space-y-3">
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
