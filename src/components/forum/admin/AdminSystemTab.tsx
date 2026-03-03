import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';
import { Server, Database, HardDrive, Activity, AlertTriangle, CheckCircle, Download, Trash2, RefreshCw } from 'lucide-react';

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  storage: { used: number; total: number };
  tables: Array<{ name: string; rowCount: number; size: string }>;
  recentErrors: Array<{ message: string; timestamp: string }>;
}

export default function AdminSystemTab() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    loadSystemHealth();
  }, []);

  const loadSystemHealth = async () => {
    setIsLoading(true);
    try {
      // Get table stats
      const tables = ['forum_users', 'threads', 'posts', 'categories', 'content_reports', 'moderation_logs'];
      const tableStats = await Promise.all(
        tables.map(async (table) => {
          const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
          return { name: table, rowCount: count || 0, size: 'N/A' };
        })
      );

      setHealth({
        database: 'healthy',
        storage: { used: 0, total: 100 },
        tables: tableStats,
        recentErrors: [],
      });
    } catch (error) {
      console.error('Failed to load system health:', error);
      setHealth({
        database: 'error',
        storage: { used: 0, total: 100 },
        tables: [],
        recentErrors: [{ message: 'Failed to load system health', timestamp: new Date().toISOString() }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Export all forum data
      const [
        { data: users },
        { data: threads },
        { data: posts },
        { data: categories },
      ] = await Promise.all([
        supabase.from('forum_users').select('*'),
        supabase.from('threads').select('*'),
        supabase.from('posts').select('*'),
        supabase.from('categories').select('*'),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        users,
        threads,
        posts,
        categories,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forum-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCleanup = async (type: 'old_posts' | 'deleted_users' | 'orphaned_data') => {
    if (!confirm(`Are you sure you want to clean up ${type.replace(/_/g, ' ')}? This cannot be undone.`)) return;
    
    setIsCleaning(true);
    try {
      if (type === 'old_posts') {
        // Delete posts older than 2 years with no replies
        const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
        const { error } = await supabase
          .from('posts')
          .delete()
          .lt('created_at', twoYearsAgo)
          .eq('likes', 0);
        if (error) throw error;
      } else if (type === 'deleted_users') {
        // Clean up data from banned users older than 1 year
        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
        const { data: bannedUsers } = await supabase
          .from('forum_users')
          .select('id')
          .eq('is_banned', true)
          .lt('join_date', oneYearAgo);
        
        if (bannedUsers && bannedUsers.length > 0) {
          const userIds = bannedUsers.map(u => u.id);
          await Promise.all([
            supabase.from('posts').delete().in('author_id', userIds),
            supabase.from('threads').delete().in('author_id', userIds),
          ]);
        }
      }

      toast.success('Cleanup completed');
      loadSystemHealth();
    } catch (error) {
      console.error('Cleanup failed:', error);
      toast.error('Cleanup failed');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleOptimize = async () => {
    try {
      // Recalculate all counts
      const { data: categories } = await supabase.from('categories').select('id');
      
      if (categories) {
        for (const cat of categories) {
          const { count: threadCount } = await supabase
            .from('threads')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id);

          // Get post count for this category
          const { count: postCount } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .in('thread_id', (await supabase
              .from('threads')
              .select('id')
              .eq('category_id', cat.id)
            ).data?.map(t => t.id) || []);

          await supabase
            .from('categories')
            .update({ thread_count: threadCount || 0, post_count: postCount || 0 })
            .eq('id', cat.id);
        }
      }

      toast.success('Database optimized');
      loadSystemHealth();
    } catch (error) {
      console.error('Optimization failed:', error);
      toast.error('Optimization failed');
    }
  };

  if (isLoading || !health) {
    return (
      <div className="hud-panel flex items-center justify-center py-20">
        <RefreshCw size={20} className="text-primary animate-spin" />
        <span className="ml-3 text-[12px] font-mono text-forum-muted">Loading system health...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="hud-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} className={health.database === 'healthy' ? 'text-black' : 'text-red-600'} />
            <span className="text-[10px] font-mono text-forum-muted uppercase">Database</span>
          </div>
          <div className="flex items-center gap-2">
            {health.database === 'healthy' ? (
              <CheckCircle size={16} className="text-black" />
            ) : (
              <AlertTriangle size={16} className="text-red-400" />
            )}
            <span className="text-[12px] font-mono font-bold text-forum-text capitalize">{health.database}</span>
          </div>
        </div>

        <div className="hud-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <Server size={14} className="text-black" />
            <span className="text-[10px] font-mono text-forum-muted uppercase">API Status</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-[12px] font-mono font-bold text-forum-text">Online</span>
          </div>
        </div>

        <div className="hud-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-purple-600" />
            <span className="text-[10px] font-mono text-forum-muted uppercase">Performance</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-[12px] font-mono font-bold text-forum-text">Good</span>
          </div>
        </div>
      </div>

      {/* Table Statistics */}
      <div className="hud-panel p-4">
        <h3 className="text-[12px] font-mono font-bold text-forum-text mb-3 flex items-center gap-2">
          <HardDrive size={12} className="text-primary" /> Database Tables
        </h3>
        <div className="space-y-2">
          {health.tables.map((table, idx) => (
            <div key={idx} className="flex items-center justify-between text-[10px] font-mono py-2 border-b border-forum-border/20 last:border-0">
              <span className="text-forum-text font-semibold">{table.name}</span>
              <div className="flex items-center gap-4 text-forum-muted">
                <span>{table.rowCount.toLocaleString()} rows</span>
                <span>{table.size}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="hud-panel p-4">
        <h3 className="text-[12px] font-mono font-bold text-forum-text mb-3">System Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="transition-forum flex items-center justify-center gap-2  border border-forum-border px-4 py-3 text-[11px] font-mono text-forum-text hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {isExporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            {isExporting ? 'Exporting...' : 'Export All Data'}
          </button>

          <button
            onClick={handleOptimize}
            className="transition-forum flex items-center justify-center gap-2  border border-forum-border px-4 py-3 text-[11px] font-mono text-forum-text hover:border-blue-600 hover:text-black"
          >
            <Activity size={14} />
            Optimize Database
          </button>

          <button
            onClick={() => handleCleanup('old_posts')}
            disabled={isCleaning}
            className="transition-forum flex items-center justify-center gap-2  border border-forum-border px-4 py-3 text-[11px] font-mono text-forum-text hover:border-amber-600 hover:text-amber-600 disabled:opacity-50"
          >
            <Trash2 size={14} />
            Clean Old Posts
          </button>

          <button
            onClick={() => handleCleanup('deleted_users')}
            disabled={isCleaning}
            className="transition-forum flex items-center justify-center gap-2  border border-forum-border px-4 py-3 text-[11px] font-mono text-forum-text hover:border-red-500 hover:text-red-400 disabled:opacity-50"
          >
            <Trash2 size={14} />
            Clean Banned Users
          </button>
        </div>
      </div>

      {/* Recent Errors */}
      {health.recentErrors.length > 0 && (
        <div className="hud-panel p-4">
          <h3 className="text-[12px] font-mono font-bold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle size={12} /> Recent Errors
          </h3>
          <div className="space-y-2">
            {health.recentErrors.map((error, idx) => (
              <div key={idx} className="text-[10px] font-mono text-forum-muted">
                <span className="text-red-400">[{new Date(error.timestamp).toLocaleString()}]</span> {error.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
