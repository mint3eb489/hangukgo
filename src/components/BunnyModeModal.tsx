import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  RotateCw,
  Check,
  Layers,
  Headphones,
  Sparkles,
  List,
} from 'lucide-react';
import { VocabItem } from '../data/vocabData';
import { BunnyEarsIcon } from './BunnyEarsIcon';
import { BunnyHopResult, generateBunnyHopList } from '../utils/bunnyRandomizer';
import { AppLanguage } from '../utils/translations';
import { hapticTap } from '../utils/haptics';
import confetti from 'canvas-confetti';

export type BunnyViewMode = 'card' | 'listening' | 'quiz' | 'list';

interface BunnyModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableItems: VocabItem[];
  lang?: AppLanguage;
  onStartBunnyList: (items: VocabItem[], mode: BunnyViewMode, sourceSubs: string[]) => void;
}

export const BunnyModeModal: React.FC<BunnyModeModalProps> = ({
  isOpen,
  onClose,
  availableItems,
  lang = 'de',
  onStartBunnyList,
}) => {
  const isKr = lang === 'kr';
  const [targetSize, setTargetSize] = useState<number>(25);
  const [hopResult, setHopResult] = useState<BunnyHopResult | null>(null);
  const [selectedMode, setSelectedMode] = useState<BunnyViewMode>('card');
  const [isHopping, setIsHopping] = useState<boolean>(false);

  const performHop = useCallback(
    (sizeOverride?: number) => {
      const sizeToUse = sizeOverride ?? targetSize;
      setIsHopping(true);

      setTimeout(() => {
        const result = generateBunnyHopList(availableItems, sizeToUse);
        setHopResult(result);
        setSelectedMode(result.mode);
        setIsHopping(false);

        try {
          confetti({
            particleCount: 40,
            spread: 65,
            origin: { y: 0.6 },
            colors: ['#fda4af', '#f43f5e', '#f59e0b', '#10b981', '#ffffff'],
          });
        } catch {
          // ignore
        }
      }, 450);
    },
    [availableItems, targetSize]
  );

  // Modal open: do NOT auto-hop. Reset so user clicks ears to activate.
  useEffect(() => {
    if (isOpen) {
      setHopResult(null);
      setIsHopping(false);
    } else {
      setIsHopping(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSizeChange = (newSize: number) => {
    hapticTap();
    setTargetSize(newSize);
    if (hopResult) {
      performHop(newSize);
    }
  };

  const handleStart = () => {
    if (!hopResult || hopResult.items.length === 0) return;
    hapticTap();
    onStartBunnyList(hopResult.items, selectedMode, hopResult.sourceSubcategories);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-ink/60 dark:bg-black/75 flex items-center justify-center safe-modal-overlay z-50"
      onClick={onClose}
    >
      <div
        className="bg-hanji border border-border-card rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-pop safe-modal-panel overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-card pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-ochre/15 border border-ochre/30 flex items-center justify-center">
              <BunnyEarsIcon className="w-6 h-6" idPrefix="bunny-modal-header" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-ink">
                {isKr ? '토끼 모드 (Bunny-Mix)' : 'Bunny-Modus'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-ink hover:bg-surface transition"
            aria-label={isKr ? '닫기' : 'Schließen'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Stage: Hopping Bunny Animation (Clickable!) */}
        <div
          role="button"
          tabIndex={0}
          onClick={!isHopping ? () => performHop(targetSize) : undefined}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isHopping) {
              e.preventDefault();
              performHop(targetSize);
            }
          }}
          className={`relative bg-surface/70 rounded-2xl p-4 sm:p-5 border border-border-card flex flex-col items-center justify-center overflow-hidden transition select-none ${
            isHopping
              ? 'cursor-wait'
              : 'cursor-pointer hover:bg-surface/90 hover:border-ochre/40 active:scale-[0.99] group'
          }`}
          title={
            isHopping
              ? isKr
                ? '토끼가 뛰는 중...'
                : 'Bunny hüpft...'
              : hopResult
              ? isKr
                ? '다시 귀를 눌러 점프'
                : 'Auf die Ohren tippen zum erneuten Hüpfen'
              : isKr
              ? '토끼 귀를 눌러 시작'
              : 'Auf die Ohren tippen zum Starten'
          }
        >
          <div
            className={`w-16 h-16 flex items-center justify-center transition-transform duration-300 ${
              isHopping
                ? '-translate-y-3 rotate-6 scale-110'
                : 'translate-y-0 rotate-0 scale-100 group-hover:scale-110 group-active:scale-95'
            }`}
          >
            <BunnyEarsIcon className="w-14 h-14 drop-shadow-md" idPrefix="hopping-bunny" />
          </div>

          <div className="mt-2 text-center space-y-0.5">
            <div className="text-xs font-bold text-ink">
              {isHopping
                ? isKr
                  ? '모든 단어장을 뛰어다니며 단어를 모으는 중...'
                  : 'Bunny hüpft quer durch alle Listen & Kategorien...'
                : hopResult && hopResult.items.length > 0
                ? isKr
                  ? `${hopResult.sourceSubcategories.length}개 리스트에서 ${hopResult.items.length}개 단어 랜덤 조합 완료!`
                  : `${hopResult.items.length} Wörter aus ${hopResult.sourceSubcategories.length} Listen gemischt!`
                : isKr
                ? '토끼 귀를 눌러 단어를 무작위로 섞어보세요!'
                : 'Tippe auf die Hasenohren, um den Bunny-Modus zu starten!'}
            </div>
            {!isHopping && !hopResult && (
              <div className="text-[11px] text-muted">
                {isKr
                  ? '귀를 누르면 다양한 리스트에서 단어를 모아옵니다'
                  : 'Wählt per Zufall eine bunte Mischung aus all deinen Listen'}
              </div>
            )}
          </div>

          {/* List Size Selector Pills */}
          <div className="flex items-center gap-1.5 mt-3" onClick={(e) => e.stopPropagation()}>
            {[15, 25, 40, 60].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => handleSizeChange(sz)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  targetSize === sz
                    ? 'bg-ochre text-white border-ochre shadow-2xs'
                    : 'bg-card text-muted hover:text-ink border-border-card'
                }`}
              >
                {sz} {isKr ? '단어' : 'Wörter'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Breakdown (Nomen / Verben / Adjektive / Grammatik) - "Durchhüpfte Listen & Vorschau" removed */}
        {hopResult && hopResult.items.length > 0 ? (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            <div className="bg-surface p-2 sm:p-2.5 rounded-xl border border-border-card text-center">
              <div className="text-[10px] sm:text-[11px] text-muted font-medium truncate">
                {isKr ? '명사' : 'Nomen'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-ink mt-0.5">
                {hopResult.categoryBreakdown.noun}
              </div>
            </div>
            <div className="bg-surface p-2 sm:p-2.5 rounded-xl border border-border-card text-center">
              <div className="text-[10px] sm:text-[11px] text-muted font-medium truncate">
                {isKr ? '동사' : 'Verben'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-ink mt-0.5">
                {hopResult.categoryBreakdown.verb}
              </div>
            </div>
            <div className="bg-surface p-2 sm:p-2.5 rounded-xl border border-border-card text-center">
              <div className="text-[10px] sm:text-[11px] text-muted font-medium truncate">
                {isKr ? '형용사' : 'Adjektive'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-ink mt-0.5">
                {hopResult.categoryBreakdown.adjective}
              </div>
            </div>
            <div className="bg-surface p-2 sm:p-2.5 rounded-xl border border-border-card text-center">
              <div className="text-[10px] sm:text-[11px] text-muted font-medium truncate">
                {isKr ? '문법' : 'Grammatik'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-ink mt-0.5">
                {hopResult.categoryBreakdown.grammar}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {['Nomen', 'Verben', 'Adjektive', 'Grammatik'].map((label, idx) => (
              <div
                key={label}
                className="bg-surface/50 p-2 sm:p-2.5 rounded-xl border border-dashed border-border-card text-center"
              >
                <div className="text-[10px] sm:text-[11px] text-muted font-medium truncate">
                  {isKr ? ['명사', '동사', '형용사', '문법'][idx] : label}
                </div>
                <div className="text-xs sm:text-sm font-bold text-muted mt-0.5">
                  -
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mode Selection */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {(
            [
              { id: 'card', labelDe: 'Karten', labelKr: '카드', icon: Layers },
              { id: 'listening', labelDe: 'Hören', labelKr: '듣기', icon: Headphones },
              { id: 'quiz', labelDe: 'Quiz', labelKr: '퀴즈', icon: Sparkles },
              { id: 'list', labelDe: 'Liste', labelKr: '목록', icon: List },
            ] as const
          ).map((m) => {
            const Icon = m.icon;
            const active = selectedMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  hapticTap();
                  setSelectedMode(m.id);
                }}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                  active
                    ? 'bg-ink text-hanji border-ink shadow-2xs'
                    : 'bg-surface text-muted hover:text-ink border-border-card'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{isKr ? m.labelKr : m.labelDe}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-border-card">
          <button
            type="button"
            onClick={() => {
              hapticTap();
              performHop(targetSize);
            }}
            disabled={isHopping}
            className="px-3.5 py-2.5 rounded-xl border border-border-card bg-surface hover:bg-card text-xs font-semibold text-ink flex items-center gap-1.5 transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isHopping ? 'animate-spin' : ''}`} />
            <span>
              {isKr
                ? hopResult
                  ? '다시 점프'
                  : '토끼 귀 점프'
                : hopResult
                ? 'Neu hüpfen'
                : 'Ohren aktivieren'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleStart}
            disabled={isHopping || !hopResult || hopResult.items.length === 0}
            className="flex-1 py-2.5 px-4 rounded-xl bg-ochre hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>
              {isKr
                ? `토끼 리스트 시작 (${hopResult?.items.length || 0}개)`
                : hopResult
                ? `Bunny-Liste starten (${hopResult.items.length})`
                : 'Bunny-Liste starten'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
