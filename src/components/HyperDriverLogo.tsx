import React from 'react';

export const HyperDriverLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ className = '', size = 'md' }) => {
  const dimensions = {
    sm: { height: 32, width: 110 },
    md: { height: 50, width: 170 },
    lg: { height: 80, width: 270 },
    xl: { height: 140, width: 480 },
  }[size];

  return (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 600 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} select-none`}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="carSpeedLines" x1="0" y1="50" x2="350" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#007BFF" stopOpacity="0" />
          <stop offset="50%" stopColor="#00E5FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hyperTextGrad" x1="100" y1="80" x2="500" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#F1F5F9" />
          <stop offset="50%" stopColor="#E2E8F0" />
          <stop offset="60%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="driverTextGrad" x1="130" y1="120" x2="470" y2="170" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Speed lines trailing on the left */}
      <path d="M 60 70 L 220 70" stroke="#007BFF" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
      <path d="M 100 64 L 250 64" stroke="#00E5FF" strokeWidth="4" opacity="0.8" strokeLinecap="round" />
      <path d="M 120 76 L 200 76" stroke="#0056b3" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
      
      {/* Sleek Sports Car Contour */}
      {/* Roof & Back curve */}
      <path 
        d="M 230 72 C 270 55, 340 45, 430 55 C 470 60, 490 68, 510 74 C 500 72, 450 60, 410 58 C 360 56, 290 64, 250 72 Z" 
        fill="#FFFFFF" 
      />
      
      {/* Windshield & Hood curve */}
      <path 
        d="M 320 52 C 370 50, 400 52, 440 62 L 480 68 C 450 63, 400 58, 320 52 Z" 
        fill="#94A3B8" 
        opacity="0.8"
      />

      {/* Car Side Body & Wheel Arch outline */}
      <path 
        d="M 230 72 C 265 72, 275 66, 290 68 C 305 70, 315 76, 320 80 C 330 74, 345 66, 385 68 C 420 70, 435 84, 450 84 C 470 82, 492 78, 510 74" 
        stroke="#E2E8F0" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="none" 
      />

      {/* Stylized Electric Headlight */}
      <path 
        d="M 465 74 C 480 77, 495 80, 502 81 C 495 83, 480 84, 465 82 Z" 
        fill="#00E5FF" 
        filter="url(#neonGlow)"
      />

      {/* Horizon Separator line with blue glow */}
      <line x1="100" y1="88" x2="520" y2="88" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
      <line x1="140" y1="88" x2="480" y2="88" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" filter="url(#neonGlow)" />

      {/* Text "HYPER" slanted */}
      <text
        x="300"
        y="126"
        fill="url(#hyperTextGrad)"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Impact', 'Arial Black', sans-serif"
        fontSize="48"
        fontWeight="900"
        fontStyle="italic"
        letterSpacing="8"
        textAnchor="middle"
        style={{ transform: 'skewX(-10deg)', transformOrigin: '300px 126px' }}
      >
        BOLT
      </text>

      {/* Text "DRIVER" slanted electric blue */}
      <text
        x="300"
        y="164"
        fill="url(#driverTextGrad)"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Impact', 'Arial Black', sans-serif"
        fontSize="34"
        fontWeight="900"
        fontStyle="italic"
        letterSpacing="12"
        textAnchor="middle"
        filter="url(#neonGlow)"
        style={{ transform: 'skewX(-10deg)', transformOrigin: '300px 164px' }}
      >
        DRIVER
      </text>
    </svg>
  );
};
