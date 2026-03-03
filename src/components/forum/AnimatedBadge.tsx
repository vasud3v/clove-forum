import { ReactNode } from 'react';

interface AnimatedBadgeProps {
  count?: number;
  isActive?: boolean;
  children: ReactNode;
  pulse?: boolean;
}

export function AnimatedBadge({ 
  count = 0, 
  isActive = false,
  children,
  pulse = true 
}: AnimatedBadgeProps) {
  return (
    <div className="relative inline-block">
      {children}
      {count > 0 && (
        <div className={`
          absolute -top-1 -right-1 min-w-5 h-5 
           bg-primary to-forum-pink/80
          text-[10px] font-bold text-white
          flex items-center justify-center
          border border-forum-card ring-1 ring-primary
          transition-all duration-300
          ${pulse ? 'animate-pulse' : ''}
          ${isActive ? 'scale-110' : 'scale-100'}
        `}>
          {count > 99 ? '99+' : count}
        </div>
      )}
      {isActive && (
        <div className="absolute top-1 right-1 w-2 h-2  bg-green-400 animate-pulse border border-green-300" />
      )}
    </div>
  );
}
