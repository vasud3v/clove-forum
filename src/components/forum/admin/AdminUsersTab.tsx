import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Ban, AlertTriangle, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';
import { getUserAvatar } from '@/lib/avatar';
import { UserRole, ROLE_LABELS, ROLE_COLORS } from '@/types/forum';
import RoleBadge from '@/components/forum/RoleBadge';
import { useForumContext } from '@/context/ForumContext';

interface AdminUser {
  id: string;
  username: string;
  avatar: string;
  reputation: number;
  postCount: number;
  rank: string;
  role: UserRole;
  isOnline: boolean;
  isBanned: boolean;
  banReason?: string;
  joinDate: string;
}

interface Props {
  users: AdminUser[];
  currentUserId: string;
  currentUserRole: UserRole;
  onRefresh: () => void;
  onLogAction: (action: string, targetType: string, targetId: string, details?: Record<string, any>, targetUserId?: string) => Promise<void>;
  formatDate: (d: string) => string;
}

const ROLES: UserRole[] = ['admin', 'super_moderator', 'moderator', 'member', 'restricted'];

export default function AdminUsersTab({ users, currentUserId, currentUserRole, onRefresh, onLogAction, formatDate }: Props) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [banModal, setBanModal] = useState<{ userId: string; username: string } | null>(null);
  const [banReason, setBanReason] = useState('');
  const [warnModal, setWarnModal] = useState<{ userId: string; username: string } | null>(null);
  const [warnReason, setWarnReason] = useState('');
  const { getUserProfile } = useForumContext();

  const filtered = users.filter(u => {
    const matchesSearch = !searchQuery || u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === currentUserId) { toast.error("Can't change your own role"); return; }
    if (currentUserRole !== 'admin') { toast.error('Only admins can change roles'); return; }
    try {
      const { error } = await supabase.from('forum_users').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      const user = users.find(u => u.id === userId);
      await onLogAction('user_role_change', 'user', userId, { oldRole: user?.role, newRole }, userId);
      toast.success(`Role changed to ${ROLE_LABELS[newRole]}`);
      onRefresh();
    } catch { toast.error('Failed to change role'); }
  };

  const handleBan = async () => {
    if (!banModal) return;
    try {
      const { error } = await supabase.from('forum_users').update({
        is_banned: true, ban_reason: banReason || 'Banned by admin', role: 'restricted',
      }).eq('id', banModal.userId);
      if (error) throw error;
      await onLogAction('user_ban', 'user', banModal.userId, { reason: banReason }, banModal.userId);
      toast.success(`${banModal.username} banned`);
      setBanModal(null);
      setBanReason('');
      onRefresh();
    } catch { toast.error('Failed to ban user'); }
  };

  const handleUnban = async (userId: string) => {
    try {
      const { error } = await supabase.from('forum_users').update({
        is_banned: false, ban_reason: null, role: 'member',
      }).eq('id', userId);
      if (error) throw error;
      await onLogAction('user_unban', 'user', userId, {}, userId);
      toast.success('User unbanned');
      onRefresh();
    } catch { toast.error('Failed to unban'); }
  };

  const handleWarn = async () => {
    if (!warnModal || !warnReason.trim()) return;
    try {
      const { error } = await supabase.from('user_warnings').insert({
        user_id: warnModal.userId, issued_by: currentUserId, reason: warnReason, points: 1,
      });
      if (error) throw error;
      await onLogAction('user_warn', 'user', warnModal.userId, { reason: warnReason }, warnModal.userId);
      toast.success(`Warning issued to ${warnModal.username}`);
      setWarnModal(null);
      setWarnReason('');
    } catch { toast.error('Failed to warn user'); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-forum-muted" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search users..."
            className="w-full  border border-forum-border bg-forum-bg pl-8 pr-3 py-1.5 text-[10px] font-mono text-forum-text outline-none focus:border-primary" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className=" border border-forum-border bg-forum-bg px-3 py-1.5 text-[10px] font-mono text-forum-text outline-none">
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setBanModal(null)} />
          <div className="relative hud-panel p-5 w-full max-w-sm mx-4 space-y-3">
            <h3 className="text-[13px] font-mono font-bold text-red-400 flex items-center gap-2"><Ban size={14} /> Ban {banModal.username}</h3>
            <textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Reason for ban..."
              className="w-full  border border-forum-border bg-forum-bg px-3 py-2 text-[11px] font-mono text-forum-text outline-none focus:border-red-500 resize-none h-20" />
            <div className="flex gap-2">
              <button onClick={handleBan} className="transition-forum  bg-red-500 px-4 py-1.5 text-[10px] font-mono font-bold text-black hover:bg-red-600">Ban User</button>
              <button onClick={() => setBanModal(null)} className="transition-forum  border border-forum-border px-4 py-1.5 text-[10px] font-mono text-forum-muted">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Warn Modal */}
      {warnModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setWarnModal(null)} />
          <div className="relative hud-panel p-5 w-full max-w-sm mx-4 space-y-3">
            <h3 className="text-[13px] font-mono font-bold text-amber-600 flex items-center gap-2"><AlertTriangle size={14} /> Warn {warnModal.username}</h3>
            <textarea value={warnReason} onChange={e => setWarnReason(e.target.value)} placeholder="Warning reason..."
              className="w-full  border border-forum-border bg-forum-bg px-3 py-2 text-[11px] font-mono text-forum-text outline-none focus:border-amber-500 resize-none h-20" />
            <div className="flex gap-2">
              <button onClick={handleWarn} disabled={!warnReason.trim()} className="transition-forum  bg-amber-500 px-4 py-1.5 text-[10px] font-mono font-bold text-black hover:bg-amber-600 disabled:opacity-40">Issue Warning</button>
              <button onClick={() => setWarnModal(null)} className="transition-forum  border border-forum-border px-4 py-1.5 text-[10px] font-mono text-forum-muted">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="hud-panel overflow-hidden">
        <div className="border-b border-forum-border px-4 py-3">
          <h3 className="text-[12px] font-mono font-bold text-forum-text">Users ({filtered.length})</h3>
        </div>
        <div className="divide-y divide-forum-border/20 max-h-[600px] overflow-y-auto">
          {filtered.map(user => (
            <div key={user.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-forum-hover/30 transition-forum ${user.isBanned ? 'opacity-60' : ''}`}>
              <img src={user.avatar || getUserAvatar('', user.username)} alt={user.username} className="h-8 w-8  border border-forum-border object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold text-forum-text cursor-pointer hover:text-primary" onClick={() => navigate(`/user/${user.id}`)}>{user.username}</span>
                  <RoleBadge role={user.role} />
                  {user.isBanned && <span className="text-[7px] font-mono text-red-400 border border-red-500/20  px-1">BANNED</span>}
                  {user.isOnline && <div className="h-1.5 w-1.5  bg-emerald-400 animate-dot-pulse" />}
                </div>
                <div className="flex items-center gap-3 text-[8px] font-mono text-forum-muted mt-0.5">
                  <span>{user.postCount} posts</span>
                  <span className="text-primary">{user.reputation} rep</span>
                  <span>Joined {formatDate(user.joinDate)}</span>
                  {user.banReason && <span className="text-red-400">Ban: {user.banReason}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {currentUserRole === 'admin' && user.id !== currentUserId && (
                  <select value={user.role} onChange={e => handleRoleChange(user.id, e.target.value as UserRole)}
                    className={`rounded border border-forum-border/30 bg-forum-bg px-2 py-0.5 text-[9px] font-mono outline-none ${ROLE_COLORS[user.role]}`}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                )}
                {user.id !== currentUserId && (
                  <>
                    <button onClick={() => setWarnModal({ userId: user.id, username: user.username })}
                      className="transition-forum rounded p-1.5 text-forum-muted hover:text-amber-600 hover:bg-amber-500/10" title="Warn"><AlertTriangle size={11} /></button>
                    {user.isBanned ? (
                      <button onClick={() => handleUnban(user.id)} className="transition-forum rounded p-1.5 text-black bg-emerald-600/40" title="Unban"><Check size={11} /></button>
                    ) : (
                      <button onClick={() => setBanModal({ userId: user.id, username: user.username })}
                        className="transition-forum rounded p-1.5 text-forum-muted hover:text-red-400 hover:bg-red-500/10" title="Ban"><Ban size={11} /></button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
