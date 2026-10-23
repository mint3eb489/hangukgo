import React, { useEffect, useRef } from 'react';
import { VocabItem } from '../data/vocabData';
import { SrsMap, getSrsRecord, getSrsStageLabel, formatDueText } from '../utils/srs';
import { highlightKoreanVocab } from '../utils/highlightVocab';
import { hapticFlip, hapticRepeat, hapticSuccess, hapticTap } from '../utils/haptics';
import { HanjaBreakdownBox } from './HanjaBreakdownBox';
import { RamyeonPacketIcon } from './RamyeonPacketIcon';
import { BunnyEarsIcon } from './BunnyEarsIcon';
import { RetroTvIcon } from './RetroTvIcon';
import { SojuBottleIcon } from './SojuBottleIcon';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Check,
  Sparkles,
} from 'lucide-react';

import { AppLanguage, translations } from '../utils/translations';

interface FlashcardViewProps {
  deck: VocabItem[];
  totalLevelCount?: number;
  currentIndex: number;
  isFlipped: boolean;
  krToDe: boolean;
  srsMap: SrsMap;
  lang?: AppLanguage;
  onFlip: () => void;
  onNext: () => void;
  onPrev: () => void;
  onMarkSrs: (id: string, success: boolean) => void;
  onOpenUpload?: () => void;
  // Center action slot props for mobile bottom bar
  isRamyeonRunning?: boolean;
  ramyeonTimeLeft?: number;
  onOpenRamyeon?: () => void;
  specialPlayMode?: 'none' | 'drama' | 'bunny';
  isSojuActive?: boolean;
  onOpenDrama?: () => void;
  onOpenBunny?: () => void;
  onOpenSoju?: () => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  deck,
  totalLevelCount = 0,
  currentIndex,
  isFlipped,
  krToDe,
  srsMap,
  lang = 'de',
  onFlip,
  onNext,
  onPrev,
  onMarkSrs,
  onOpenUpload,
  isRamyeonRunning = false,
  ramyeonTimeLeft = 0,
  onOpenRamyeon,
  specialPlayMode = 'none',
  isSojuActive = false,
  onOpenDrama,
  onOpenBunny,
  onOpenSoju,
}) => {
  const t = translations[lang];
  const touchAreaRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number>(0);

  const currentItem = deck[currentIndex];

  const handleCardFlip = () => {
    hapticFlip();
    onFlip();
  };

  const handleRateCard = (success: boolean) => {
    if (!currentItem) return;
    if (success) {
      hapticSuccess();
    } else {
      hapticRepeat();
    }
    onMarkSrs(currentItem.id, success);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        hapticFlip();
        onFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        hapticTap();
        onNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        hapticTap();
        onPrev();
      } else if (e.key === '1') {
        e.preventDefault();
        if (currentItem) {
          hapticRepeat();
          onMarkSrs(currentItem.id, false);
        }
      } else if (e.key === '2') {
        e.preventDefault();
        if (currentItem) {
          hapticSuccess();
          onMarkSrs(currentItem.id, true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFlip, onNext, onPrev, onMarkSrs, currentItem]);

  // Touch swipe handling for mobile
  useEffect(() => {
    const el = touchAreaRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartXRef.current = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const diff = e.changedTouches[0].screenX - touchStartXRef.current;
      if (Math.abs(diff) > 55) {
        hapticTap();
        if (diff < 0) {
          onNext();
        } else {
          onPrev();
        }
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onNext, onPrev]);

  if (deck.length === 0) {
    const isZeroVocab = totalLevelCount === 0;
    return (
      <div className="my-8 py-16 px-6 text-center hanji-card-elevated rounded-3xl flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-celadon/15 flex items-center justify-center text-celadon">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-kr text-ink">
          {isZeroVocab
            ? lang === 'kr'
              ? '아직 등록된 단어가 없습니다 (0개)'
              : 'Noch keine Vokabeln vorhanden (0 Karten)'
            : t.flashcard.allCompletedTitle}
        </h2>
        <p className="text-sm text-muted max-w-md">
          {isZeroVocab
            ? lang === 'kr'
              ? '단어 및 클라우드 센터에서 CSV 또는 .md 단어장을 업로드하거나 새 단어를 추가하세요.'
              : 'Lade deine eigenen CSV- oder .md-Listen über die Vokabel- & Cloud-Zentrale hoch oder füge einzelne Wörter hinzu.'
            : t.flashcard.allCompletedDesc}
        </p>
        {onOpenUpload && (
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onOpenUpload();
            }}
            className="mt-2 px-5 py-2.5 rounded-xl bg-celadon hover:bg-celadon/90 text-white text-xs font-semibold shadow-sm transition"
          >
            {lang === 'kr' ? '+ CSV / .md 업로드 및 단어 추가' : '+ CSV / .md Liste hochladen'}
          </button>
        )}
      </div>
    );
  }

  const srsRecord = getSrsRecord(currentItem.id, srsMap);
  const srsBadge = getSrsStageLabel(srsRecord.level, lang);
  const dueText = formatDueText(srsRecord.nextReviewDate, srsRecord.level, lang);
  const progressPercent = ((currentIndex + 1) / deck.length) * 100;

  return (
    <div className="mt-0.5 sm:mt-1 flex flex-col flex-1 min-h-0 justify-between">
      {/* Top Meta Bar: Card Position & SRS Status */}
      <div className="shrink-0">
        <div className="flex items-center justify-between text-xs text-muted mb-1 px-1">
          <div className="flex items-center gap-1.5 tabular-nums">
            <span className="font-semibold text-ink">
              {t.flashcard.cardOf(currentIndex + 1, deck.length)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-muted">
              {srsBadge.name} ({dueText})
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden mb-1 sm:mb-2 border border-border-card/80">
          <div
            className="bg-celadon h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3D Flip Card Container: Dynamically adapts to smartphone display height */}
      <div
        ref={touchAreaRef}
        className="perspective-1000 hanji-paper-stack w-full flex-1 min-h-[220px] md:h-[400px] md:flex-initial relative my-1 sm:my-1.5"
      >
        <div
          onClick={handleCardFlip}
          className={`w-full h-full transform-style-3d cursor-pointer relative z-10 ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT */}
          <div className="backface-hidden absolute inset-0 hanji-card-elevated rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              {/* Quiet unboxed metadata */}
              <div className="flex items-center gap-2 text-xs font-medium text-muted">
                <span className="font-semibold text-ink/80">{currentItem.level}</span>
                <span aria-hidden="true">·</span>
                <span>{currentItem.sub}</span>
              </div>

              {/* SRS Level Text */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tabular-nums text-muted">
                  SRS {srsRecord.level}/5
                </span>
              </div>
            </div>

            {/* Generous Center Stage for Hangul Typography */}
            <div className="my-auto text-center px-3 py-6">
              <h2
                className={`text-ink text-balance ${
                  krToDe
                    ? 'hangul-display text-4xl sm:text-5xl md:text-6xl font-bold'
                    : 'text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-snug'
                }`}
              >
                {krToDe ? currentItem.kr : currentItem.de}
              </h2>
            </div>

            <div className="text-center text-xs text-muted flex items-center justify-center gap-1.5">
              <span>{t.flashcard.tapToFlip}</span>
            </div>
          </div>

          {/* BACK */}
          <div className="backface-hidden rotate-y-180 absolute inset-0 hanji-card-elevated rounded-3xl p-6 sm:p-8 md:p-10 border-celadon/45 flex flex-col justify-between overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted">
                <span className="font-semibold text-ink/80">{currentItem.level}</span>
                <span aria-hidden="true">·</span>
                <span>{currentItem.sub}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tabular-nums text-muted">
                  SRS {srsRecord.level}/5
                </span>
              </div>
            </div>

            <div className="my-auto text-center space-y-3 py-2">
              {/* Prompt word reminder */}
              <div
                className={
                  krToDe
                    ? 'hangul-display text-xl sm:text-2xl text-muted font-semibold'
                    : 'text-base sm:text-lg text-muted font-medium'
                }
              >
                {krToDe ? currentItem.kr : currentItem.de}
              </div>

              {/*Target Answer */}
              <h3
                className={`font-bold text-ink text-balance ${
                  !krToDe
                    ? 'hangul-display text-4xl sm:text-5xl font-bold'
                    : 'text-2xl sm:text-3xl md:text-4xl leading-snug'
                }`}
              >
                {krToDe ? currentItem.de : currentItem.kr}
              </h3>

              {/* Optional English translation when present */}
              {currentItem.en && (
                <div className="flex items-center justify-center pt-0.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/85 border border-border-card text-xs text-muted font-medium">
                    <span className="font-semibold text-ink/75">EN:</span>
                    <span>{currentItem.en}</span>
                  </span>
                </div>
              )}

              {/* Hanja Root Breakdown (automatically shown for Sino-Korean words) */}
              <HanjaBreakdownBox
                krWord={currentItem.kr}
                cat={currentItem.cat}
                lang={lang}
                variant="card"
              />

              {/* Example sentence box with highlighted vocabulary */}
              {currentItem.exKr && (
                <div className="mt-4 pt-3.5 border-t border-border-card text-left bg-hanji/90 p-4 rounded-2xl border border-border-card/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-celadon">
                      {t.flashcard.exampleLabel}
                    </span>
                  </div>
                  <p className="font-kr text-base sm:text-lg font-medium text-ink leading-relaxed tracking-wide">
                    {highlightKoreanVocab(currentItem.exKr, currentItem.kr, 'celadon')}
                  </p>
                  {currentItem.exDe && (
                    <p className="text-xs sm:text-sm text-muted leading-relaxed">
                      {currentItem.exDe}
                    </p>
                  )}
                  {currentItem.exEn && (
                    <p className="text-xs text-muted/80 leading-relaxed italic">
                      <span className="font-semibold not-italic text-ink/60 mr-1">EN:</span>
                      {currentItem.exEn}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls: Pinned at bottom directly above fixed mobile nav bar */}
      <div className="shrink-0 mt-auto pt-1 sm:pt-2 pb-0.5">
        <div className="grid grid-cols-[1fr_80px_1fr] md:grid-cols-[auto_1fr_80px_1fr_auto] items-center gap-2 sm:gap-3 max-w-2xl mx-auto w-full">
          {/* Desktop Only: Previous Card Button */}
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onPrev();
            }}
            className="hidden md:flex min-h-[50px] px-4 py-3 rounded-2xl hanji-card hover:bg-surface text-ink font-semibold text-sm transition items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98]"
            title="Pfeiltaste Links"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>{t.flashcard.prev}</span>
          </button>

          {/* Left Thumb Action: Repeat / Again (Dancheong Red) - Fixed proportional size */}
          <button
            type="button"
            onClick={() => handleRateCard(false)}
            className="w-full min-h-[48px] sm:min-h-[50px] py-2 sm:py-3.5 px-2.5 sm:px-4 rounded-2xl bg-dancheong/12 hover:bg-dancheong/20 text-dancheong border border-dancheong/35 font-bold text-sm sm:text-base transition flex items-center justify-center gap-1.5 sm:gap-2 shadow-2xs active:scale-[0.98] whitespace-nowrap"
            title="Taste 1"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>{t.flashcard.repeat}</span>
          </button>

          {/* Center Slot: Uniform 80px width - Only Ramyeon, Bunny, Drama, Soju or empty placeholder */}
          <div className="w-[80px] h-[48px] sm:h-[50px] flex items-center justify-center shrink-0">
            {(() => {
              // 1. Ramyeon Timer (highest priority when running)
              if (isRamyeonRunning && onOpenRamyeon) {
                const m = Math.floor(ramyeonTimeLeft / 60);
                const s = ramyeonTimeLeft % 60;
                const formatted = `${m}:${s < 10 ? '0' : ''}${s}`;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      onOpenRamyeon();
                    }}
                    className="w-[80px] h-[48px] sm:h-[50px] rounded-2xl border-2 border-dancheong/70 bg-dancheong/10 hover:bg-dancheong/20 text-ink flex items-center justify-center gap-1 active:scale-95 transition shadow-2xs"
                    title="신라면 타이머 (Ramyeon Timer)"
                  >
                    <RamyeonPacketIcon className="w-4 h-4 shrink-0" idPrefix="card-center-ramyeon" />
                    <span className="font-mono font-bold text-xs text-ink">{formatted}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-dancheong animate-ping shrink-0" />
                  </button>
                );
              }
              // 2. Bunny Mode
              if (specialPlayMode === 'bunny' && onOpenBunny) {
                return (
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      onOpenBunny();
                    }}
                    className="w-[80px] h-[48px] sm:h-[50px] rounded-2xl border-2 border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 flex items-center justify-center gap-1.5 active:scale-95 transition shadow-2xs font-semibold text-xs"
                    title="토끼 모드 (Bunny Hop)"
                  >
                    <BunnyEarsIcon className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="font-kr font-bold text-xs">토끼</span>
                  </button>
                );
              }
              // 3. Drama Mode
              if (specialPlayMode === 'drama' && onOpenDrama) {
                return (
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      onOpenDrama();
                    }}
                    className="w-[80px] h-[48px] sm:h-[50px] rounded-2xl border-2 border-purple-500/60 bg-purple-500/10 hover:bg-purple-500/20 text-purple-800 dark:text-purple-200 flex items-center justify-center gap-1.5 active:scale-95 transition shadow-2xs font-semibold text-xs"
                    title="드라마 모드 (Drama Mode)"
                  >
                    <RetroTvIcon className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="font-kr font-bold text-xs">드라마</span>
                  </button>
                );
              }
              // 4. Soju Roulette
              if (isSojuActive && onOpenSoju) {
                return (
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      onOpenSoju();
                    }}
                    className="w-[80px] h-[48px] sm:h-[50px] rounded-2xl border-2 border-emerald-600/60 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-1.5 active:scale-95 transition shadow-2xs font-semibold text-xs"
                    title="소주 룰렛 (Soju Roulette)"
                  >
                    <SojuBottleIcon className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-kr font-bold text-xs">소주</span>
                  </button>
                );
              }
              // Inactive state: Empty 80px space to keep Wiederholen & Gelernt rock-solid without shifting
              return <div className="w-[80px] h-[48px] sm:h-[50px]" aria-hidden="true" />;
            })()}
          </div>

          {/* Right Thumb Action: Learned / Known (Celadon Green) - Fixed proportional size */}
          <button
            type="button"
            onClick={() => handleRateCard(true)}
            className="w-full min-h-[48px] sm:min-h-[50px] py-2 sm:py-3.5 px-2.5 sm:px-4 rounded-2xl bg-celadon hover:bg-celadon/90 text-white font-bold text-sm sm:text-base shadow-sm transition flex items-center justify-center gap-1.5 sm:gap-2 active:scale-[0.98] whitespace-nowrap"
            title="Taste 2"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{t.flashcard.learned}</span>
          </button>

          {/* Desktop Only: Next Card Button */}
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onNext();
            }}
            className="hidden md:flex min-h-[50px] px-4 py-3 rounded-2xl hanji-card hover:bg-surface text-ink font-semibold text-sm transition items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98]"
            title="Pfeiltaste Rechts"
          >
            <span>{t.flashcard.next}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
