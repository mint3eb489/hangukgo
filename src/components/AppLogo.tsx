import React, { useState } from 'react';

interface AppLogoProps {
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-10 h-10' }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`${className} rounded-xl bg-[#232323] dark:bg-[#282828] border border-border-card flex items-center justify-center shadow-sm shrink-0 overflow-hidden relative group`}
      title="한국GO"
    >
      {!imgError ? (
        <img
          src="/apple-touch-icon.png"
          alt="한국GO Logo"
          className="w-full h-full object-cover rounded-xl"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg
          viewBox="0 0 36 36"
          className="w-full h-full p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="skyGradFallback" x1="18" y1="0" x2="18" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1C2833" />
              <stop offset="1" stopColor="#0E161C" />
            </linearGradient>
            <linearGradient id="mGrad1Fallback" x1="18" y1="16" x2="18" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#5E856E" />
              <stop offset="1" stopColor="#324A3D" />
            </linearGradient>
            <linearGradient id="mGrad2Fallback" x1="18" y1="20" x2="18" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B5978" />
              <stop offset="1" stopColor="#223547" />
            </linearGradient>
          </defs>

          {/* Joseon Imperial Sky Canvas */}
          <rect width="36" height="36" rx="8" fill="url(#skyGradFallback)" />

          {/* Silvery-White Moon (Left / Wol - 월) */}
          <circle cx="8.5" cy="9.5" r="3.2" fill="#F4EFEB" stroke="#D5D0C7" strokeWidth="0.6" />

          {/* Crimson Red Sun (Right / Il - 일) */}
          <circle cx="27.5" cy="9.5" r="3.4" fill="#C85A53" stroke="#E5A962" strokeWidth="0.8" />
          <circle cx="27.5" cy="9.5" r="4.8" stroke="#D49B54" strokeWidth="0.5" strokeDasharray="1.5 1.5" opacity="0.6" />

          {/* Background Mountains (The 5 Peaks / 일월오봉도) */}
          <polygon points="2,34 9,18 16,34" fill="url(#mGrad1Fallback)" opacity="0.9" />
          <polygon points="20,34 27,18 34,34" fill="url(#mGrad1Fallback)" opacity="0.9" />
          <polygon points="10,34 18,14 26,34" fill="url(#mGrad1Fallback)" />

          {/* Foreground Mountain Ridges */}
          <polygon points="6,34 14,21 22,34" fill="url(#mGrad2Fallback)" />
          <polygon points="14,34 22,21 30,34" fill="url(#mGrad2Fallback)" />

          {/* Stylized Joseon Mountain Ridge Lines */}
          <path d="M18 14L18 34" stroke="#D49B54" strokeWidth="0.6" strokeDasharray="1 1" opacity="0.7" />
          <path d="M9 18L9 34" stroke="#D49B54" strokeWidth="0.5" opacity="0.6" />
          <path d="M27 18L27 34" stroke="#D49B54" strokeWidth="0.5" opacity="0.6" />

          {/* Imperial Gold Frame Border */}
          <rect
            x="1"
            y="1"
            width="34"
            height="34"
            rx="7"
            stroke="#D49B54"
            strokeWidth="0.8"
            strokeDasharray="4 2"
            opacity="0.65"
          />
        </svg>
      )}
    </div>
  );
};
