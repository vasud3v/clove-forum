import { ReactNode } from 'react';

interface NavbarTooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function NavbarTooltip({ 
  content, 
  children, 
  position = 'bottom',
  delay = 200 
}: NavbarTooltipProps) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className={`
        absolute hidden group-hover:block z-50
        px-2 py-1 text-[10px] font-mono text-white
        bg-black border border-forum-pink/40 rounded
        whitespace-nowrap after:content-['']
        transition-all duration-200 delay-${delay}
        ${position === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : ''}
        ${position === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' : ''}
        ${position === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' : ''}
        ${position === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' : ''}
      `}>
        {content}
        <div className={`
          absolute w-1 h-1 bg-forum-pink/40 rotate-45
          ${position === 'top' ? '-bottom-0.5 left-1/2 -translate-x-1/2' : ''}
          ${position === 'bottom' ? '-top-0.5 left-1/2 -translate-x-1/2' : ''}
          ${position === 'left' ? '-right-0.5 top-1/2 -translate-y-1/2' : ''}
          ${position === 'right' ? '-left-0.5 top-1/2 -translate-y-1/2' : ''}
        `} />
      </div>
    </div>
  );
}
