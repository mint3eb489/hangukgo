import React, { useState, useEffect, useMemo } from 'react';
import { X, Layers, Headphones, Sparkles, List, Check, Play } from 'lucide-react';
import { RetroTvIcon } from './RetroTvIcon';
import { VocabItem } from '../data/vocabData';
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
  dramaItems?: VocabItem[];
  onStartDramaMode: (subcategory: string, mode: DramaViewMode) => void;
}

export const DramaModeModal: React.FC<DramaModeModalProps> = ({
  isOpen,
  onClose,
  lang = 'de',
  currentShowSub = '',
  currentMode = 'card',
  dramaItems = [],
  onStartDramaMode,
}) => {
  const isKr = lang === 'kr';

  // Extract unique drama subcategories/shows from user's uploaded drama items
  const dramaShows = useMemo(() => {
    const showMap = new Map<string, VocabItem[]>();
    dramaItems.forEach((item) => {
      const subName = item.sub?.trim() || (isKr ? '일반 드라마' : 'Allgemein');
      const existing = showMap.get(subName) || [];
      existing.push(item);
      showMap.set(subName, existing);
    });

    return Array.from(showMap.entries()).map(([subName, items], index) => ({
      id: `drama_sub_${index}`,
      subcategory: subName,
      title: subName,
      channelNumber: index + 1,
      items,
      count: items.length,
    }));
  }, [dramaItems, isKr]);

  const [selectedSub, setSelectedSub] = useState<string>(() => {
    if (currentShowSub && currentShowSub !== 'all' && dramaShows.some((s) => s.subcategory === currentShowSub)) {
      return currentShowSub;
    }
    return dramaShows[0]?.subcategory || '';
  });
  const [selectedMode, setSelectedMode] = useState<DramaViewMode>(currentMode || 'card');

  // Synchronize selected subcategory when modal opens or currentShowSub/dramaShows change
  useEffect(() => {
    if (isOpen) {
      if (currentShowSub && currentShowSub !== 'all' && dramaShows.some((s) => s.subcategory === currentShowSub)) {
        setSelectedSub(currentShowSub);
      } else if (dramaShows.length > 0 && (!selectedSub || selectedSub === 'all' || !dramaShows.some((s) => s.subcategory === selectedSub))) {
        setSelectedSub(dramaShows[0].subcategory);
      }
      setSelectedMode(currentMode || 'card');
    }
  }, [isOpen, currentShowSub, currentMode, dramaShows, selectedSub]);

  if (!isOpen) return null;

  const hasItems = dramaShows.length > 0;
  const activeShow = dramaShows.find((s) => s.subcategory === selectedSub) || dramaShows[0];

  const handleLaunchShow = (subToStart?: string) => {
    const targetSub = subToStart || activeShow?.subcategory;
    if (!targetSub) return;
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
    onStartDramaMode(targetSub, selectedMode);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-ink/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center safe-modal-overlay z-50"
      onClick={onClose}
    >
      <div
        className="bg-hanji border border-border-card rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 animate-pop safe-modal-panel overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-card pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-obangBlue/12 border border-obangBlue/30 flex items-center justify-center shrink-0">
              <RetroTvIcon className="w-6 h-6" idPrefix="drama-modal-header" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-ink">
                {isKr ? '드라마 모드 (K-Drama)' : 'Drama-Modus'}
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-obangBlue/15 text-obangBlue border border-obangBlue/30">
                {dramaShows.length} {isKr ? '시리즈' : dramaShows.length === 1 ? 'Serie' : 'Serien'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface transition shrink-0"
            aria-label={isKr ? '닫기' : 'Schließen'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Retro TV Channel Stage: With prominent Start-Button */}
        <div className="bg-surface/80 rounded-2xl p-3.5 border border-border-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <RetroTvIcon className="w-10 h-10 shrink-0" idPrefix="drama-stage-tv" />
              <div className="min-w-0">
                <div className="text-[11px] font-mono uppercase tracking-wider text-obangBlue font-bold">
                  {!hasItems
                    ? isKr
                      ? 'CH -- · 채널 대기 중'
                      : 'CH -- · Keine Listen'
                    : `CH ${String(activeShow?.channelNumber || 1).padStart(2, '0')} · K-Drama`}
                </div>
                <div className="font-bold text-sm sm:text-base text-ink truncate">
                  {!hasItems
                    ? isKr
                      ? 'K-드라마 단어장이 없습니다'
                      : 'Noch keine K-Drama Listen hinterlegt'
                    : activeShow?.title || selectedSub}
                </div>
              </div>
            </div>

            {hasItems && (
              <button
                type="button"
                onClick={() => handleLaunchShow(selectedSub)}
                className="px-4 py-2 rounded-xl bg-obangBlue hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md flex items-center gap-1.5 transition shrink-0"
                title={isKr ? '선택한 드라마 시작' : 'Gewähltes K-Drama starten'}
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isKr ? '시작' : 'Start'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area: K-Drama Shows Cards (Select only, no individual Start buttons) */}
        {!hasItems ? (
          <div className="space-y-3 py-8 flex flex-col items-center justify-center text-center px-4 bg-surface/40 rounded-2xl border border-dashed border-border-card">
            <div className="w-12 h-12 rounded-2xl bg-obangBlue/10 border border-obangBlue/30 flex items-center justify-center text-obangBlue">
              <RetroTvIcon className="w-7 h-7" idPrefix="drama-empty-icon" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="font-bold text-sm sm:text-base text-ink">
                {isKr ? '등록된 K-드라마 단어장이 없습니다' : 'Noch keine K-Drama Listen hinterlegt'}
              </h4>
              <p className="text-xs text-muted leading-relaxed">
                {isKr
                  ? 'K-드라마 단어장은 메뉴의 [단어 추가]에서 목표 레벨을 „K-Drama“로 선택하여 등록할 수 있습니다.'
                  : 'Du kannst deine K-Drama Vokabellisten zentral unter Extras & Einstellungen → „Vokabeln hinzufügen“ hochladen.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="space-y-2 max-h-[38dvh] sm:max-h-[42vh] overflow-y-auto overscroll-contain pr-1">
              {dramaShows.map((show) => {
                const isSelected = activeShow?.subcategory === show.subcategory;

                return (
                  <div
                    key={show.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      hapticTap();
                      setSelectedSub(show.subcategory);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedSub(show.subcategory);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-obangBlue/12 border-obangBlue text-ink shadow-sm ring-1 ring-obangBlue/40'
                        : 'bg-surface/60 hover:bg-surface border-border-card text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'bg-obangBlue text-white shadow-xs'
                            : 'border-2 border-border-card bg-card'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-ink truncate" title={show.title}>
                          {show.title}
                        </div>
                        <div className="text-[11px] font-semibold text-obangBlue">
                          CH {String(show.channelNumber).padStart(2, '0')} · K-Drama
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-card border border-border-card text-muted">
                        {show.count} {isKr ? '단어' : 'Wörter'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode Selector (Only shown when items exist) */}
        {hasItems && (
          <div className="pt-2.5 border-t border-border-card">
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
          </div>
        )}
      </div>
    </div>
  );
};
