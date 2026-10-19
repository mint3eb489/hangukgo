import React from 'react';
import { AppLanguage } from '../utils/translations';

interface LanguageToggleButtonProps {
  language: AppLanguage;
  onToggle: () => void;
}

export const LanguageToggleButton: React.FC<LanguageToggleButtonProps> = ({
  language,
  onToggle,
}) => {
  const isKr = language === 'kr';

  return (
    <button
      onClick={onToggle}
      type="button"
      title={
        isKr
          ? '독일어로 전환 (Auf Deutsch wechseln)'
          : 'Sprache auf Koreanisch wechseln (한국어로 전환)'
      }
      aria-label="Sprache zwischen Deutsch und Koreanisch umschalten"
      className={`relative w-9 h-9 rounded-xl border transition-all duration-300 flex items-center justify-center group shadow-2xs select-none ${
        isKr
          ? 'bg-celadon/15 border-celadon ring-2 ring-celadon/30 text-ink'
          : 'bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border-border-card text-ink'
      }`}
    >
      {/* Simple, crisp display: either DE or 한 */}
      {isKr ? (
        <span className="font-kr font-bold text-sm tracking-tight text-celadon dark:text-emerald-400 group-hover:scale-110 transition-transform">
          한
        </span>
      ) : (
        <span className="font-extrabold text-xs tracking-wider text-ink/90 group-hover:scale-110 transition-transform">
          DE
        </span>
      )}

      {/* Subtle indicator dot when Korean is active */}
      {isKr && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-celadon opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-celadon"></span>
        </span>
      )}
    </button>
  );
};
