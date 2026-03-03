import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Briefcase, Megaphone, Info, AlertTriangle, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Banner {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'hiring' | 'announcement' | 'warning';
  link_text?: string;
  link_url?: string;
  is_dismissible: boolean;
}

const bannerConfig = {
  info: {
    icon: Info,
    color: 'text-white',
    bg: 'from-cyan-500/5 via-transparent to-cyan-500/5',
    border: 'border-cyan-500/25',
    iconBg: 'bg-cyan-500/15 border-cyan-500/25',
    glow: 'shadow-cyan-glow',
  },
  hiring: {
    icon: Briefcase,
    color: 'text-white',
    bg: 'from-emerald-600/20 via-transparent to-emerald-600/20',
    border: 'border-emerald-600',
    iconBg: 'bg-emerald-600/30 border-emerald-600',
    glow: 'shadow-emerald-glow',
  },
  announcement: {
    icon: Megaphone,
    color: 'text-primary',
    bg: 'from-forum-pink/5 via-transparent to-forum-pink/5',
    border: 'border-primary/25',
    iconBg: 'bg-primary/15 border-primary/25',
    glow: 'shadow-brutal-sm',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'from-amber-500/5 via-transparent to-amber-500/5',
    border: 'border-amber-500/25',
    iconBg: 'bg-amber-500/15 border-amber-500/25',
    glow: 'shadow-amber-glow',
  },
};

export default function AnnouncementBanner() {
  const navigate = useNavigate();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([]);

  useEffect(() => {
    // Load dismissed banners from localStorage
    const dismissed = localStorage.getItem('dismissedBanners');
    if (dismissed) {
      setDismissedBanners(JSON.parse(dismissed));
    }

    const fetchActiveBanner = async () => {
      try {
        const { data, error } = await supabase
          .from('announcement_banners')
          .select('*')
          .eq('is_active', true)
          .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setBanner(data);
          // Check if this banner was dismissed
          const dismissed = localStorage.getItem('dismissedBanners');
          if (dismissed) {
            const dismissedList = JSON.parse(dismissed);
            setIsVisible(!dismissedList.includes(data.id));
          }
        }
      } catch (error) {
        console.error('Failed to fetch announcement banner:', error);
      }
    };

    fetchActiveBanner();

    // Subscribe to changes
    const channel = supabase
      .channel('announcement_banners_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcement_banners',
        },
        () => {
          fetchActiveBanner();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDismiss = () => {
    if (banner) {
      const dismissed = [...dismissedBanners, banner.id];
      setDismissedBanners(dismissed);
      localStorage.setItem('dismissedBanners', JSON.stringify(dismissed));
      setIsVisible(false);
    }
  };

  if (!banner || !isVisible) return null;

  const config = bannerConfig[banner.type];
  const Icon = config.icon;

  return (
    <div className={`relative overflow-hidden hud-panel ${config.border}`}>
      {/* Scanline overlay effect */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          }}
        />
      </div>

      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-r ${config.bg}`} />

      <div className="relative flex items-center gap-4 px-5 py-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className={`flex h-11 w-11 items-center justify-center  border ${config.iconBg} ${config.glow}`}>
            <Icon size={20} className={config.color} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[13px] font-bold text-forum-text font-mono">
              <span className={`${config.color}`}>{banner.title}</span>
            </h3>
            {banner.type === 'hiring' && (
              <span className="flex items-center gap-1  border border-emerald-600 bg-emerald-600/30 px-2 py-0.5 text-[8px] font-mono font-semibold uppercase tracking-wider text-black">
                Open
              </span>
            )}
          </div>
          <p className="text-[11px] text-forum-muted font-mono leading-relaxed">
            {banner.message}
            {banner.link_text && banner.link_url && (
              <>
                {' '}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (banner.link_url.startsWith('http')) {
                      window.open(banner.link_url, '_blank');
                    } else {
                      navigate(banner.link_url);
                    }
                  }}
                  className={`${config.color} hover:opacity-80 transition-forum inline-flex items-center gap-0.5 cursor-pointer underline`}
                >
                  {banner.link_text} <ExternalLink size={9} />
                </button>
              </>
            )}
          </p>
        </div>

        {/* Dismiss */}
        {banner.is_dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 transition-forum  p-1.5 text-forum-muted hover:bg-forum-hover hover:text-primary"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Bottom accent bar */}
      <div className={`h-[1px] bg-gradient-to-r from-transparent via-${config.color}/40 to-transparent`} />
    </div>
  );
}
