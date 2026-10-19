import React from 'react';

interface HangukGoWordmarkProps {
  className?: string;
}

/**
 * Refined „한국GO“ Brand Wordmark:
 * - „한국“ in slender, sweeping Korean brush calligraphy (Nanum Brush Script + fine tapered
 *   Seoye vector flourishes & delicate micro ink mist) in deep Sumi black.
 * - „GO“ nestled tightly right against „한국“ in bold, italic Sans-Serif in Dojang crimson red.
 * - Identical across both German and Korean UI languages.
 */
export const HangukGoWordmark: React.FC<HangukGoWordmarkProps> = ({ className = '' }) => {
  return (
    <span
      className={`inline-flex items-baseline select-none relative px-1 ${className}`}
      aria-label="한국GO"
      title="한국GO"
    >
      {/* Part 1: „한국“ in slender, sweeping Seoye brush script with delicate vector flourishes */}
      <span className="relative inline-flex items-baseline">
        <span
          className="text-[#141311] dark:text-[#F7F4EF] text-[28px] md:text-[31px] leading-none tracking-[-0.04em] inline-block -rotate-2 origin-bottom-left"
          style={{
            fontFamily: "'Nanum Brush Script', cursive",
            fontWeight: 400,
          }}
        >
          한국
        </span>

        {/* Ultra-fine sweeping brush hairlines & microscopic ink mist */}
        <svg
          viewBox="0 0 68 32"
          className="absolute -inset-x-1 -bottom-1 w-[calc(100%+12px)] h-8 pointer-events-none overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Delicate tapered S-curve brush tail sweeping from 한국 under GO */}
          <path
            d="M6 27.8C19 25.2 37 29.4 58 24.6"
            className="stroke-[#141311] dark:stroke-[#F7F4EF]"
            strokeWidth="0.85"
            strokeLinecap="round"
            opacity="0.65"
          />
          {/* Secondary whisper-thin dry bristle line */}
          <path
            d="M14 29.1C28 27.3 43 29.8 62 25.4"
            className="stroke-[#141311] dark:stroke-[#F7F4EF]"
            strokeWidth="0.4"
            strokeLinecap="round"
            strokeDasharray="16 2 5 1.5 2 2"
            opacity="0.45"
          />

          {/* Fine pinpoint ink mist (0.35px - 0.65px) */}
          <g className="fill-[#141311] dark:fill-[#F7F4EF]" opacity="0.7">
            <circle cx="3.2" cy="8.5" r="0.55" />
            <circle cx="1.8" cy="10.2" r="0.35" />
            <circle cx="24.5" cy="5.8" r="0.45" />
            <circle cx="48.2" cy="26.8" r="0.5" />
            <circle cx="51.4" cy="25.9" r="0.35" />
            <circle cx="59.8" cy="24.1" r="0.45" />
            <circle cx="62.1" cy="23.4" r="0.3" />
          </g>
        </svg>
      </span>

      {/* Part 2: „GO“ with circular swirling Taegeuk colors (Yang Red ⇄ Eum Blue) */}
      <span
        className="ml-0.5 pr-0.5 text-[20px] md:text-[22px] font-black italic tracking-[-0.05em] leading-none text-transparent bg-clip-text relative inline-block"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          backgroundImage:
            'conic-gradient(from 205deg at 50% 52%, #CD2E3A 0deg, #E04852 115deg, #255C99 185deg, #0F4C81 295deg, #CD2E3A 360deg)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        GO
      </span>
    </span>
  );
};
