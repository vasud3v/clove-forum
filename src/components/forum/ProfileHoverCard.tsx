import { useState, useRef, useEffect } from 'react';
import UserProfileMiniCard from './UserProfileMiniCard';
import { User } from '@/types/forum';

interface ProfileHoverCardProps {
  user: User;
  children: React.ReactNode;
}

export default function ProfileHoverCard({ user, children }: ProfileHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(true), 400); // 400ms delay to prevent accidental flashes
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(false), 300); // 300ms grace period before closing
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div 
      className="relative inline-block isolate z-10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isOpen && (
        <div 
          className="absolute left-[-10px] sm:left-0 top-full mt-2 md:left-full md:top-[-20px] md:mt-0 md:ml-4 w-[280px] z-50 animate-in fade-in zoom-in-95 duration-200"
          style={{ transformOrigin: 'top left' }}
        >
          {/* Invisible padding area to prevent losing hover when moving mouse down/right */}
          <div className="absolute -top-4 -left-4 -right-4 -bottom-4 bg-transparent -z-10" />
          
          <div className="shadow-brutal-lg  border-2 border-forum-border/40 overflow-hidden bg-forum-bg relative z-10">
            <UserProfileMiniCard user={user} />
          </div>
        </div>
      )}
    </div>
  );
}
