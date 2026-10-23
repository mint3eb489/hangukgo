import React, { useState, useRef, useEffect } from 'react';
import { Info, Clock, Sparkles, RotateCcw, Check } from 'lucide-react';
import { AppLanguage, translations } from '../utils/translations';
import { hapticTap } from '../utils/haptics';

interface SrsInfoTooltipProps {
  stats: {
    due: number;
    mastered: number;
    learning: number;
  };
  deckCount: number;
  onlyDue: boolean;
  onToggleOnlyDue: () => void;
  lang?: AppLanguage;
}

export const SrsInfoTooltip: React.FC<SrsInfoTooltipProps> = ({
  stats,
  deckCount,
  onlyDue,
  onToggleOnlyDue,
  lang = 'de',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isKr = lang === 'kr';
  const t = translations[lang];

  // Close tooltip when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    hapticTap();
    setIsOpen((prev) => !prev);
  };

  const tooltipTitle = isKr
    ? `${stats.due}개 복습 필요 · ${stats.mastered}개 완료 · ${stats.learning}개 학습 중`
    : `${stats.due} fällig · ${stats.mastered} gemeistert · ${stats.learning} im Zyklus`;

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      {/* Compact Info-Point Trigger Button */}
      <button
        type="button"
        onClick={toggleOpen}
        title={tooltipTitle}
        aria-label={isKr ? 'SRS 학습 진행도 정보' : 'SRS-Lernstatus Info'}
        aria-expanded={isOpen}
        className={`relative min-h-[36px] sm:min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs active:scale-95 ${
          onlyDue
            ? 'bg-ochre/15 border-ochre/50 text-ochre ring-1 ring-ochre/30'
            : isOpen
            ? 'bg-card border-celadon/60 text-ink shadow-xs'
            : 'bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border-border-card text-muted hover:text-ink'
        }`}
      >
        <Info className={`w-4 h-4 shrink-0 ${onlyDue ? 'text-ochre' : 'text-celadon'}`} />

        {/* Small Due Counter Pill next to Info Icon */}
        <span className="tabular-nums font-mono text-[11px] font-bold">
          {stats.due > 0 ? (
            <span className={onlyDue ? 'text-ochre font-extrabold' : 'text-ochre'}>
              {stats.due}
            </span>
          ) : (
            <span className="text-celadon">0</span>
          )}
        </span>

        {/* Indicator dot if cards are due */}
        {stats.due > 0 && !onlyDue && (
          <span className="w-1.5 h-1.5 rounded-full bg-ochre animate-pulse" />
        )}
      </button>

      {/* Floating Tooltip Popover */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-64 sm:w-72 rounded-2xl hanji-card-elevated p-3.5 z-50 space-y-3 shadow-xl animate-pop border border-border-card"
          role="tooltip"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border-card">
            <div className="flex items-center gap-1.5 font-bold text-ink text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-celadon" />
              <span>{isKr ? 'SRS 학습 진행도' : 'SRS-Lernstatus'}</span>
            </div>
            <span className="text-[11px] text-muted font-mono tabular-nums">
              {deckCount} {isKr ? '단어' : 'Karten'}
            </span>
          </div>

          {/* Stats Details */}
          <div className="space-y-2 text-xs">
            {/* Due Cards */}
            <div className="p-2 rounded-xl bg-ochre/10 border border-ochre/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-ochre shrink-0" />
                <span className="text-ink font-medium">
                  {isKr ? '오늘 복습 필요' : 'Heute fällig'}:
                </span>
              </div>
              <span className="font-bold text-ochre font-mono tabular-nums text-sm">
                {stats.due}
              </span>
            </div>

            {/* Mastered Cards (Level 5) */}
            <div className="p-2 rounded-xl bg-celadon/10 border border-celadon/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-celadon shrink-0" />
                <span className="text-ink font-medium">
                  {isKr ? '완전히 마스터함' : 'Gemeistert (Stufe 5)'}:
                </span>
              </div>
              <span className="font-bold text-celadon font-mono tabular-nums text-sm">
                {stats.mastered}
              </span>
            </div>

            {/* In Learning Cycle (Level 1-4) */}
            <div className="p-2 rounded-xl bg-obangBlue/10 border border-obangBlue/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-obangBlue shrink-0" />
                <span className="text-ink font-medium">
                  {isKr ? '학습 사이클 진행 중' : 'Im Zyklus (Stufe 1–4)'}:
                </span>
              </div>
              <span className="font-bold text-obangBlue font-mono tabular-nums text-sm">
                {stats.learning}
              </span>
            </div>
          </div>

          {/* Action button to filter only due cards */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                hapticTap();
                onToggleOnlyDue();
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                onlyDue
                  ? 'bg-ochre text-white shadow-2xs hover:bg-ochre/90'
                  : 'bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-ink'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {onlyDue
                  ? isKr
                    ? '모든 단어 보기 (필터 해제)'
                    : 'Alle Wörter anzeigen (Filter aus)'
                  : isKr
                  ? '복습 대상만 필터링'
                  : 'Nur fällige Wörter üben'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
