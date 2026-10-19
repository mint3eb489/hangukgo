import React from 'react';

interface RamyeonPacketIconProps {
  className?: string;
  idPrefix?: string;
}

export const RamyeonPacketIcon: React.FC<RamyeonPacketIconProps> = ({
  className = 'w-6 h-6',
  idPrefix = 'shin',
}) => {
  const packetGradId = `${idPrefix}-packet-grad`;
  const goldBadgeId = `${idPrefix}-gold-badge`;

  return (
    <svg
      viewBox="0 0 28 28"
      className={`${className} drop-shadow-2xs overflow-visible`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Shin Ramyun Red Pouch Gradient */}
        <linearGradient id={packetGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EA3829" />
          <stop offset="50%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>

        {/* Golden 4' Badge Gradient */}
        <linearGradient id={goldBadgeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Serrated Zig-zag Heat-Seal Pouch Outline */}
      <path
        d="M 5,4.5 
           L 6,3 L 7.5,4.5 L 9,3 L 10.5,4.5 L 12,3 L 13.5,4.5 L 15,3 L 16.5,4.5 L 18,3 L 19.5,4.5 L 21,3 L 22,4.5 
           L 23,4.5 C 23.8,9.5 23.8,18.5 23,23.5 
           L 22,23.5 L 21,25 L 19.5,23.5 L 18,25 L 16.5,23.5 L 15,25 L 13.5,23.5 L 12,25 L 10.5,23.5 L 9,25 L 7.5,23.5 L 6,25 L 5,23.5
           C 4.2,18.5 4.2,9.5 5,4.5 Z"
        fill={`url(#${packetGradId})`}
        stroke="#7F1D1D"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />

      {/* Top & Bottom Seal Ribbed Emboss Lines */}
      <line
        x1="5.2"
        y1="5.4"
        x2="22.8"
        y2="5.4"
        stroke="#7F1D1D"
        strokeWidth="0.6"
        strokeDasharray="1.2 0.8"
        opacity="0.75"
      />
      <line
        x1="5.2"
        y1="22.6"
        x2="22.8"
        y2="22.6"
        stroke="#7F1D1D"
        strokeWidth="0.6"
        strokeDasharray="1.2 0.8"
        opacity="0.75"
      />

      {/* Foil Gloss Reflection Stripe */}
      <path
        d="M 5.8,5.8 L 10.8,5.8 L 6.6,19.5 L 5.4,17 Z"
        fill="#FFFFFF"
        opacity="0.18"
      />

      {/* Golden '4'' Cooking Time Badge (top-right) */}
      <rect
        x="15.2"
        y="5.8"
        width="6.6"
        height="3.3"
        rx="1"
        fill={`url(#${goldBadgeId})`}
        stroke="#78350F"
        strokeWidth="0.3"
      />
      <text
        x="18.5"
        y="8.3"
        textAnchor="middle"
        fontSize="2.5"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="#451A03"
      >
        4'
      </text>

      {/* Iconic Calligraphy 辛 (Shin - spicy/pungent) with crisp white outline */}
      <text
        x="11.8"
        y="16.4"
        textAnchor="middle"
        fontSize="9.8"
        fontWeight="900"
        fontFamily="'Noto Serif KR', 'Nanum Myeongjo', 'Batang', serif"
        fill="#111827"
        stroke="#FFFFFF"
        strokeWidth="1.3"
        paintOrder="stroke fill"
      >
        辛
      </text>

      {/* Golden-Yellow Hangul '라면' (Ramyeon) at the bottom */}
      <text
        x="14"
        y="21.2"
        textAnchor="middle"
        fontSize="3.1"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.2"
        fill="#FEF08A"
      >
        라면
      </text>

      {/* Mini Chili Pepper Accent in bottom right */}
      <path
        d="M 19.8 17.6 C 20.6 18.2 21 19.2 20 20 C 19.4 20.6 18.7 20.7 18.9 19.7"
        stroke="#FCA5A5"
        strokeWidth="0.9"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};
