import React from 'react';

interface SojuBottleIconProps {
  className?: string;
  idPrefix?: string;
}

export const SojuBottleIcon: React.FC<SojuBottleIconProps> = ({
  className = 'w-6 h-6',
  idPrefix = 'soju',
}) => {
  const glassGradId = `${idPrefix}-glass-grad`;
  const glassHighlightId = `${idPrefix}-highlight-grad`;
  const capGradId = `${idPrefix}-cap-grad`;
  const labelGradId = `${idPrefix}-label-grad`;

  return (
    <svg
      viewBox="0 0 28 28"
      className={`${className} drop-shadow-2xs overflow-visible`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Iconic Emerald Green Soju Glass Gradient */}
        <linearGradient id={glassGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#15803D" />
          <stop offset="25%" stopColor="#22C55E" />
          <stop offset="55%" stopColor="#16A34A" />
          <stop offset="85%" stopColor="#15803D" />
          <stop offset="100%" stopColor="#0F5B2D" />
        </linearGradient>

        {/* Specular Glass Sheen */}
        <linearGradient id={glassHighlightId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
        </linearGradient>

        {/* Green Metallic Cap */}
        <linearGradient id={capGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#14532D" />
          <stop offset="40%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#052E16" />
        </linearGradient>

        {/* Off-White Paper Label Gradient */}
        <linearGradient id={labelGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1F5F9" />
        </linearGradient>
      </defs>

      {/* Soju Bottle Silhouette: Cap, Neck, Shoulders, Cylindrical Body & Base */}
      {/* 1. Bottle Body & Neck Base Path */}
      <path
        d="M 12.3,4.6 
           L 15.7,4.6 
           L 15.7,9.2 
           C 15.7,10.2 16.5,11.2 17.5,12.2 
           C 18.3,13 18.7,13.8 18.7,14.8 
           L 18.7,24.2 
           C 18.7,25.2 18,25.8 17,25.8 
           L 11,25.8 
           C 10,25.8 9.3,25.2 9.3,24.2 
           L 9.3,14.8 
           C 9.3,13.8 9.7,13 10.5,12.2 
           C 11.5,11.2 12.3,10.2 12.3,9.2 
           Z"
        fill={`url(#${glassGradId})`}
        stroke="#0F5B2D"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />

      {/* 2. Glass Bottle Bottom Rim Base */}
      <path
        d="M 10.1,24.5 C 10.1,25.2 11.5,25.4 14,25.4 C 16.5,25.4 17.9,25.2 17.9,24.5"
        stroke="#052E16"
        strokeWidth="0.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* 3. Authentic Soju Paper Label */}
      <rect
        x="10"
        y="14.6"
        width="8"
        height="8.4"
        rx="0.6"
        fill={`url(#${labelGradId})`}
        stroke="#CBD5E1"
        strokeWidth="0.3"
      />

      {/* Label Details: Green Leaf/Dew Accent (like Chamisul/Chum-Churum) */}
      <circle cx="14" cy="16.2" r="0.9" fill="#22C55E" />
      <path
        d="M 14,15.5 C 14.5,15.2 14.9,15.7 14.7,16.2"
        stroke="#15803D"
        strokeWidth="0.3"
        strokeLinecap="round"
      />

      {/* Korean Hangul Text: "소주" */}
      <text
        x="14"
        y="19.3"
        textAnchor="middle"
        fontSize="2.9"
        fontWeight="900"
        fontFamily="sans-serif"
        fill="#0F172A"
        letterSpacing="-0.2"
      >
        소주
      </text>

      {/* Subtext: "SOJU 16.9°" hint */}
      <text
        x="14"
        y="21.6"
        textAnchor="middle"
        fontSize="1.15"
        fontWeight="800"
        fontFamily="sans-serif"
        fill="#16A34A"
        letterSpacing="0.2"
      >
        CHAM • 16.9°
      </text>

      {/* Subtle bottom label border band */}
      <line
        x1="10.4"
        y1="22.2"
        x2="17.6"
        y2="22.2"
        stroke="#22C55E"
        strokeWidth="0.35"
      />

      {/* 4. Left Glass Specular Light Reflection Streak */}
      <path
        d="M 12.8,5.4 L 13.3,5.4 L 13.3,8.8 L 11.2,11.8 C 10.5,12.7 10.1,13.6 10.1,14.6 L 10.1,24.2 C 10.1,24.6 10.3,24.8 10.7,24.8 L 10.4,25.2 C 9.7,25 9.6,24.4 9.6,23.8 L 9.6,14.7 C 9.6,13.6 10,12.7 10.8,11.7 L 12.8,8.8 Z"
        fill={`url(#${glassHighlightId})`}
      />

      {/* 5. Green Screw Cap with Ribs */}
      <rect
        x="12"
        y="2"
        width="4"
        height="2.8"
        rx="0.5"
        fill={`url(#${capGradId})`}
        stroke="#052E16"
        strokeWidth="0.5"
      />
      {/* Cap Grip Ribs */}
      <line x1="13.1" y1="2.2" x2="13.1" y2="4.4" stroke="#86EFAC" strokeWidth="0.3" opacity="0.8" />
      <line x1="14.0" y1="2.2" x2="14.0" y2="4.4" stroke="#86EFAC" strokeWidth="0.3" opacity="0.8" />
      <line x1="14.9" y1="2.2" x2="14.9" y2="4.4" stroke="#86EFAC" strokeWidth="0.3" opacity="0.8" />

      {/* Cap Safety Seal Ring Collar */}
      <rect
        x="12.2"
        y="4.5"
        width="3.6"
        height="0.7"
        rx="0.3"
        fill="#14532D"
        stroke="#052E16"
        strokeWidth="0.3"
      />
    </svg>
  );
};
