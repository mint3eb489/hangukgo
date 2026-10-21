import React, { useState } from 'react';

interface AppLogoProps {
  className?: string;
}

// Order of favicon candidates from public/
const FAVICON_CANDIDATES = [
  '/favicon.svg',
  '/favicon-96x96.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-10 h-10' }) => {
  const [srcIndex, setSrcIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (srcIndex < FAVICON_CANDIDATES.length - 1) {
      setSrcIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const currentSrc = FAVICON_CANDIDATES[srcIndex];

  return (
    <div
      className={`${className} flex items-center justify-center shrink-0 overflow-hidden relative select-none`}
      title="한국GO"
    >
      {!hasError ? (
        <img
          src={currentSrc}
          alt="한국GO Logo"
          className="w-full h-full object-contain rounded-xl"
          onError={handleError}
        />
      ) : (
        <div className="w-full h-full rounded-xl bg-surface border border-border-card flex items-center justify-center font-bold text-xs text-ink">
          GO
        </div>
      )}
    </div>
  );
};
