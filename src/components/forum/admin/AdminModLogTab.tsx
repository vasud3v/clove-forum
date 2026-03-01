import { useState } from 'react';
import { Clock, Search, Shield } from 'lucide-react';
import type { ModerationLog } from '@/types/forum';

interface Props {
  logs: ModerationLog[];
  formatDate: (d: string) => string;
}

const ACTION_COLORS: Record<string, string> = {
  thread_pin: 'text-amber-400', thread_unpin: 'text-amber-400',
  thread_lock: 'text-red-400', thread_unlock: 'text-emerald-400',
  thread_delete: 'text-red-500', thread_move: 'text-blue-400',
  thread_create: 'text-emerald-400', thread_feature: 'text-forum-pink',
  thread_archive: 'text-gray-400',
  post_delete: 'text-red-500', post_edit: 'text-blue-400',
  user_ban: 'text-red-500', user_unban: 'text-emerald-400',
  user_warn: 'text-amber-400', user_role_change: 'text-purple-400',
  user_restrict: 'text-orange-400',
  category_create: 'text-emerald-400', category_edit: 'text-blue-400',
  category_delete: 'text-red-500', category_reorder: 'text-forum-muted',
  topic_create: 'text-emerald-400', topic_edit: 'text-blue-400',
  topic_delete: 'text-red-500',
  report_resolve: 'text-emerald-400', report_dismiss: 'text-forum-muted',
};

export default function AdminModLogTab({ logs, formatDate }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const actionTypes = Array.from(new Set(logs.map(l => l.action)));

  const filtered = logs.filter(l => {
    const matchesSearch = !searchQuery ||
      l.moderatorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.targetUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-forum-muted" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search logs..."
            className="w-full rounded-md border border-forum-border bg-forum-bg pl-8 pr-3 py-1.5 text-[10px] font-mono text-forum-text outline-none focus:border-forum-pink" />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="rounded-md border border-forum-border bg-forum-bg px-3 py-1.5 text-[10px] font-mono text-forum-text outline-none">
          <option value="all">All Actions</option>
          {actionTypes.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="hud-panel overflow-hidden">
        <div className="border-b border-forum-border px-4 py-3">
          <h3 className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
            <Clock size={13} className="text-forum-pink" /> Moderation Log ({filtered.length})
          </h3>
        </div>
        <div className="divide-y divide-forum-border/20 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Clock size={30} className="text-forum-muted/20 mx-auto mb-2" />
              <p className="text-[11px] font-mono text-forum-muted">No moderation logs found</p>
            </div>
          ) : filtered.map(log => (
            <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-forum-hover/30 transition-forum">
              <Shield size={10} className="text-forum-pink flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-semibold text-forum-text">{log.moderatorName || 'Staff'}</span>
                  <span className={`text-[9px] font-mono font-semibold ${ACTION_COLORS[log.action] || 'text-forum-muted'}`}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[9px] font-mono text-forum-muted">{log.targetType}</span>
                  {log.targetUserName && (
                    <span className="text-[10px] font-mono text-forum-text">→ {log.targetUserName}</span>
                  )}
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="text-[8px] font-mono text-forum-muted mt-0.5">
                    {Object.entries(log.details).map(([k, v]) => (
                      <span key={k} className="mr-2">{k}: {String(v)}</span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[8px] font-mono text-forum-muted flex-shrink-0 flex items-center gap-0.5">
                <Clock size={7} /> {formatDate(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
