// Modern VeriFi Protocol Logo - Completely New Design

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo = ({ size = 36, className = "" }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="VeriFi Protocol Logo"
    className={`transition-transform hover:scale-105 ${className}`}
  >
    <title>VeriFi Protocol</title>
    
    <defs>
      {/* Modern gradient */}
      <linearGradient id="vGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#00D4AA', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#00B894', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#0099FF', stopOpacity: 1 }} />
      </linearGradient>
      
      <linearGradient id="vGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#00D4AA', stopOpacity: 0.2 }} />
        <stop offset="100%" style={{ stopColor: '#0099FF', stopOpacity: 0.2 }} />
      </linearGradient>

      {/* Glow effect */}
      <filter id="vGlow">
        <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    {/* Background circle with subtle gradient */}
    <circle 
      cx="100" 
      cy="100" 
      r="85" 
      fill="url(#vGradLight)"
      opacity="0.4"
    />
    
    {/* Outer ring - represents blockchain/oracle network */}
    <circle 
      cx="100" 
      cy="100" 
      r="75" 
      stroke="url(#vGrad)" 
      strokeWidth="3"
      fill="none"
      opacity="0.6"
      strokeDasharray="8 4"
    />
    
    {/* Letter "V" - stylized and modern */}
    <path
      d="M 60 60 L 100 140 L 140 60"
      stroke="url(#vGrad)"
      strokeWidth="16"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      filter="url(#vGlow)"
    />
    
    {/* Checkmark integrated into the V */}
    <path
      d="M 85 105 L 95 115 L 120 80"
      stroke="url(#vGrad)"
      strokeWidth="10"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity="0.9"
    />
    
    {/* Oracle nodes - three points representing distributed verification */}
    <circle cx="100" cy="40" r="6" fill="url(#vGrad)" opacity="0.8"/>
    <circle cx="145" cy="120" r="6" fill="url(#vGrad)" opacity="0.8"/>
    <circle cx="55" cy="120" r="6" fill="url(#vGrad)" opacity="0.8"/>
    
    {/* Connection lines between nodes - subtle */}
    <line x1="100" y1="40" x2="100" y2="60" stroke="url(#vGrad)" strokeWidth="1.5" opacity="0.3"/>
    <line x1="145" y1="120" x2="135" y2="105" stroke="url(#vGrad)" strokeWidth="1.5" opacity="0.3"/>
    <line x1="55" y1="120" x2="65" y2="105" stroke="url(#vGrad)" strokeWidth="1.5" opacity="0.3"/>
    
    {/* Small accent marks for tech feel */}
    <path d="M 165 95 L 175 95 M 170 90 L 170 100" stroke="url(#vGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    <path d="M 25 95 L 35 95 M 30 90 L 30 100" stroke="url(#vGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

// Simplified version for favicon
export const LogoSimple = ({ size = 24, className = "" }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <title>VeriFi Protocol</title>
    <defs>
      <linearGradient id="sGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#00D4AA' }} />
        <stop offset="100%" style={{ stopColor: '#0099FF' }} />
      </linearGradient>
    </defs>
    
    {/* Simple V with checkmark */}
    <path
      d="M 60 60 L 100 140 L 140 60"
      stroke="url(#sGrad)"
      strokeWidth="18"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M 85 105 L 95 115 L 120 80"
      stroke="url(#sGrad)"
      strokeWidth="12"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export const LogoHeader = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="VeriFi Protocol Logo"
    className="transition-transform hover:scale-105"
  >
    <title>VeriFi Protocol</title>
    <path
      d="M20 55 L40 75 L80 25"
      stroke="hsl(var(--primary))"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M25 85 L75 85"
      stroke="hsl(var(--primary))"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
);
