import React from 'react';
import { RamyeonPacketIcon } from './RamyeonPacketIcon';
import { AppLanguage } from '../utils/translations';

interface RamyeonButtonProps {
  isRunning: boolean;
  timeLeft: number;
  lang?: AppLanguage;
  onClick: () => void;
}

export const RamyeonButton: React.FC<RamyeonButtonProps> = ({
  isRunning,
  timeLeft,
  lang = 'de',
  onClick,
}) => {
  const isKr = lang === 'kr';
  const formatCompact = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const titleText = isKr
    ? isRunning
      ? `신라면 타이머 실행 중: ${formatCompact(timeLeft)} 남음 (클릭하여 열기)`
      : '신라면 타이머 (4분 라면 타이머)'
    : isRunning
      ? `신라면 타이머 läuft: noch ${formatCompact(timeLeft)} (Klicken für Steuerung)`
      : '신라면 타이머 (4-Minuten Ramyeon Timer)';

  const ariaText = isKr ? '라면 타이머 열기' : 'Ramyeon Timer starten oder ansehen';

  return (
    <button
      onClick={onClick}
      type="button"
      title={titleText}
      aria-label={ariaText}
      className={`relative w-9 h-9 rounded-xl border transition-all duration-300 flex items-center justify-center group shadow-2xs ${
        isRunning
          ? 'bg-dancheong/15 border-dancheong ring-2 ring-dancheong/30 animate-pulse'
          : 'bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border-border-card text-ink'
      }`}
    >
      {/* Authentic 2D Shin Ramyeon (신라면) Noodle Pouch Icon */}
      <RamyeonPacketIcon className="w-6 h-6" idPrefix="header-btn" />

      {/* Mini Active Pulse Dot when running */}
      {isRunning && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dancheong opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-dancheong"></span>
        </span>
      )}
    </button>
  );
};
