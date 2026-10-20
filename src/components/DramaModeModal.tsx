import React, { useState } from 'react';
import { X, Layers, Headphones, Sparkles, List, Check, Shuffle } from 'lucide-react';
import { RetroTvIcon } from './RetroTvIcon';
import { DRAMA_SHOWS, DRAMA_VOCAB_ITEMS } from '../data/dramaVocabData';
import { AppLanguage } from '../utils/translations';
import { hapticTap } from '../utils/haptics';
import confetti from 'canvas-confetti';

export type DramaViewMode = 'card' | 'listening' | 'quiz' | 'list';

interface DramaModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: AppLanguage;
  currentShowSub?: string;
  currentMode?: DramaViewMode;
  onStartDramaMode: (subcategory: string, mode: DramaViewMode) => void;
}

export const DramaModeModal: React.FC<DramaModeModalProps> = ({
  isOpen,
  onClose,
  lang = 'de',
  currentShowSub = 'all',
  currentMode = 'card',
  onStartDramaMode,
}) => {
  const isKr = lang === 'kr';
  const [selectedSub, setSelectedSub] = useState<string>(currentShowSub || 'all');
  const [selectedMode, setSelectedMode] = useState<DramaViewMode>(currentMode || 'card');

  if (!isOpen) return null;

  const activeShowMeta = DRAMA_SHOWS.find((s) => s.subcategory === selectedSub);

  const selectedCount =
    selectedSub === 'all'
      ? DRAMA_VOCAB_ITEMS.length
      : DRAMA_VOCAB_ITEMS.filter((i) => i.sub === selectedSub).length;

  const handleRandomChannel = () => {
    hapticTap();
    const randomShow = DRAMA_SHOWS[Math.floor(Math.random() * DRAMA_SHOWS.length)];
    setSelectedSub(randomShow.subcategory);
  };

  const handleStart = () => {
    hapticTap();
    try {
      confetti({
        particleCount: 40,
        spread: 55,
        origin: { y: 0.65 },
        colors: ['#38bdf8', '#2563eb', '#fda4af', '#f59e0b'],
      });
    } catch {
      // ignore
    }
    onStartDramaMode(selectedSub, selectedMode);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-ink/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-hanji border border-border-card rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-pop max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-card pb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-obangBlue/12 border border-obangBlue/30 flex items-center justify-center shrink-0">
              <RetroTvIcon className="w-6 h-6" idPrefix="drama-modal-header" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-ink">
                {isKr ? '드라마 모드 (K-Drama)' : 'Drama-Modus'}
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

        {/* Retro TV Channel Stage */}
        <div className="bg-surface/80 rounded-2xl p-3.5 border border-border-card flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <RetroTvIcon className="w-11 h-11 shrink-0" idPrefix="drama-stage-tv" />
            <div className="min-w-0">
              <div className="text-[11px] font-mono uppercase tracking-wider text-obangBlue font-bold">
                {selectedSub === 'all'
                  ? isKr
                    ? 'CH 00 · 전체 K-드라마 채널'
                    : 'CH 00 · Alle K-Dramas'
                  : `CH 0${DRAMA_SHOWS.findIndex((s) => s.subcategory === selectedSub) + 1} · ${activeShowMeta?.year || ''}`}
              </div>
              <div className="font-bold text-sm text-ink truncate">
                {selectedSub === 'all'
                  ? isKr
                    ? '전체 드라마 명대사 & 어휘 컬렉션'
                    : 'Alle K-Drama Vokabellisten (Komplett-Mix)'
                  : activeShowMeta
                  ? `${activeShowMeta.titleKr} (${activeShowMeta.titleDe})`
                  : selectedSub}
              </div>
              <div className="text-xs text-muted italic truncate mt-0.5">
                {activeShowMeta
                  ? `„${isKr ? activeShowMeta.quoteKr : activeShowMeta.quoteDe}“`
                  : isKr
                  ? '유명 한국 드라마 속 핵심 단어와 표현'
                  : 'Exklusive Vokabeln & Sätze aus legendären K-Dramas'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRandomChannel}
            className="px-3 py-2 rounded-xl bg-card hover:bg-stone-200/70 dark:hover:bg-stone-700/60 border border-border-card text-xs font-semibold text-ink transition flex items-center gap-1.5 shrink-0"
            title={isKr ? '랜덤 채널 돌리기' : 'Zufälliges K-Drama wählen'}
          >
            <Shuffle className="w-3.5 h-3.5 text-obangBlue" />
            <span className="hidden sm:inline">{isKr ? '채널 변경' : 'Zufall'}</span>
          </button>
        </div>

        {/* Scrollable K-Drama Exclusive Lists */}
        <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0">
          {/* All K-Dramas Card */}
          <button
            type="button"
            onClick={() => {
              hapticTap();
              setSelectedSub('all');
            }}
            className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
              selectedSub === 'all'
                ? 'bg-obangBlue/12 border-obangBlue text-ink shadow-2xs'
                : 'bg-surface/60 hover:bg-surface border-border-card text-ink'
            }`}
          >
            <div>
              <div className="font-bold text-xs sm:text-sm flex items-center gap-2">
                <span>{isKr ? '전체 K-드라마 통합 단어장' : 'Alle K-Dramas (Gesamtliste)'}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-card border border-border-card text-muted">
                  {DRAMA_VOCAB_ITEMS.length} {isKr ? '단어' : 'Wörter'}
                </span>
              </div>
            </div>
            {selectedSub === 'all' && <Check className="w-4 h-4 text-obangBlue shrink-0" />}
          </button>

          {/* Individual K-Drama Show Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DRAMA_SHOWS.map((show) => {
              const isSelected = selectedSub === show.subcategory;
              const showItems = DRAMA_VOCAB_ITEMS.filter((i) => i.sub === show.subcategory);
              const previewWords = showItems.slice(0, 4).map((i) => i.kr);

              return (
                <button
                  key={show.id}
                  type="button"
                  onClick={() => {
                    hapticTap();
                    setSelectedSub(show.subcategory);
                  }}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-obangBlue/12 border-obangBlue text-ink shadow-2xs'
                      : 'bg-surface/60 hover:bg-surface border-border-card text-ink'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-ink truncate">
                        {show.titleDe}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-card border border-border-card text-muted shrink-0">
                        {showItems.length}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-obangBlue truncate">
                      {show.titleKr} · {show.year}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {previewWords.map((word) => (
                      <span
                        key={word}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-card/90 border border-border-card text-muted"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Selector & Start Action */}
        <div className="pt-2 border-t border-border-card space-y-3 shrink-0">
          <div className="grid grid-cols-4 gap-1.5">
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

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-xs font-semibold text-muted hover:text-ink transition"
            >
              {isKr ? '취소' : 'Abbrechen'}
            </button>
            <button
              type="button"
              onClick={handleStart}
              className="px-5 py-2.5 rounded-xl bg-obangBlue hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              <span>
                {isKr
                  ? `드라마 학습 시작 (${selectedCount}개)`
                  : `Drama-Liste starten (${selectedCount})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
