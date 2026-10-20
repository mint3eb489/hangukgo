import React from 'react';

interface RetroTvIconProps {
  className?: string;
  idPrefix?: string;
}

export const RetroTvIcon: React.FC<RetroTvIconProps> = ({
  className = 'w-6 h-6',
  idPrefix = 'retro-tv',
}) => {
  const bodyGradId = `${idPrefix}-body-grad`;
  const screenGradId = `${idPrefix}-screen-grad`;
  const bezelGradId = `${idPrefix}-bezel-grad`;

  return (
    <svg
      viewBox="0 0 28 28"
      className={`${className} drop-shadow-2xs overflow-visible`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Warm Vintage TV Wood/Bakelite Cabinet Gradient */}
        <linearGradient id={bodyGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="55%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Retro CRT Glowing Screen Gradient */}
        <linearGradient id={screenGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>

        {/* Inner Cream Bezel */}
        <linearGradient id={bezelGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>
      </defs>

      {/* Two Classic Rabbit-Ear Antennas on Top */}
      <line
        x1="13.5"
        y1="8.2"
        x2="7.2"
        y2="2.4"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <line
        x1="14.5"
        y1="8.2"
        x2="21.2"
        y2="2.2"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      {/* Antenna Metallic Ball Tips */}
      <circle cx="7.0" cy="2.2" r="1.15" fill="#94A3B8" stroke="#475569" strokeWidth="0.4" />
      <circle cx="21.4" cy="2.0" r="1.15" fill="#94A3B8" stroke="#475569" strokeWidth="0.4" />

      {/* Half-Round Antenna Base Dome */}
      <path
        d="M 11.2,8.5 C 11.2,6.8 16.8,6.8 16.8,8.5 Z"
        fill="#475569"
        stroke="#334155"
        strokeWidth="0.5"
      />

      {/* Splayed Vintage TV Feet */}
      <line
        x1="7.2"
        y1="23.2"
        x2="5.6"
        y2="25.8"
        stroke="#78350F"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="20.8"
        y1="23.2"
        x2="22.4"
        y2="25.8"
        stroke="#78350F"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Main Retro TV Cabinet Box */}
      <rect
        x="3.2"
        y="8.2"
        width="21.6"
        height="15.4"
        rx="2.8"
        fill={`url(#${bodyGradId})`}
        stroke="#451A03"
        strokeWidth="0.7"
      />

      {/* Inner Bezel Around CRT Screen */}
      <rect
        x="4.8"
        y="9.8"
        width="13.8"
        height="12.2"
        rx="2.0"
        fill={`url(#${bezelGradId})`}
        stroke="#78350F"
        strokeWidth="0.45"
      />

      {/* Curved CRT Glass Tube Screen */}
      <rect
        x="5.6"
        y="10.6"
        width="12.2"
        height="10.6"
        rx="1.6"
        fill={`url(#${screenGradId})`}
        stroke="#1E293B"
        strokeWidth="0.55"
      />

      {/* Screen Glass Reflection Curve */}
      <path
        d="M 6.5,11.6 C 8.5,11.3 11.2,11.3 13.2,11.6 L 8.2,17.2 C 7.0,15.6 6.5,13.6 6.5,11.6 Z"
        fill="#FFFFFF"
        opacity="0.22"
      />

      {/* Small K-Drama Heart / Play Sparkle on Screen */}
      <path
        d="M 11.7,14.3 C 11.1,13.4 9.7,13.5 9.7,14.7 C 9.7,15.9 11.7,17.0 11.7,17.6 C 11.7,17.0 13.7,15.9 13.7,14.7 C 13.7,13.5 12.3,13.4 11.7,14.3 Z"
        fill="#FDA4AF"
        opacity="0.92"
      />

      {/* Right Control Panel: 2 Classic Rotary Dials (UHF / VHF) */}
      <circle
        cx="21.3"
        cy="12.2"
        r="1.55"
        fill="#FDE68A"
        stroke="#451A03"
        strokeWidth="0.5"
      />
      <line
        x1="21.3"
        y1="11.0"
        x2="21.3"
        y2="12.2"
        stroke="#451A03"
        strokeWidth="0.55"
        strokeLinecap="round"
      />

      <circle
        cx="21.3"
        cy="16.1"
        r="1.55"
        fill="#FDE68A"
        stroke="#451A03"
        strokeWidth="0.5"
      />
      <line
        x1="20.4"
        y1="16.1"
        x2="21.3"
        y2="16.1"
        stroke="#451A03"
        strokeWidth="0.55"
        strokeLinecap="round"
      />

      {/* Speaker Grill Slots Below Dials */}
      <line x1="19.8" y1="19.2" x2="22.8" y2="19.2" stroke="#451A03" strokeWidth="0.6" strokeLinecap="round" />
      <line x1="19.8" y1="20.4" x2="22.8" y2="20.4" stroke="#451A03" strokeWidth="0.6" strokeLinecap="round" />
      <line x1="19.8" y1="21.6" x2="22.8" y2="21.6" stroke="#451A03" strokeWidth="0.6" strokeLinecap="round" />
    </svg>
  );
};
