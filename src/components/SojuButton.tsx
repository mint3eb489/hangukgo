import React from 'react';
import { SojuBottleIcon } from './SojuBottleIcon';
import { AppLanguage } from '../utils/translations';

interface SojuButtonProps {
  isSpinning?: boolean;
  lang?: AppLanguage;
  onClick: () => void;
}

export const SojuButton: React.FC<SojuButtonProps> = ({
  isSpinning = false,
  lang = 'de',
  onClick,
}) => {
  const isKr = lang === 'kr';
  const titleText = isKr
    ? '소주 룰렛 (게임 모드, 카테고리 & 하위 카테고리 랜덤 추첨)'
    : '소주 룰렛 (Zufallsgenerator für Spielmodus, Kategorie & Unterkategorie)';

  const ariaText = isKr ? '소주 랜덤 룰렛 실행' : 'Soju Zufallsgenerator starten';

  return (
    <button
      onClick={onClick}
      type="button"
      title={titleText}
      aria-label={ariaText}
      className={`relative w-9 h-9 rounded-xl border transition-all duration-300 flex items-center justify-center group shadow-2xs ${
        isSpinning
          ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30 animate-pulse'
          : 'bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border-border-card text-ink'
      }`}
    >
      {/* Authentic Green Korean Soju Bottle Icon */}
      <div className={`transition-transform duration-300 ${isSpinning ? 'rotate-180 scale-110' : 'group-hover:scale-110'}`}>
        <SojuBottleIcon className="w-6 h-6" idPrefix="header-soju-btn" />
      </div>

      {/* Mini Active Emerald Pulse Dot when spinning/active */}
      {isSpinning && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
      )}
    </button>
  );
};
