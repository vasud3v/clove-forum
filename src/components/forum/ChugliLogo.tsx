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
      <defs>
        <linearGradient id="c-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ff2d92', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#ff6ba6', stopOpacity: 1 }} />
        </linearGradient>
        
        <filter id="c-glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main C shape - clean and bold */}
      <path
        d="M 46 12 A 22 22 0 0 0 18 32 A 22 22 0 0 0 46 52"
        fill="none"
        stroke="url(#c-gradient)"
        strokeWidth="5"
        strokeLinecap="round"
        filter="url(#c-glow)"
      />

      {/* Inner accent line for depth */}
      <path
        d="M 42 18 A 18 18 0 0 0 22 32 A 18 18 0 0 0 42 46"
        fill="none"
        stroke="url(#c-gradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Small accent dots */}
      <circle cx="48" cy="12" r="2" fill="url(#c-gradient)" opacity="0.6" />
      <circle cx="48" cy="52" r="2" fill="url(#c-gradient)" opacity="0.6" />
    </svg>
  );
}
