import React from 'react';

interface BunnyEarsIconProps {
  className?: string;
  idPrefix?: string;
}

export const BunnyEarsIcon: React.FC<BunnyEarsIconProps> = ({
  className = 'w-6 h-6',
  idPrefix = 'bunny-ears',
}) => {
  const earOuterGradId = `${idPrefix}-outer-grad`;
  const earInnerGradId = `${idPrefix}-inner-grad`;
  const flopGradId = `${idPrefix}-flop-grad`;

  return (
    <svg
      viewBox="0 0 28 28"
      className={`${className} drop-shadow-2xs overflow-visible`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Warm Ivory/White Bunny Ear Outer Gradient */}
        <linearGradient id={earOuterGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        {/* Soft Rose Pink Inner Ear Gradient */}
        <linearGradient id={earInnerGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDA4AF" />
          <stop offset="100%" stopColor="#F43F5E" />
        </linearGradient>

        {/* Slightly Shaded Folded Ear Tip Gradient */}
        <linearGradient id={flopGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>

      {/* LEFT EAR: Upright Classic Bunny Ear */}
      <path
        d="M 6.8,24.5
           C 5.4,19.5 5.0,11.5 6.4,5.4
           C 7.0,2.8 10.2,2.8 10.8,5.4
           C 12.0,11.5 11.6,19.5 10.4,24.5
           Z"
        fill={`url(#${earOuterGradId})`}
        stroke="#475569"
        strokeWidth="1.0"
        strokeLinejoin="round"
      />
      {/* Left Inner Pink Ear */}
      <path
        d="M 7.7,22.8
           C 6.9,18.6 6.7,12.2 7.6,7.0
           C 7.9,5.5 9.3,5.5 9.6,7.0
           C 10.4,12.2 10.2,18.6 9.5,22.8
           Z"
        fill={`url(#${earInnerGradId})`}
        opacity="0.88"
      />

      {/* RIGHT EAR (Lower Base): Rises Up Before Bending */}
      <path
        d="M 15.2,24.5
           C 14.5,20.0 14.6,13.8 15.8,8.8
           C 16.3,7.0 19.2,7.2 19.6,9.2
           C 20.1,13.8 19.7,20.0 18.8,24.5
           Z"
        fill={`url(#${earOuterGradId})`}
        stroke="#475569"
        strokeWidth="1.0"
        strokeLinejoin="round"
      />
      {/* Right Ear Inner Pink (Lower Visible Portion) */}
      <path
        d="M 16.2,22.8
           C 15.7,19.2 15.8,14.5 16.6,10.6
           L 18.4,11.0
           C 18.8,14.7 18.5,19.2 17.9,22.8
           Z"
        fill={`url(#${earInnerGradId})`}
        opacity="0.85"
      />

      {/* RIGHT EAR (Folded / Bent Top Tip - Leicht abgeknickt nach rechts) */}
      <path
        d="M 15.6,9.2
           C 16.2,6.8 18.8,6.6 20.4,7.6
           C 22.8,9.1 25.0,12.4 25.4,14.6
           C 25.7,16.4 23.6,17.4 22.0,15.8
           C 20.4,14.2 18.8,12.0 16.2,10.6
           Z"
        fill={`url(#${flopGradId})`}
        stroke="#475569"
        strokeWidth="1.0"
        strokeLinejoin="round"
      />
      {/* Subtle Inner Pink Peek on the Bent Tip */}
      <path
        d="M 18.4,9.6
           C 20.4,10.6 22.6,12.8 23.4,14.5
           C 23.6,15.0 22.8,15.4 22.1,14.7
           C 20.9,13.5 19.5,11.9 17.7,10.7
           Z"
        fill={`url(#${earInnerGradId})`}
        opacity="0.7"
      />

      {/* Soft Base Tuft Line Connecting the Two Ears */}
      <path
        d="M 5.4,24.5 Q 12.8,23.6 20.2,24.5"
        stroke="#475569"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
};
