import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ForumHeader from '@/components/forum/ForumHeader';
import MobileBottomNav from '@/components/forum/MobileBottomNav';
import { supabase } from '@/lib/supabase';
import { useForumContext } from '@/context/ForumContext';
import { usePermissions } from '@/hooks/usePermissions';
import { getUserAvatar } from '@/lib/avatar';
import {
    BarChart3,
    TrendingUp,
    Users,
    MessageSquare,
    FileText,
    Eye,
    Clock,
    ChevronRight,
    Home as HomeIcon,
    Activity,
    Calendar,
    Shield,
    AlertTriangle,
} from 'lucide-react';

interface DailyStats {
    date: string;
    posts: number;
    threads: number;
}

interface TopThread {
    id: string;
    title: string;
    viewCount: number;
    replyCount: number;
    authorName: string;
}

interface TopUser {
    id: string;
    username: string;
    avatar: string;
    
    postCount: number;
    reputation: number;
}

export default function AnalyticsDashboard() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { getUserProfile } = useForumContext();
    const { isStaff } = usePermissions();
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [topThreads, setTopThreads] = useState<TopThread[]>([]);
    const [topUsers, setTopUsers] = useState<TopUser[]>([]);
    const [totalStats, setTotalStats] = useState({
        posts7d: 0,
        threads7d: 0,
        newUsers7d: 0,
        views7d: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setIsLoading(true);
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

            // Get posts in last 7 days
            const { count: posts7d } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo);

            // Get threads in last 7 days
            const { count: threads7d } = await supabase
                .from('threads')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo);

            // Get new users in last 7 days
            const { count: newUsers7d } = await supabase
                .from('forum_users')
                .select('*', { count: 'exact', head: true })
                .gte('join_date', sevenDaysAgo);

            setTotalStats({
                posts7d: posts7d || 0,
                threads7d: threads7d || 0,
                newUsers7d: newUsers7d || 0,
                views7d: 0,
            });

            // Build daily stats for the last 7 days
            const daily: DailyStats[] = [];
            for (let i = 6; i >= 0; i--) {
                const dayStart = new Date();
                dayStart.setDate(dayStart.getDate() - i);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(dayStart);
                dayEnd.setHours(23, 59, 59, 999);

                const { count: dayPosts } = await supabase
                    .from('posts')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', dayStart.toISOString())
                    .lte('created_at', dayEnd.toISOString());

                const { count: dayThreads } = await supabase
                    .from('threads')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', dayStart.toISOString())
                    .lte('created_at', dayEnd.toISOString());

                daily.push({
                    date: dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                    posts: dayPosts || 0,
                    threads: dayThreads || 0,
                });
            }
            setDailyStats(daily);

            // Top threads by views
            const { data: topThreadsData } = await supabase
                .from('threads')
                .select(`
          id, title, view_count, reply_count,
          author:forum_users!threads_author_id_fkey(username, avatar)
        `)
                .order('view_count', { ascending: false })
                .limit(10);

            if (topThreadsData) {
                setTopThreads(
                    topThreadsData.map((t: any) => ({
                        id: t.id,
                        title: t.title,
                        viewCount: t.view_count,
                        replyCount: t.reply_count,
                        authorName: Array.isArray(t.author) ? t.author[0]?.username : t.author?.username || 'Unknown',
                    }))
                );
            }

            // Top users by post count
            const { data: topUsersData } = await supabase
                .from('forum_users')
                .select('id, username, avatar, post_count, reputation')
                .order('post_count', { ascending: false })
                .limit(10);

            if (topUsersData) {
                setTopUsers(
                    topUsersData.map((u: any) => ({
                        id: u.id,
                        username: u.username,
                        avatar: u.avatar,
                        
                        postCount: u.post_count,
                        reputation: u.reputation,
                    }))
                );
            }
        } catch (error) {
            console.error('Analytics load error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const maxPosts = Math.max(...dailyStats.map((d) => d.posts), 1);

    const summaryCards = [
        { label: 'Posts (7d)', value: totalStats.posts7d, icon: MessageSquare, color: 'text-white', bg: 'bg-cyan-500/10' },
        { label: 'Threads (7d)', value: totalStats.threads7d, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'New Users (7d)', value: totalStats.newUsers7d, icon: Users, color: 'text-white', bg: 'bg-emerald-600/40' },
        { label: 'Activity', value: totalStats.posts7d + totalStats.threads7d, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    ];

    // Access control - only staff can view analytics
    if (!isStaff) {
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
                        <HomeIcon size={11} className="text-primary" />
                        <span className="text-forum-text hover:text-primary transition-forum cursor-pointer" onClick={() => navigate('/')}>
                            Forums
                        </span>
                        <ChevronRight size={10} />
                        <span className="text-forum-muted">Analytics</span>
                    </div>
                </div>

                {/* Access Denied */}
                <div className="mx-auto max-w-7xl px-4 lg:px-6 py-12">
                    <div className="hud-panel p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="h-16 w-16  bg-primary/10 flex items-center justify-center">
                                <Shield size={32} className="text-primary" />
                            </div>
                        </div>
                        <h2 className="text-[18px] font-bold text-forum-text font-mono mb-2">Access Restricted</h2>
                        <p className="text-[12px] text-forum-muted font-mono mb-6 max-w-md mx-auto">
                            Analytics dashboard is only accessible to moderators and administrators.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="transition-forum rounded bg-primary px-6 py-2.5 text-[11px] font-mono font-semibold text-white hover:shadow-brutal-sm active:scale-95 border border-primary/50"
                        >
                            Back to Forums
                        </button>
                    </div>
                </div>

                <MobileBottomNav />
            </div>
        );
    }

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
                    <HomeIcon size={11} className="text-primary" />
                    <span className="text-forum-text hover:text-primary transition-forum cursor-pointer" onClick={() => navigate('/')}>
                        Forums
                    </span>
                    <ChevronRight size={10} />
                    <span className="text-forum-muted">Analytics</span>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 space-y-4">
                {/* Header */}
                <div className="hud-panel p-6">
                    <h1 className="text-[18px] font-mono font-bold text-forum-text flex items-center gap-2">
                        <BarChart3 size={18} className="text-primary" />
                        Forum Analytics
                    </h1>
                    <p className="text-[11px] font-mono text-forum-muted mt-1">Last 7 days overview</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {summaryCards.map((card) => (
                        <div key={card.label} className="hud-panel p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-1.5  ${card.bg}`}>
                                    <card.icon size={14} className={card.color} />
                                </div>
                                <span className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">
                                    {card.label}
                                </span>
                            </div>
                            <div className="text-[24px] font-mono font-bold text-forum-text">
                                {card.value.toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Daily Activity Bar Chart */}
                <div className="hud-panel p-4">
                    <h3 className="text-[12px] font-mono font-bold text-forum-text mb-4 flex items-center gap-2">
                        <Calendar size={13} className="text-primary" />
                        Daily Activity (Posts)
                    </h3>
                    <div className="flex items-end gap-2 h-40">
                        {dailyStats.map((day, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[8px] font-mono text-forum-muted">{day.posts}</span>
                                <div className="w-full flex flex-col gap-0.5">
                                    <div
                                        className="w-full bg-gradient-to-t from-forum-pink to-forum-pink/60 rounded-t-sm transition-all duration-500"
                                        style={{ height: `${Math.max((day.posts / maxPosts) * 120, 4)}px` }}
                                    />
                                </div>
                                <span className="text-[7px] font-mono text-forum-muted truncate w-full text-center">
                                    {day.date.split(', ')[0]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-4">
                    {/* Top Threads */}
                    <div className="hud-panel overflow-hidden">
                        <div className="border-b border-forum-border px-4 py-3">
                            <h3 className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
                                <TrendingUp size={13} className="text-primary" />
                                Top Threads by Views
                            </h3>
                        </div>
                        <div className="divide-y divide-forum-border/20">
                            {topThreads.slice(0, 5).map((thread, i) => (
                                <div
                                    key={thread.id}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-forum-hover/30 transition-forum cursor-pointer"
                                    onClick={() => navigate(`/thread/${thread.id}`)}
                                >
                                    <span className="text-[10px] font-mono font-bold text-forum-muted w-5 text-center">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[10px] font-mono text-forum-text line-clamp-1 hover:text-primary">
                                            {thread.title}
                                        </span>
                                        <div className="flex items-center gap-2 text-[8px] font-mono text-forum-muted mt-0.5">
                                            <span>by {thread.authorName}</span>
                                            <span className="flex items-center gap-0.5"><Eye size={7} /> {thread.viewCount.toLocaleString()}</span>
                                            <span className="flex items-center gap-0.5"><MessageSquare size={7} /> {thread.replyCount}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Users */}
                    <div className="hud-panel overflow-hidden">
                        <div className="border-b border-forum-border px-4 py-3">
                            <h3 className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
                                <Users size={13} className="text-primary" />
                                Top Users by Posts
                            </h3>
                        </div>
                        <div className="divide-y divide-forum-border/20">
                            {topUsers.slice(0, 5).map((user, i) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-forum-hover/30 transition-forum cursor-pointer"
                                    onClick={() => navigate(`/user/${user.id}`)}
                                >
                                    <span className="text-[10px] font-mono font-bold text-forum-muted w-5 text-center">
                                        {i + 1}
                                    </span>
                                    <img
                                        src={user.avatar}
                                        alt={user.username}
                                        className="h-7 w-7  border border-forum-border object-cover"
                                    />
                                    <div className="flex-1">
                                        <span className="text-[10px] font-mono font-semibold text-forum-text hover:text-primary">
                                            {user.username}
                                        </span>
                                        <div className="flex items-center gap-2 text-[8px] font-mono text-forum-muted mt-0.5">
                                            <span>{user.postCount} posts</span>
                                            <span className="text-primary">{user.reputation} rep</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <MobileBottomNav />
        </div>
    );
}
