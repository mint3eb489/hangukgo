import React from 'react';
import { Play, Pause, RotateCcw, X, Volume2, VolumeX, Sparkles, Plus } from 'lucide-react';
import { RamyeonPacketIcon } from './RamyeonPacketIcon';

import { AppLanguage, translations } from '../utils/translations';

interface RamyeonTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  soundEnabled: boolean;
  isDone: boolean;
  lang?: AppLanguage;
  onTogglePlay: () => void;
  onReset: (duration?: number) => void;
  onAddTime: (seconds: number) => void;
  onToggleSound: () => void;
  onDismissDone: () => void;
}

export const RamyeonTimerModal: React.FC<RamyeonTimerModalProps> = ({
  isOpen,
  onClose,
  timeLeft,
  totalDuration,
  isRunning,
  soundEnabled,
  isDone,
  lang = 'de',
  onTogglePlay,
  onReset,
  onAddTime,
  onToggleSound,
  onDismissDone,
}) => {
  const t = translations[lang];

  if (!isOpen && !isDone) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.max(0, Math.min(100, ((totalDuration - timeLeft) / totalDuration) * 100));

  // DONE MODAL SCREEN
  if (isDone) {
    return (
      <div className="fixed inset-0 bg-ink/75 dark:bg-black/85 flex items-center justify-center p-4 z-50 animate-pop">
        <div className="bg-hanji border-2 border-dancheong rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 relative">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border-card flex items-center justify-center mx-auto shadow-md animate-bounce">
            <RamyeonPacketIcon className="w-12 h-12" idPrefix="done-modal" />
          </div>

          <div className="space-y-1">
            <h3 className="font-kr font-bold text-2xl text-ink">
              {t.ramyeonModal.doneTitle}
            </h3>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border-card">
            <button
              onClick={() => {
                onReset(240);
                onDismissDone();
              }}
              className="flex-1 py-2.5 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 text-ink text-xs font-semibold transition"
            >
              {t.ramyeonModal.newTimer}
            </button>
            <button
              onClick={onDismissDone}
              className="flex-1 py-2.5 rounded-xl bg-ochre hover:bg-ochre/90 text-white text-xs font-bold shadow-sm transition"
            >
              {t.ramyeonModal.doneClose}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-ink/70 dark:bg-black/80 flex items-center justify-center safe-modal-overlay z-50">
      <div className="bg-hanji border border-border-card rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl space-y-5 animate-pop safe-modal-panel overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-card pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-surface border border-border-card flex items-center justify-center shadow-2xs shrink-0">
              <RamyeonPacketIcon className="w-7 h-7" idPrefix="timer-modal-header" />
            </div>
            <div>
              <h3 className="font-bold text-base text-ink flex items-center gap-1.5">
                <span>{t.ramyeonModal.title}</span>
                <span className="text-xs font-normal text-muted">{t.ramyeonModal.subtitle}</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleSound}
              title={soundEnabled ? t.ramyeonModal.soundOn : t.ramyeonModal.soundOff}
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-celadon" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface transition"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Digital Countdown Display */}
        <div className="text-center py-2 space-y-3">
          <div className="relative inline-flex items-center justify-center">
            {/* Circular Progress or Glow */}
            <div className="bg-surface rounded-3xl px-8 py-5 border border-border-card shadow-inner">
              <span className="font-mono text-5xl md:text-6xl font-extrabold tracking-wider text-ink">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border-card">
            <div
              className="bg-ochre h-full transition-all duration-500 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted px-1">
            <span>Start</span>
            <span className={isRunning ? 'text-ochre font-semibold animate-pulse' : 'text-muted'}>
              {isRunning ? t.ramyeonModal.cooking : t.ramyeonModal.ready}
            </span>
            <span>4:00 Min</span>
          </div>
        </div>

        {/* Preset & Time adjustments */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => onReset(240)}
            className={`py-2 px-1 rounded-xl text-xs font-semibold border transition ${
              totalDuration === 240 && !isRunning
                ? 'bg-dancheong text-white border-dancheong shadow-xs'
                : 'bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 text-ink border-border-card'
            }`}
          >
            {t.ramyeonModal.fourMin}
          </button>
          <button
            onClick={() => onReset(180)}
            className={`py-2 px-1 rounded-xl text-xs font-semibold border transition ${
              totalDuration === 180 && !isRunning
                ? 'bg-dancheong text-white border-dancheong shadow-xs'
                : 'bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 text-ink border-border-card'
            }`}
          >
            {t.ramyeonModal.threeMin}
          </button>
          <button
            onClick={() => onAddTime(30)}
            className="py-2 px-1 rounded-xl text-xs font-semibold bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 text-ink border border-border-card transition flex items-center justify-center gap-0.5"
            title="+30s"
          >
            <Plus className="w-3 h-3" />
            <span>{t.ramyeonModal.plus30s}</span>
          </button>
          <button
            onClick={() => onAddTime(60)}
            className="py-2 px-1 rounded-xl text-xs font-semibold bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 text-ink border border-border-card transition flex items-center justify-center gap-0.5"
            title="+1m"
          >
            <Plus className="w-3 h-3" />
            <span>{t.ramyeonModal.plus1m}</span>
          </button>
        </div>

        {/* Action Buttons: Play/Pause, Reset, Minimize */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-card">
          <button
            onClick={() => onReset()}
            className="px-4 py-2.5 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 text-ink text-xs font-semibold border border-border-card transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.ramyeonModal.reset}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 text-ink text-xs font-semibold transition"
            >
              {t.ramyeonModal.minimize}
            </button>
            <button
              onClick={onTogglePlay}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5 text-white ${
                isRunning
                  ? 'bg-dancheong hover:bg-dancheong/90'
                  : 'bg-ochre hover:bg-ochre/90'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  <span>{t.ramyeonModal.pause}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{timeLeft < totalDuration ? t.ramyeonModal.resume : t.ramyeonModal.start}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RamyeonFloatingWidgetProps {
  timeLeft: number;
  isRunning: boolean;
  lang?: AppLanguage;
  onClick: () => void;
}

export const RamyeonFloatingWidget: React.FC<RamyeonFloatingWidgetProps> = ({
  timeLeft,
  isRunning,
  lang = 'de',
  onClick,
}) => {
  const t = translations[lang];
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <button
      onClick={onClick}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-5 right-4 md:right-5 z-40 hanji-card-elevated border-2 border-dancheong rounded-full px-3.5 py-2 flex items-center gap-2.5 hover:scale-105 transition-transform duration-200 group text-ink ring-2 ring-dancheong/20"
      title={t.ramyeonModal.widgetTooltip(formatTime(timeLeft))}
    >
      <RamyeonPacketIcon className="w-5 h-5 shrink-0" idPrefix="floating-widget" />
      <span className="font-mono font-bold text-xs text-ink">
        {formatTime(timeLeft)}
      </span>
      {isRunning ? (
        <span className="w-2 h-2 rounded-full bg-dancheong animate-ping" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-stone-400" />
      )}
    </button>
  );
};
