import React, { useState } from 'react';

interface AppLogoProps {
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-10 h-10' }) => {
  const base = (import.meta.env.BASE_URL || './').replace(/\/+$/, '') + '/';
  const candidates = [
    `${base}favicon.svg`,
    `${base}apple-touch-icon.png`,
    `${base}favicon-96x96.png`,
    '/favicon.svg',
    '/apple-touch-icon.png',
  ];
  const [candidateIndex, setCandidateIndex] = useState(0);

  return (
    <div
      className={`${className} flex items-center justify-center shrink-0 overflow-hidden relative select-none`}
      title="한국GO"
    >
      <img
        src={candidates[candidateIndex] || `${base}favicon.svg`}
        alt="한국GO Logo"
        className="w-full h-full object-contain rounded-xl"
        onError={() => {
          if (candidateIndex < candidates.length - 1) {
            setCandidateIndex((prev) => prev + 1);
          }
        }}
      />
    </div>
  );
};
