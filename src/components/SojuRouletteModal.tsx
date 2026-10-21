import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VocabItem } from '../data/vocabData';
import {
  SojuSelection,
  generateRandomSojuSelection,
  GAME_MODES,
  getAvailableSojuCombos,
} from '../utils/sojuRandomizer';
import { SojuBottleIcon } from './SojuBottleIcon';
import { playSojuSpinTick, playSojuCheersChime } from '../utils/sojuAudio';
import {
  X,
  RotateCw,
  Sparkles,
  Layers,
  Headphones,
  Check,
  FolderOpen,
  Tag,
  Gamepad2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { AppLanguage, translations } from '../utils/translations';

interface SojuRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableItems: VocabItem[];
  lang?: AppLanguage;
  onApplySelection: (selection: SojuSelection) => void;
}

export const SojuRouletteModal: React.FC<SojuRouletteModalProps> = ({
  isOpen,
  onClose,
  availableItems,
  lang = 'de',
  onApplySelection,
}) => {
  const t = translations[lang];
  const [selection, setSelection] = useState<SojuSelection | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate total discovered subcategories for user feedback
  const totalCombos = getAvailableSojuCombos(availableItems, lang);
  const totalSubcategories = Array.from(new Set(availableItems.map((i) => i.sub))).length;

  const performSpin = useCallback(() => {
    if (isSpinning || availableItems.length === 0) return;

    setIsSpinning(true);

    // Pick new random rotation (at least 3-5 full turns + random stop angle)
    const extraTurns = (3 + Math.floor(Math.random() * 3)) * 360;
    const randomStopAngle = Math.floor(Math.random() * 360);
    const newTargetDeg = rotationDegrees + extraTurns + randomStopAngle;
    setRotationDegrees(newTargetDeg);

    // Audio ticks during spin
    if (soundEnabled) {
      let tickCount = 0;
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = setInterval(() => {
        tickCount++;
        playSojuSpinTick();
        if (tickCount > 14) {
          if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
        }
      }, 75);
    }

    // Spin duration 1.3s
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    spinTimerRef.current = setTimeout(() => {
      const nextResult = generateRandomSojuSelection(availableItems, lang);
      setSelection(nextResult);
      setIsSpinning(false);

      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);

      if (soundEnabled) {
        playSojuCheersChime();
      }

      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#16a34a', '#86efac', '#eab308', '#ffffff'],
        });
      } catch {
        // ignore
      }
    }, 1300);
  }, [availableItems, isSpinning, rotationDegrees, soundEnabled, lang]);

  // Reset and prepare on modal open (do NOT spin automatically)
  useEffect(() => {
    if (isOpen) {
      setSelection(null);
      setIsSpinning(false);
    } else {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      setIsSpinning(false);
    }
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (selection) {
      onApplySelection(selection);
      onClose();
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'listening':
        return <Headphones className="w-5 h-5 text-obangBlue" />;
      case 'quiz':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'card':
      default:
        return <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center safe-modal-overlay z-50">
      <div className="bg-hanji border border-border-card rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-pop safe-modal-panel overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-card pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <SojuBottleIcon className="w-5.5 h-5.5" idPrefix="modal-title" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-ink">
                {t.sojuModal.title} <span className="text-xs font-normal text-muted">{t.sojuModal.subtitle}</span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-ink hover:bg-surface transition"
            aria-label={lang === 'kr' ? '닫기' : 'Schließen'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Spinning Soju Bottle Stage (Clickable to spin!) */}
        <div
          role="button"
          tabIndex={0}
          onClick={!isSpinning ? performSpin : undefined}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isSpinning) {
              e.preventDefault();
              performSpin();
            }
          }}
          className={`relative bg-surface/70 rounded-2xl p-4 sm:p-6 border border-border-card flex flex-col items-center justify-center overflow-hidden transition select-none ${
            isSpinning
              ? 'cursor-wait'
              : 'cursor-pointer hover:bg-surface/90 hover:border-emerald-500/40 active:scale-[0.99]'
          }`}
          title={
            isSpinning
              ? t.sojuModal.spinning
              : selection
              ? t.sojuModal.spinAgain
              : t.sojuModal.tapToSpin
          }
        >
          {/* Subtle table circle guide */}
          <div className="absolute w-36 h-36 rounded-full border border-dashed border-emerald-500/25 pointer-events-none animate-spin-slow"></div>

          {/* The Spinning Bottle */}
          <div
            className={`w-20 h-20 flex items-center justify-center transition-transform ${
              !isSpinning ? 'hover:scale-110 active:scale-95' : ''
            }`}
            style={{
              transform: `rotate(${rotationDegrees}deg)`,
              transitionDuration: isSpinning ? '1.3s' : '0.2s',
              transitionTimingFunction: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
            }}
          >
            <SojuBottleIcon className="w-16 h-16 drop-shadow-md" idPrefix="spinning-soju" />
          </div>

          <div className="mt-2 text-center">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSpinning
                    ? 'bg-emerald-500 animate-ping'
                    : selection
                    ? 'bg-emerald-500'
                    : 'bg-emerald-500 animate-pulse'
                }`}
              ></span>
              {isSpinning
                ? t.sojuModal.spinning
                : selection
                ? t.sojuModal.chosen
                : t.sojuModal.tapToSpin}
            </span>
          </div>
        </div>

        {/* Three Slot Outcome Cards (Without 1/3, 2/3, 3/3 badges) */}
        {selection ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Spielmodus */}
            <div className="bg-surface p-3 rounded-xl border border-border-card space-y-1">
              <div className="flex items-center text-[11px] text-muted">
                <span className="flex items-center gap-1 font-medium">
                  <Gamepad2 className="w-3.5 h-3.5 text-obangBlue" /> {t.sojuModal.modeLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                {getModeIcon(selection.mode)}
                <span className="font-bold text-xs sm:text-sm text-ink truncate">
                  {selection.modeLabel}
                </span>
              </div>
            </div>

            {/* 2. Kategorie */}
            <div className="bg-surface p-3 rounded-xl border border-border-card space-y-1">
              <div className="flex items-center text-[11px] text-muted">
                <span className="flex items-center gap-1 font-medium">
                  <Tag className="w-3.5 h-3.5 text-celadon" /> {t.sojuModal.categoryLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="font-bold text-xs sm:text-sm text-ink truncate">
                  {selection.categoryLabel}
                </span>
              </div>
            </div>

            {/* 3. Unterkategorie */}
            <div className="bg-surface p-3 rounded-xl border border-border-card space-y-1">
              <div className="flex items-center text-[11px] text-muted">
                <span className="flex items-center gap-1 font-medium truncate">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-500" /> {t.sojuModal.subCategoryLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 pt-0.5">
                <span className="font-bold text-xs sm:text-sm text-ink truncate" title={selection.subcategory}>
                  {selection.subcategory}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-surface/50 p-3 rounded-xl border border-dashed border-border-card space-y-1">
              <div className="flex items-center text-[11px] text-muted">
                <span className="flex items-center gap-1 font-medium">
                  <Gamepad2 className="w-3.5 h-3.5 text-obangBlue" /> {t.sojuModal.modeLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="font-bold text-xs sm:text-sm text-muted">?</span>
              </div>
            </div>

            <div className="bg-surface/50 p-3 rounded-xl border border-dashed border-border-card space-y-1">
              <div className="flex items-center text-[11px] text-muted">
                <span className="flex items-center gap-1 font-medium">
                  <Tag className="w-3.5 h-3.5 text-celadon" /> {t.sojuModal.categoryLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="font-bold text-xs sm:text-sm text-muted">?</span>
              </div>
            </div>

            <div className="bg-surface/50 p-3 rounded-xl border border-dashed border-border-card space-y-1">
              <div className="flex items-center text-[11px] text-muted">
                <span className="flex items-center gap-1 font-medium truncate">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-500" /> {t.sojuModal.subCategoryLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 pt-0.5">
                <span className="font-bold text-xs sm:text-sm text-muted">?</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2.5 pt-1">
          <button
            type="button"
            onClick={performSpin}
            disabled={isSpinning}
            className={`px-3.5 py-2.5 rounded-xl border border-border-card text-xs font-semibold flex items-center gap-1.5 transition ${
              isSpinning
                ? 'opacity-50 cursor-not-allowed bg-surface text-muted'
                : 'bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 text-ink'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{selection ? t.sojuModal.spinAgain : t.sojuModal.spinBottle}</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isSpinning || !selection}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{t.sojuModal.startNow}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
