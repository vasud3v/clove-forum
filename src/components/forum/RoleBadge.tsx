import { Shield, Sword, Star, Crown, Zap, Sparkles } from 'lucide-react';
import { UserRole, ROLE_LABELS, ROLE_COLORS, ROLE_BG_COLORS } from '@/types/forum';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  showLabel?: boolean;
}

const ROLE_ICONS: Partial<Record<UserRole, typeof Shield>> = {
  admin: Crown,
  super_moderator: Sword,
  moderator: Star,
};

export default function RoleBadge({ role, size = 'sm', showIcon = true, showLabel = true }: RoleBadgeProps) {
  // Don't show badge for regular members or restricted
  if (role === 'member' || role === 'restricted') return null;

  const Icon = ROLE_ICONS[role];
  const label = ROLE_LABELS[role];
  const colorClass = ROLE_COLORS[role];
  const bgClass = ROLE_BG_COLORS[role];

  const sizeClasses = size === 'sm'
    ? 'text-[8px] px-1.5 py-[1px] gap-0.5'
    : 'text-[10px] px-2 py-0.5 gap-1';

  const iconSize = size === 'sm' ? 8 : 10;

  // GOD MODE BADGE - Epic styling for admin role
  if (role === 'admin') {
    return (
      <span
        className={`inline-flex items-center rounded-md border font-mono font-bold uppercase tracking-wider relative overflow-hidden group ${sizeClasses}`}
        style={{
          background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 25%, #ffd700 50%, #ffed4e 75%, #ffd700 100%)',
          backgroundSize: '200% 200%',
          animation: 'shimmer 3s ease-in-out infinite',
          borderColor: '#ffd700',
          color: '#1a1a1a',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.5)',
        }}
        title="👑 GOD MODE - Supreme Administrator"
      >
        {/* Animated sparkle effect */}
        <span className="absolute inset-0 opacity-30">
          <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-slide-shine" />
        </span>
        
        {/* Crown icon with pulse */}
        {showIcon && (
          <Crown 
            size={iconSize} 
            className="relative z-10 animate-pulse drop-shadow-[0_0_3px_rgba(255,215,0,1)]" 
            fill="currentColor"
          />
        )}
        
        {/* Sparkles */}
        {showIcon && size === 'md' && (
          <>
            <Sparkles size={6} className="absolute -top-0.5 -left-0.5 text-yellow-300 animate-ping" />
            <Sparkles size={6} className="absolute -top-0.5 -right-0.5 text-yellow-300 animate-ping" style={{ animationDelay: '0.5s' }} />
          </>
        )}
        
        {/* Label with glow */}
        {showLabel && (
          <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            GOD MODE
          </span>
        )}
        
        {/* Lightning bolt accent */}
        {size === 'md' && (
          <Zap 
            size={iconSize - 2} 
            className="relative z-10 ml-0.5 animate-pulse" 
            fill="currentColor"
            style={{ animationDelay: '0.3s' }}
          />
        )}
      </span>
    );
  }

  // Regular badges for other roles
  return (
    <span
      className={`inline-flex items-center rounded-sm border font-mono font-semibold uppercase tracking-wider ${colorClass} ${bgClass} ${sizeClasses}`}
      title={label}
    >
      {showIcon && Icon && <Icon size={iconSize} />}
      {showLabel && <span>{label}</span>}
    </span>
  );
}
