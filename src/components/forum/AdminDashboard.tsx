import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ForumHeader from '@/components/forum/ForumHeader';
import MobileBottomNav from '@/components/forum/MobileBottomNav';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/hooks/usePermissions';
import { useForumContext } from '@/context/ForumContext';
import {
  Shield, FileText, Users, AlertTriangle, MessageSquare,
  BarChart3, Clock, Settings, ChevronRight, Home as HomeIcon, RefreshCw, Layers, Megaphone, TrendingUp, Server, Zap, FolderTree,
} from 'lucide-react';
import { toast } from '@/components/forum/Toast';
import type { ContentReport, ModerationLog, UserRole } from '@/types/forum';

import AdminOverviewTab from './admin/AdminOverviewTab';
import AdminQuickSetupTab from './admin/AdminQuickSetupTab';
import AdminCategoriesTab from './admin/AdminCategoriesTab';
import AdminTopicsTab from './admin/AdminTopicsTab';
import AdminThreadsTab from './admin/AdminThreadsTab';
import AdminPostsTab from './admin/AdminPostsTab';
import AdminUsersTab from './admin/AdminUsersTab';
import AdminReportsTab from './admin/AdminReportsTab';
import AdminModLogTab from './admin/AdminModLogTab';
import AdminBannersTab from './admin/AdminBannersTab';
import AdminSettingsTab from './admin/AdminSettingsTab';
import AdminAnalyticsTab from './admin/AdminAnalyticsTab';
import AdminSystemTab from './admin/AdminSystemTab';

type TabKey = 'overview' | 'quicksetup' | 'categories' | 'topics' | 'threads' | 'posts' | 'users' | 'reports' | 'modlog' | 'banners' | 'analytics' | 'system' | 'settings';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useForumContext();
  const permissions = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState({ totalUsers: 0, totalThreads: 0, totalPosts: 0, onlineUsers: 0, pendingReports: 0, bannedUsers: 0, staffCount: 0, newUsersToday: 0 });
  const [categories, setCategories] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [modLogs, setModLogs] = useState<ModerationLog[]>([]);

  // Redirect non-staff
  useEffect(() => {
    if (!permissions.isStaff) {
      navigate('/');
      toast.error('Access denied: Staff only');
    }
  }, [permissions.isStaff, navigate]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const logModAction = useCallback(async (action: string, targetType: string, targetId: string, details?: Record<string, any>, targetUserId?: string) => {
    try {
      await supabase.from('moderation_logs').insert({
        moderator_id: currentUser.id,
        action, target_type: targetType, target_id: targetId,
        target_user_id: targetUserId || null,
        details: details || {},
      });
    } catch (err) {
      console.warn('[AdminDashboard] Failed to log mod action:', err);
    }
  }, [currentUser.id]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Stats
      const [
        { count: totalUsers }, { count: totalThreads }, { count: totalPosts },
        { count: onlineUsers }, { count: pendingReports }, { count: bannedUsers },
        { count: staffCount }, { count: newUsersToday },
      ] = await Promise.all([
        supabase.from('forum_users').select('*', { count: 'exact', head: true }),
        supabase.from('threads').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('forum_users').select('*', { count: 'exact', head: true }).eq('is_online', true),
        supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('forum_users').select('*', { count: 'exact', head: true }).eq('is_banned', true),
        supabase.from('forum_users').select('*', { count: 'exact', head: true }).in('role', ['admin', 'super_moderator', 'moderator']),
        supabase.from('forum_users').select('*', { count: 'exact', head: true }).gte('join_date', new Date(Date.now() - 86400000).toISOString()),
      ]);
      setStats({
        totalUsers: totalUsers || 0, totalThreads: totalThreads || 0, totalPosts: totalPosts || 0,
        onlineUsers: onlineUsers || 0, pendingReports: pendingReports || 0, bannedUsers: bannedUsers || 0,
        staffCount: staffCount || 0, newUsersToday: newUsersToday || 0,
      });

      // Categories
      const { data: catData } = await supabase.from('categories').select('*').order('sort_order').order('name');
      if (catData) setCategories(catData.map((c: any) => ({
        id: c.id, name: c.name, description: c.description, icon: c.icon,
        threadCount: c.thread_count, postCount: c.post_count,
        isSticky: c.is_sticky, isImportant: c.is_important, sortOrder: c.sort_order || 0,
      })));

      // Threads
      const { data: threadData } = await supabase.from('threads')
        .select('id, title, reply_count, view_count, is_pinned, is_locked, is_featured, is_archived, created_at, category_id, author_id, author:forum_users!threads_author_id_fkey(username, avatar)')
        .order('created_at', { ascending: false }).limit(100);
      if (threadData) setThreads(threadData.map((t: any) => ({
        id: t.id, title: t.title, authorName: Array.isArray(t.author) ? t.author[0]?.username : t.author?.username || 'Unknown',
        authorId: t.author_id, categoryId: t.category_id,
        categoryName: catData?.find((c: any) => c.id === t.category_id)?.name || 'Unknown',
        replyCount: t.reply_count, viewCount: t.view_count,
        isPinned: t.is_pinned, isLocked: t.is_locked, isFeatured: t.is_featured || false, isArchived: t.is_archived || false,
        createdAt: t.created_at,
      })));

      // Posts
      const { data: postData } = await supabase.from('posts')
        .select('id, thread_id, content, author_id, created_at, likes, upvotes, downvotes, author:forum_users!posts_author_id_fkey(username, avatar), thread:threads!posts_thread_id_fkey(title)')
        .order('created_at', { ascending: false }).limit(100);
      if (postData) setPosts(postData.map((p: any) => ({
        id: p.id, threadId: p.thread_id, content: p.content,
        authorName: Array.isArray(p.author) ? p.author[0]?.username : p.author?.username || 'Unknown',
        authorId: p.author_id,
        threadTitle: Array.isArray(p.thread) ? p.thread[0]?.title : p.thread?.title || 'Unknown',
        createdAt: p.created_at, likes: p.likes, upvotes: p.upvotes, downvotes: p.downvotes,
      })));

      // Users
      const { data: userData } = await supabase.from('forum_users')
        .select('id, username, avatar, reputation, post_count, rank, role, is_online, is_banned, ban_reason, join_date')
        .order('reputation', { ascending: false }).limit(200);
      if (userData) setUsers(userData.map((u: any) => ({
        id: u.id, username: u.username, avatar: u.avatar, reputation: u.reputation,
        postCount: u.post_count, rank: u.rank || 'Newcomer', role: u.role || 'member',
        isOnline: u.is_online, isBanned: u.is_banned || false, banReason: u.ban_reason,
        joinDate: u.join_date,
      })));

      // Reports
      const { data: reportData } = await supabase.from('content_reports')
        .select('*, reporter:forum_users!content_reports_reporter_id_fkey(username, avatar)')
        .order('created_at', { ascending: false }).limit(100);
      if (reportData) {
        const enrichedReports: ContentReport[] = await Promise.all(reportData.map(async (r: any) => {
          let targetTitle = '', targetContent = '', targetAuthorName = '';
          try {
            if (r.target_type === 'thread') {
              const { data } = await supabase.from('threads').select('title, author:forum_users!threads_author_id_fkey(username, avatar)').eq('id', r.target_id).maybeSingle();
              const d = data as any;
              targetTitle = d?.title || '';
              targetAuthorName = Array.isArray(d?.author) ? d.author[0]?.username : d?.author?.username || '';
            } else {
              const { data } = await supabase.from('posts').select('content, author:forum_users!posts_author_id_fkey(username, avatar)').eq('id', r.target_id).maybeSingle();
              const d = data as any;
              targetContent = d?.content || '';
              targetAuthorName = Array.isArray(d?.author) ? d.author[0]?.username : d?.author?.username || '';
            }
          } catch { /* ignore */ }
          return {
            id: r.id, reporterId: r.reporter_id,
            reporterName: Array.isArray(r.reporter) ? r.reporter[0]?.username : r.reporter?.username || 'Unknown',
            targetType: r.target_type, targetId: r.target_id, reason: r.reason, details: r.details,
            status: r.status, resolvedBy: r.resolved_by, resolvedAt: r.resolved_at, actionTaken: r.action_taken,
            createdAt: r.created_at, targetTitle, targetContent, targetAuthorName,
          };
        }));
        setReports(enrichedReports);
      }

      // Mod Logs
      const { data: logData } = await supabase.from('moderation_logs')
        .select('*, moderator:forum_users!moderation_logs_moderator_id_fkey(username, avatar), target_user:forum_users!moderation_logs_target_user_id_fkey(username, avatar)')
        .order('created_at', { ascending: false }).limit(200);
      if (logData) setModLogs(logData.map((l: any) => ({
        id: l.id, moderatorId: l.moderator_id,
        moderatorName: Array.isArray(l.moderator) ? l.moderator[0]?.username : l.moderator?.username || 'Unknown',
        action: l.action, targetType: l.target_type, targetId: l.target_id,
        targetUserId: l.target_user_id,
        targetUserName: l.target_user ? (Array.isArray(l.target_user) ? l.target_user[0]?.username : l.target_user?.username) : undefined,
        details: l.details || {}, createdAt: l.created_at,
      })));
    } catch (error) {
      console.error('Admin data load error:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (!permissions.isStaff) return null;

  const tabs: { key: TabKey; label: string; icon: typeof Shield; show: boolean }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3, show: true },
    { key: 'quicksetup', label: 'Quick Setup', icon: Zap, show: permissions.isStaff },
    { key: 'analytics', label: 'Analytics', icon: TrendingUp, show: permissions.isStaff },
    { key: 'categories', label: 'Categories', icon: Layers, show: permissions.canManageCategories },
    { key: 'topics', label: 'Topics', icon: FolderTree, show: permissions.canManageCategories },
    { key: 'threads', label: 'Threads', icon: FileText, show: permissions.canManageThreads },
    { key: 'posts', label: 'Posts', icon: MessageSquare, show: permissions.canManagePosts },
    { key: 'users', label: 'Users', icon: Users, show: permissions.canManageUsers },
    { key: 'reports', label: 'Reports', icon: AlertTriangle, show: permissions.canViewReports },
    { key: 'modlog', label: 'Mod Log', icon: Clock, show: permissions.canViewModLogs },
    { key: 'banners', label: 'Banners', icon: Megaphone, show: permissions.isStaff },
    { key: 'system', label: 'System', icon: Server, show: permissions.isAdmin },
    { key: 'settings', label: 'Settings', icon: Settings, show: permissions.canManageSettings },
  ];

  return (
    <div className="min-h-screen bg-forum-bg pb-20 lg:pb-0">
      <ForumHeader searchQuery={searchQuery} onSearchChange={setSearchQuery}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMobileMenuOpen={isMobileMenuOpen} />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-4 pb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted">
          <HomeIcon size={11} className="text-forum-pink" />
          <span className="text-forum-text hover:text-forum-pink transition-forum cursor-pointer" onClick={() => navigate('/')}>Forums</span>
          <ChevronRight size={10} />
          <span className="text-forum-muted">Admin Dashboard</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 space-y-4">
        {/* Header */}
        <div className="hud-panel p-6 flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-mono font-bold text-forum-text flex items-center gap-2">
              <Shield size={18} className="text-forum-pink" /> Admin Dashboard
            </h1>
            <p className="text-[11px] font-mono text-forum-muted mt-1">
              Full control panel • Logged in as <span className="text-forum-pink">{currentUser.username}</span> ({currentUser.role})
            </p>
          </div>
          <button onClick={loadData} disabled={isLoading}
            className="transition-forum flex items-center gap-1.5 rounded-md border border-forum-border px-3 py-1.5 text-[10px] font-mono text-forum-muted hover:text-forum-pink hover:border-forum-pink/30 disabled:opacity-40">
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {tabs.filter(t => t.show).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`transition-forum flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-mono font-medium whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-forum-pink/10 text-forum-pink border border-forum-pink/20'
                  : 'text-forum-muted hover:text-forum-text hover:bg-forum-hover'
              }`}>
              <tab.icon size={12} />
              {tab.label}
              {tab.key === 'reports' && stats.pendingReports > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-[1px] text-[8px] text-white ml-1">{stats.pendingReports}</span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="hud-panel flex items-center justify-center py-20">
            <RefreshCw size={20} className="text-forum-pink animate-spin" />
            <span className="ml-3 text-[12px] font-mono text-forum-muted">Loading admin data...</span>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <AdminOverviewTab stats={stats} recentLogs={modLogs} onNavigateTab={setActiveTab as any} formatDate={formatDate} />
            )}
            {activeTab === 'quicksetup' && (
              <AdminQuickSetupTab currentUserId={currentUser.id} onRefresh={loadData} onLogAction={logModAction} />
            )}
            {activeTab === 'categories' && (
              <AdminCategoriesTab categories={categories} onRefresh={loadData} onLogAction={logModAction} />
            )}
            {activeTab === 'topics' && (
              <AdminTopicsTab onRefresh={loadData} onLogAction={logModAction} />
            )}
            {activeTab === 'threads' && (
              <AdminThreadsTab threads={threads} categories={categories.map(c => ({ id: c.id, name: c.name }))}
                currentUserId={currentUser.id} onRefresh={loadData} onLogAction={logModAction} formatDate={formatDate} />
            )}
            {activeTab === 'posts' && (
              <AdminPostsTab posts={posts} onRefresh={loadData} onLogAction={logModAction} formatDate={formatDate} />
            )}
            {activeTab === 'users' && (
              <AdminUsersTab users={users} currentUserId={currentUser.id} currentUserRole={currentUser.role}
                onRefresh={loadData} onLogAction={logModAction} formatDate={formatDate} />
            )}
            {activeTab === 'reports' && (
              <AdminReportsTab reports={reports} currentUserId={currentUser.id}
                onRefresh={loadData} onLogAction={logModAction} formatDate={formatDate} />
            )}
            {activeTab === 'modlog' && (
              <AdminModLogTab logs={modLogs} formatDate={formatDate} />
            )}
            {activeTab === 'banners' && (
              <AdminBannersTab />
            )}
            {activeTab === 'analytics' && (
              <AdminAnalyticsTab />
            )}
            {activeTab === 'system' && (
              <AdminSystemTab />
            )}
            {activeTab === 'settings' && (
              <AdminSettingsTab />
            )}
          </>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}
