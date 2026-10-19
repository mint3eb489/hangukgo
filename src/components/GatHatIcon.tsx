import React from 'react';

interface GatHatIconProps {
  className?: string;
}

/**
 * Traditional Korean Joseon Dynasty Scholar Hat (갓 / Gat - Heungnip 흑립)
 * Features the tall cylindrical horsehair crown (총모자), wide curved brim (양태),
 * bamboo/silk band, and hanging beaded chin strap (갓끈).
 */
export const GatHatIcon: React.FC<GatHatIconProps> = ({ className = 'w-5 h-5' }) => {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Subtle woven crown fill (translucent black horsehair mesh effect) */}
      <path
        d="M10.2 4.8C10.2 4.1 11.9 3.6 14 3.6C16.1 3.6 17.8 4.1 17.8 4.8L18.7 13.5H9.3L10.2 4.8Z"
        fill="currentColor"
        fillOpacity="0.22"
      />

      {/* Wide Brim (양태 / Yangtae) subtle fill */}
      <ellipse
        cx="14"
        cy="13.8"
        rx="12"
        ry="3.1"
        fill="currentColor"
        fillOpacity="0.18"
      />

      {/* Tall Cylindrical Crown (총모자 / Chongmoja) */}
      <path
        d="M10.2 4.8C10.2 4.1 11.9 3.6 14 3.6C16.1 3.6 17.8 4.1 17.8 4.8L18.7 13.5H9.3L10.2 4.8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Crown Top Rim Curve */}
      <path
        d="M10.3 5.1C11.4 5.7 16.6 5.7 17.7 5.1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Fine Horsehair Mesh Detail Line on Crown */}
      <path
        d="M9.7 9.4C12.2 10.1 15.8 10.1 18.3 9.4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Base Ribbon Band around Crown (대우 / Hatband) */}
      <path
        d="M9.3 12.8C11.8 13.6 16.2 13.6 18.7 12.8"
        stroke="#C85A53"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Wide Joseon Brim Outline (양태) */}
      <ellipse
        cx="14"
        cy="13.8"
        rx="12"
        ry="3.1"
        stroke="currentColor"
        strokeWidth="1.75"
      />

      {/* Hanging Beaded Chin Strap (갓끈 / Gatkkeun) */}
      <path
        d="M9.5 16.5C9.8 20.6 11.6 23.6 14 23.6C16.4 23.6 18.2 20.6 18.5 16.5"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeDasharray="1.8 1.8"
      />

      {/* Traditional Amber/Coral Center Bead on Chin Strap */}
      <circle cx="14" cy="23.6" r="1.45" fill="#D49B54" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
};
