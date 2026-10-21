import React, { useState } from 'react';

interface AppLogoProps {
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-10 h-10' }) => {
  const [imgSrc, setImgSrc] = useState('/favicon.svg');

  return (
    <div
      className={`${className} flex items-center justify-center shrink-0 overflow-hidden relative select-none`}
      title="한국GO"
    >
      <img
        src={imgSrc}
        alt="한국GO Logo"
        className="w-full h-full object-contain rounded-xl"
        onError={() => {
          if (imgSrc === '/favicon.svg') {
            setImgSrc('/apple-touch-icon.png');
          } else if (imgSrc === '/apple-touch-icon.png') {
            setImgSrc('/favicon-96x96.png');
          }
        }}
      />
    </div>
  );
};
