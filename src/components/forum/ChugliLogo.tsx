interface ChugliLogoProps {
  size?: number;
  className?: string;
}

export default function ChugliLogo({ size = 32, className = '' }: ChugliLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`flex-shrink-0 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bold brutalist geometric design */}
      
      {/* Main black square structure */}
      <rect x="8" y="8" width="48" height="48" fill="none" stroke="#000000" strokeWidth="3" />
      
      {/* Inner structural frame */}
      <rect x="12" y="12" width="40" height="40" fill="none" stroke="#ffffff" strokeWidth="2" />
      
      {/* Diagonal structural lines - brutalist asymmetry */}
      <line x1="20" y1="8" x2="8" y2="20" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
      <line x1="44" y1="8" x2="56" y2="20" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
      <line x1="8" y1="44" x2="20" y2="56" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
      <line x1="56" y1="44" x2="44" y2="56" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
      
      {/* Central accent - brutalist block */}
      <rect x="24" y="24" width="16" height="16" fill="#ff2d92" stroke="#000000" strokeWidth="2" />
      
      {/* Corner accent dots - intentionally brutalist */}
      <circle cx="12" cy="12" r="2.5" fill="#ff2d92" />
      <circle cx="52" cy="12" r="2.5" fill="#ff2d92" />
      <circle cx="12" cy="52" r="2.5" fill="#ff2d92" />
      <circle cx="52" cy="52" r="2.5" fill="#ff2d92" />
    </svg>
  );
}
