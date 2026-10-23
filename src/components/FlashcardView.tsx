import React, { useEffect, useRef, useState } from 'react';
import { VocabItem } from '../data/vocabData';
import { speakKorean } from '../utils/speech';
import { SrsMap, getSrsRecord, getSrsStageLabel, formatDueText } from '../utils/srs';
import { highlightKoreanVocab } from '../utils/highlightVocab';
import { hapticFlip, hapticRepeat, hapticSuccess, hapticTap } from '../utils/haptics';
import { HanjaBreakdownBox } from './HanjaBreakdownBox';
import {
  Volume2,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Check,
  Sparkles,
  Snail,
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
}) => {
  const t = translations[lang];
  const touchAreaRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number>(0);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

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

  const handleSpeak = (e: React.MouseEvent, preferExample: boolean = false, slow = false) => {
    e.stopPropagation();
    hapticTap();
    const textToSpeak = preferExample && currentItem.exKr ? currentItem.exKr : currentItem.kr;
    speakKorean(textToSpeak, slow ? 0.75 : speechRate);
  };

  return (
    <div className="mt-0.5 sm:mt-1 flex flex-col flex-1 min-h-0 justify-between">
      {/* Top Meta Bar: Card Position, SRS Status & Speed Toggle */}
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

          {/* Single Snail Speed Toggle (1.0x ⇄ 0.75x) */}
          <button
            type="button"
            onClick={() => {
              hapticTap();
              setSpeechRate((prev) => (prev === 1.0 ? 0.75 : 1.0));
            }}
            title={t.flashcard.speedSlow}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition flex items-center gap-1.5 whitespace-nowrap ${
              speechRate === 0.75
                ? 'bg-celadon/15 border-celadon/45 text-celadon shadow-2xs'
                : 'bg-surface border-border-card text-muted hover:text-ink'
            }`}
          >
            <Snail className="w-3.5 h-3.5" />
            <span className="tabular-nums">{speechRate === 0.75 ? '0.75x' : '1.0x'}</span>
          </button>
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

              {/* SRS Level Text + Audio Button */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tabular-nums text-muted">
                  SRS {srsRecord.level}/5
                </span>

                <button
                  type="button"
                  onClick={(e) => handleSpeak(e, false)}
                  title={lang === 'kr' ? '발음 듣기' : 'Koreanische Aussprache anhören'}
                  className="min-w-[44px] min-h-[44px] -mr-2 rounded-full hover:bg-surface text-ink transition flex items-center justify-center"
                  aria-label="Aussprache anhören"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
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

              <button
                type="button"
                onClick={(e) => handleSpeak(e, true)}
                title={t.flashcard.listenSentence}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-surface/80 hover:bg-surface text-ink transition flex items-center gap-1.5 text-xs font-semibold border border-border-card"
                aria-label="Beispielsatz vorlesen"
              >
                <span>{t.flashcard.readAloud}</span>
                <Volume2 className="w-4 h-4 text-celadon" />
              </button>
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
        <div className="grid grid-cols-2 md:grid-cols-[auto_1fr_1fr_auto] items-center gap-2.5 sm:gap-3 max-w-2xl mx-auto">
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

          {/* Left Thumb Action: Repeat / Again (Dancheong Red) */}
          <button
            type="button"
            onClick={() => handleRateCard(false)}
            className="min-h-[46px] sm:min-h-[50px] py-2.5 sm:py-3.5 px-4 rounded-2xl bg-dancheong/12 hover:bg-dancheong/20 text-dancheong border border-dancheong/35 font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 shadow-2xs active:scale-[0.98] whitespace-nowrap"
            title="Taste 1"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>{t.flashcard.repeat}</span>
          </button>

          {/* Right Thumb Action: Learned / Known (Celadon Green) */}
          <button
            type="button"
            onClick={() => handleRateCard(true)}
            className="min-h-[46px] sm:min-h-[50px] py-2.5 sm:py-3.5 px-4 rounded-2xl bg-celadon hover:bg-celadon/90 text-white font-bold text-sm sm:text-base shadow-sm transition flex items-center justify-center gap-2 active:scale-[0.98] whitespace-nowrap"
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
