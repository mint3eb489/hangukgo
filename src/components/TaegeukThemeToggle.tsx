import React from 'react';

import { AppLanguage } from '../utils/translations';

interface TaegeukThemeToggleProps {
  theme: 'light' | 'dark';
  lang?: AppLanguage;
  onToggle: () => void;
}

export const TaegeukThemeToggle: React.FC<TaegeukThemeToggleProps> = ({
  theme,
  lang = 'de',
  onToggle,
}) => {
  const isDark = theme === 'dark';
  const isKr = lang === 'kr';

  const titleText = isKr
    ? isDark
      ? '태극 (Taegeuk): 양(陽) - 라이트 모드로 전환'
      : '태극 (Taegeuk): 음(陰) - 다크 모드로 전환'
    : isDark
      ? '태극 (Taegeuk): Zu Yang (양 / Tag & Hellmodus) wechseln'
      : '태극 (Taegeuk): Zu Eum (음 / Nacht & Dunkelmodus) wechseln';

  const ariaText = isKr
    ? '태극 낮과 밤 테마 전환'
    : 'Taegeuk Tag und Nacht Modus-Umschalter';

  return (
    <button
      onClick={onToggle}
      type="button"
      title={titleText}
      aria-label={ariaText}
      className="w-9 h-9 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card transition-all duration-300 flex items-center justify-center group shadow-2xs"
    >
      <div
        className={`w-5 h-5 transition-transform duration-500 ease-in-out transform ${
          isDark ? 'rotate-180 scale-105' : 'rotate-0 scale-100'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-full h-full drop-shadow-2xs"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle outer circular rim */}
          <circle
            cx="12"
            cy="12"
            r="10.5"
            stroke="currentColor"
            strokeWidth="0.8"
            className="text-stone-300 dark:text-stone-600"
            fill="none"
          />

          {/* RED YANG (양 - Tag / Licht / Wärme) */}
          <path
            d="M 2 12 A 10 10 0 0 1 22 12 A 5 5 0 0 1 12 12 A 5 5 0 0 0 2 12 Z"
            fill="#C85A53"
            stroke="#C85A53"
            strokeWidth="0.4"
          />

          {/* BLUE EUM (음 - Nacht / Schatten / Ruhe) */}
          <path
            d="M 2 12 A 10 10 0 0 0 22 12 A 5 5 0 0 1 12 12 A 5 5 0 0 0 2 12 Z"
            fill="#3B5978"
            stroke="#3B5978"
            strokeWidth="0.4"
          />
        </svg>
      </div>
    </button>
  );
};
