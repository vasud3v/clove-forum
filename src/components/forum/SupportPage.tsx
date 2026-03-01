import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ForumHeader from '@/components/forum/ForumHeader';
import MobileBottomNav from '@/components/forum/MobileBottomNav';
import { supabase } from '@/lib/supabase';
import { useForumContext } from '@/context/ForumContext';
import {
  Briefcase, Bug, Lightbulb, HelpCircle, Shield, User, Send, Clock,
  CheckCircle, XCircle, AlertCircle, MessageSquare, ChevronRight, Home,
} from 'lucide-react';
import { toast } from '@/components/forum/Toast';

interface Ticket {
  id: string;
  ticket_number: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

const categories = [
  { value: 'hiring', label: 'Job Application', icon: Briefcase, color: 'text-emerald-400', desc: 'Apply for moderator or staff positions' },
  { value: 'report', label: 'Report Content', icon: Shield, color: 'text-red-400', desc: 'Report rule violations or inappropriate content' },
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-orange-400', desc: 'Report technical issues or bugs' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-cyan-400', desc: 'Suggest new features or improvements' },
  { value: 'account', label: 'Account Issue', icon: User, color: 'text-purple-400', desc: 'Account-related problems or questions' },
  { value: 'general', label: 'General Support', icon: HelpCircle, color: 'text-forum-pink', desc: 'Other questions or concerns' },
];

const statusConfig = {
  open: { label: 'Open', icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  in_progress: { label: 'In Progress', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  resolved: { label: 'Resolved', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  closed: { label: 'Closed', icon: XCircle, color: 'text-forum-muted', bg: 'bg-forum-muted/10', border: 'border-forum-muted/30' },
};

export default function SupportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useForumContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [view, setView] = useState<'form' | 'tickets'>('form');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  
  const preselectedCategory = searchParams.get('category') || '';
  
  const [formData, setFormData] = useState({
    category: preselectedCategory,
    subject: '',
    message: '',
  });

  useEffect(() => {
    if (view === 'tickets') {
      fetchTickets();
    }
  }, [view]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: currentUser.id,
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          status: 'open',
          priority: formData.category === 'report' ? 'high' : 'normal',
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Ticket submitted successfully!');
      setFormData({ category: '', subject: '', message: '' });
      setView('tickets');
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      toast.error('Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(c => c.value === formData.category);

  return (
    <div className="min-h-screen bg-forum-bg pb-20 lg:pb-0">
      <ForumHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="mx-auto max-w-4xl px-4 py-4 lg:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted mb-4">
          <Home size={11} className="text-forum-pink" />
          <span className="text-forum-text hover:text-forum-pink transition-forum cursor-pointer" onClick={() => navigate('/')}>
            Forums
          </span>
          <ChevronRight size={10} />
          <span className="text-forum-muted">Support</span>
        </div>

        {/* Header */}
        <div className="hud-panel p-6 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-forum-pink/15 border border-forum-pink/25">
              <HelpCircle size={24} className="text-forum-pink" />
            </div>
            <div>
              <h1 className="text-[18px] font-mono font-bold text-forum-text">Support Center</h1>
              <p className="text-[11px] font-mono text-forum-muted">Get help or submit a request</p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setView('form')}
              className={`px-4 py-2 rounded-md text-[11px] font-mono transition-all ${
                view === 'form'
                  ? 'bg-forum-pink/10 border border-forum-pink/30 text-forum-pink'
                  : 'bg-forum-bg border border-forum-border text-forum-muted hover:bg-forum-hover'
              }`}
            >
              New Ticket
            </button>
            <button
              onClick={() => setView('tickets')}
              className={`px-4 py-2 rounded-md text-[11px] font-mono transition-all ${
                view === 'tickets'
                  ? 'bg-forum-pink/10 border border-forum-pink/30 text-forum-pink'
                  : 'bg-forum-bg border border-forum-border text-forum-muted hover:bg-forum-hover'
              }`}
            >
              My Tickets ({tickets.length})
            </button>
          </div>
        </div>

        {/* Form View */}
        {view === 'form' && (
          <div className="space-y-4">
            {/* Category Selection */}
            <div className="hud-panel p-4">
              <h2 className="text-[13px] font-bold text-forum-text font-mono mb-3">Select Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setFormData({ ...formData, category: cat.value })}
                      className={`p-4 rounded-lg border transition-all text-left ${
                        formData.category === cat.value
                          ? 'border-forum-pink/40 bg-forum-pink/5'
                          : 'border-forum-border bg-forum-bg hover:bg-forum-hover'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon size={20} className={cat.color} />
                        <div>
                          <h3 className="text-[12px] font-bold text-forum-text font-mono">{cat.label}</h3>
                          <p className="text-[10px] text-forum-muted font-mono mt-1">{cat.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            {formData.category && (
              <form onSubmit={handleSubmit} className="hud-panel p-4 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-forum-border">
                  {selectedCategory && <selectedCategory.icon size={16} className={selectedCategory.color} />}
                  <h2 className="text-[13px] font-bold text-forum-text font-mono">
                    {selectedCategory?.label}
                  </h2>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-forum-muted mb-2">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-forum-bg border border-forum-border rounded-md text-[12px] font-mono text-forum-text focus:border-forum-pink focus:outline-none"
                    placeholder="Brief description of your request"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-forum-muted mb-2">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 bg-forum-bg border border-forum-border rounded-md text-[12px] font-mono text-forum-text focus:border-forum-pink focus:outline-none"
                    rows={8}
                    placeholder="Provide detailed information about your request..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-forum-pink/10 border border-forum-pink/30 text-forum-pink hover:bg-forum-pink/20 transition-all text-[12px] font-mono font-bold disabled:opacity-50"
                >
                  <Send size={14} />
                  {loading ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tickets View */}
        {view === 'tickets' && (
          <div className="space-y-3">
            {loading ? (
              <div className="hud-panel p-8 text-center">
                <p className="text-[11px] font-mono text-forum-muted">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="hud-panel p-8 text-center">
                <MessageSquare size={40} className="text-forum-muted/20 mx-auto mb-3" />
                <p className="text-[12px] font-mono text-forum-muted">No tickets yet</p>
                <button
                  onClick={() => setView('form')}
                  className="mt-4 px-4 py-2 rounded-md bg-forum-pink/10 border border-forum-pink/30 text-forum-pink hover:bg-forum-pink/20 transition-all text-[11px] font-mono"
                >
                  Create Your First Ticket
                </button>
              </div>
            ) : (
              tickets.map((ticket) => {
                const status = statusConfig[ticket.status as keyof typeof statusConfig];
                const category = categories.find(c => c.value === ticket.category);
                const StatusIcon = status.icon;
                const CategoryIcon = category?.icon || HelpCircle;

                return (
                  <div key={ticket.id} className="hud-panel p-4 hover:border-forum-pink/30 transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <CategoryIcon size={18} className={category?.color || 'text-forum-muted'} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-forum-muted">{ticket.ticket_number}</span>
                            <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full ${status.bg} ${status.border} border ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <h3 className="text-[12px] font-bold text-forum-text font-mono mb-1">{ticket.subject}</h3>
                          <p className="text-[10px] text-forum-muted font-mono line-clamp-2">{ticket.message}</p>
                          <p className="text-[9px] text-forum-muted/60 font-mono mt-2">
                            Created {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <StatusIcon size={16} className={status.color} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}
