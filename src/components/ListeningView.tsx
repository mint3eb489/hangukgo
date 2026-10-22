import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VocabItem } from '../data/vocabData';
import { speakKorean } from '../utils/speech';
import { SrsMap, getSrsRecord, getSrsStageLabel, formatDueText } from '../utils/srs';
import { highlightKoreanVocab } from '../utils/highlightVocab';
import { hapticFlip, hapticRepeat, hapticSuccess, hapticTap } from '../utils/haptics';
import { HanjaBreakdownBox } from './HanjaBreakdownBox';
import { AppLanguage, translations } from '../utils/translations';
import {
  Headphones,
  Volume2,
  Snail,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Check,
  Eye,
  Sparkles,
  Play,
} from 'lucide-react';

interface ListeningViewProps {
  deck: VocabItem[];
  totalLevelCount?: number;
  currentIndex: number;
  isFlipped: boolean;
  srsMap: SrsMap;
  lang?: AppLanguage;
  onFlip: () => void;
  onNext: () => void;
  onPrev: () => void;
  onMarkSrs: (id: string, success: boolean) => void;
  onOpenUpload?: () => void;
}

export const ListeningView: React.FC<ListeningViewProps> = ({
  deck,
  totalLevelCount = 0,
  currentIndex,
  isFlipped,
  srsMap,
  lang = 'de',
  onFlip,
  onNext,
  onPrev,
  onMarkSrs,
  onOpenUpload,
}) => {
  const t = translations[lang];
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const touchAreaRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number>(0);

  const currentItem = deck[currentIndex];

  const playAudio = useCallback(
    (rate = speechRate, textOverride?: string) => {
      if (!currentItem) return;
      hapticTap();
      setIsPlaying(true);
      const text = textOverride || currentItem.kr;
      speakKorean(text, rate).finally(() => {
        setIsPlaying(false);
      });
    },
    [currentItem, speechRate]
  );

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
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        playAudio(speechRate);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFlip, onNext, onPrev, onMarkSrs, currentItem, playAudio, speechRate]);

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
        if (diff < 0) onNext();
        else onPrev();
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
            : t.listening.allCompletedTitle}
        </h2>
        <p className="text-sm text-muted max-w-md">
          {isZeroVocab
            ? lang === 'kr'
              ? '단어 및 클라우드 센터에서 CSV 또는 .md 단어장을 업로드하거나 새 단어를 추가하세요.'
              : 'Lade deine eigenen CSV- oder .md-Listen über die Vokabel- & Cloud-Zentrale hoch oder füge einzelne Wörter hinzu.'
            : t.listening.allCompletedDesc}
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
    <div className="mt-1 flex flex-col">
      {/* Top Meta Bar */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 px-1 text-xs">
          <div className="flex items-center gap-1.5 text-muted tabular-nums">
            <span className="font-semibold text-obangBlue flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5" />
              <span>{t.listening.badge}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-ink">
              {currentIndex + 1} / {deck.length}
            </span>
          </div>

          {/* Single Snail Speed Toggle (1.0x ⇄ 0.75x) */}
          <button
            type="button"
            onClick={() => {
              hapticTap();
              setSpeechRate((prev) => (prev === 1.0 ? 0.75 : 1.0));
            }}
            title={t.listening.speedSlowTitle}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition flex items-center gap-1.5 whitespace-nowrap ${
              speechRate === 0.75
                ? 'bg-obangBlue/15 border-obangBlue/45 text-obangBlue shadow-2xs'
                : 'bg-surface border-border-card text-muted hover:text-ink'
            }`}
          >
            <Snail className="w-3.5 h-3.5" />
            <span className="tabular-nums">{speechRate === 0.75 ? '0.75x' : '1.0x'}</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden mb-2.5 border border-border-card/80">
          <div
            className="bg-obangBlue h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3D Flip Card Container with Hanji Paper Stack Depth */}
      <div
        ref={touchAreaRef}
        className="perspective-1000 hanji-paper-stack w-full h-72 sm:h-84 md:h-[400px] relative my-0.5"
      >
        <div
          onClick={handleCardFlip}
          className={`w-full h-full transform-style-3d cursor-pointer relative z-10 ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT (HIDDEN TEXT - ONLY AUDIO TRIGGER) */}
          <div className="backface-hidden absolute inset-0 hanji-card-elevated rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-muted">
              <div className="flex items-center gap-2 font-medium">
                <span className="font-semibold text-ink/80">{currentItem.level}</span>
                <span aria-hidden="true">·</span>
                <span>{currentItem.sub}</span>
              </div>
              <span className="tabular-nums">
                {srsBadge.name} ({dueText})
              </span>
            </div>

            {/* Listening Visualizer & Audio Buttons */}
            <div className="my-auto text-center space-y-4">
              <div className="inline-flex p-5 rounded-full bg-obangBlue/10 text-obangBlue animate-pulse-glow mx-auto">
                <Headphones className="w-12 h-12 md:w-14 md:h-14" />
              </div>

              <div>
                <p className="text-xs font-semibold text-muted">
                  {t.listening.visualizerTitle}
                </p>
                <p className="text-sm md:text-base font-medium text-ink mt-1">
                  {t.listening.visualizerDesc}
                </p>
              </div>

              {/* Action buttons on front */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(speechRate);
                  }}
                  className={`min-h-[48px] px-5 py-3 rounded-2xl font-bold text-sm shadow-sm transition flex items-center gap-2 whitespace-nowrap active:scale-[0.98] ${
                    isPlaying
                      ? 'bg-obangBlue text-white scale-105 ring-2 ring-obangBlue/40'
                      : 'bg-obangBlue hover:bg-obangBlue/90 text-white'
                  }`}
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{t.listening.listenWord(speechRate === 0.75)}</span>
                </button>

                {currentItem.exKr && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(speechRate, currentItem.exKr);
                    }}
                    className="min-h-[48px] px-4 py-3 rounded-2xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 text-ink font-semibold text-xs md:text-sm transition flex items-center gap-1.5 border border-border-card whitespace-nowrap active:scale-[0.98]"
                    title={lang === 'kr' ? '예문 듣기' : 'Beispielsatz anhören (Text bleibt verdeckt)'}
                  >
                    <Volume2 className="w-4 h-4 text-obangBlue" />
                    <span>{t.listening.listenSentence}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="text-center text-xs text-muted flex items-center justify-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>{t.listening.tapToReveal}</span>
            </div>
          </div>

          {/* BACK (REVEAL KOREAN + GERMAN + EXAMPLES + SRS) */}
          <div className="backface-hidden rotate-y-180 absolute inset-0 hanji-card-elevated rounded-3xl p-6 sm:p-8 md:p-10 border-obangBlue/45 flex flex-col justify-between overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-muted">
                <span className="font-semibold text-ink/80">{currentItem.level}</span>
                <span aria-hidden="true">·</span>
                <span>{currentItem.sub}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(speechRate);
                }}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-surface/80 hover:bg-surface text-ink transition flex items-center gap-1.5 text-xs font-semibold border border-border-card"
              >
                <Volume2 className="w-4 h-4 text-obangBlue" />
                <span>{t.listening.listenAgain}</span>
              </button>
            </div>

            <div className="my-auto text-center space-y-3 py-2">
              {/* Korean Word with Elevated Hangul Typography */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-obangBlue block">
                  {t.listening.koreanLabel}
                </span>
                <h3 className="hangul-display text-4xl sm:text-5xl md:text-6xl font-bold text-ink text-balance">
                  {currentItem.kr}
                </h3>
              </div>

              {/* German Meaning */}
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted block">
                  {t.listening.germanLabel}
                </span>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-ink">
                  {currentItem.de}
                </p>
              </div>

              {/* Hanja Root Breakdown */}
              <HanjaBreakdownBox
                krWord={currentItem.kr}
                cat={currentItem.cat}
                lang={lang}
                variant="card"
              />

              {/* Example sentence with highlighted target word */}
              {currentItem.exKr && (
                <div className="mt-3 pt-3 border-t border-border-card text-left bg-hanji/90 p-3.5 rounded-2xl border border-border-card/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-celadon">
                      {t.listening.exampleLabel}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio(speechRate, currentItem.exKr);
                      }}
                      className="text-muted hover:text-ink p-1"
                      title={lang === 'kr' ? '예문 듣기' : 'Satz vorlesen'}
                    >
                      <Volume2 className="w-4 h-4 text-obangBlue" />
                    </button>
                  </div>
                  <p className="font-kr text-sm sm:text-base font-medium text-ink leading-relaxed tracking-wide">
                    {highlightKoreanVocab(currentItem.exKr, currentItem.kr, 'obangBlue')}
                  </p>
                  <p className="text-xs sm:text-sm text-muted">
                    {currentItem.exDe}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls: Mobile 2 Rating Buttons | Desktop Zurück + 2 Rating Buttons + Weiter */}
      <div className="mt-3.5 sm:mt-5 pt-0.5">
        <div className="grid grid-cols-2 md:grid-cols-[auto_1fr_1fr_auto] items-center gap-2.5 sm:gap-3 max-w-2xl mx-auto">
          {/* Desktop Only: Previous Card Button */}
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onPrev();
            }}
            className="hidden md:flex min-h-[52px] px-4 py-3.5 rounded-2xl hanji-card hover:bg-surface text-ink font-semibold text-sm transition items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98]"
            title="Pfeiltaste Links"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>{t.flashcard.prev}</span>
          </button>

          <button
            type="button"
            onClick={() => handleRateCard(false)}
            className="min-h-[48px] sm:min-h-[52px] py-3 sm:py-3.5 px-4 rounded-2xl bg-dancheong/12 hover:bg-dancheong/20 text-dancheong border border-dancheong/35 font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 shadow-2xs active:scale-[0.98] whitespace-nowrap"
            title="Taste 1"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>{lang === 'kr' ? '다시 복습' : 'Unsicher'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleRateCard(true)}
            className="min-h-[48px] sm:min-h-[52px] py-3 sm:py-3.5 px-4 rounded-2xl bg-celadon hover:bg-celadon/90 text-white font-bold text-sm sm:text-base shadow-sm transition flex items-center justify-center gap-2 active:scale-[0.98] whitespace-nowrap"
            title="Taste 2"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{lang === 'kr' ? '알아들음' : 'Verstanden'}</span>
          </button>

          {/* Desktop Only: Next Card Button */}
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onNext();
            }}
            className="hidden md:flex min-h-[52px] px-4 py-3.5 rounded-2xl hanji-card hover:bg-surface text-ink font-semibold text-sm transition items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98]"
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
