import React, { useState, useMemo } from 'react';
import { X, Layers, Headphones, Sparkles, List, Check, Shuffle, UploadCloud, Plus } from 'lucide-react';
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
  onOpenAddDrama?: (tab: 'single' | 'import') => void;
}

export const DramaModeModal: React.FC<DramaModeModalProps> = ({
  isOpen,
  onClose,
  lang = 'de',
  currentShowSub = 'all',
  currentMode = 'card',
  dramaItems = [],
  onStartDramaMode,
  onOpenAddDrama,
}) => {
  const isKr = lang === 'kr';
  const [selectedSub, setSelectedSub] = useState<string>(currentShowSub || 'all');
  const [selectedMode, setSelectedMode] = useState<DramaViewMode>(currentMode || 'card');

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
      previewWords: items.slice(0, 4).map((i) => i.kr),
    }));
  }, [dramaItems, isKr]);

  if (!isOpen) return null;

  const hasItems = dramaItems.length > 0;
  const activeShow = dramaShows.find((s) => s.subcategory === selectedSub);

  const selectedCount =
    selectedSub === 'all'
      ? dramaItems.length
      : dramaItems.filter((i) => (i.sub?.trim() || (isKr ? '일반 드라마' : 'Allgemein')) === selectedSub).length;

  const handleRandomChannel = () => {
    if (dramaShows.length === 0) return;
    hapticTap();
    const randomShow = dramaShows[Math.floor(Math.random() * dramaShows.length)];
    setSelectedSub(randomShow.subcategory);
  };

  const handleStart = () => {
    if (!hasItems) return;
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
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-ink">
                  {isKr ? '드라마 모드 (K-Drama)' : 'Drama-Modus'}
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-obangBlue/15 text-obangBlue border border-obangBlue/30">
                  {dramaItems.length} {isKr ? '단어' : 'Vokabeln'}
                </span>
              </div>
              <p className="text-xs text-muted">
                {isKr
                  ? '나만의 K-드라마 대사 & 어휘 전용 학습 모드'
                  : 'Exklusiver Spielmodus für deine eigenen K-Drama Vokabellisten'}
              </p>
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
                {!hasItems
                  ? isKr
                    ? 'CH -- · 채널 대기 중'
                    : 'CH -- · Kein Signal (Keine Listen)'
                  : selectedSub === 'all'
                  ? isKr
                    ? 'CH 00 · 전체 K-드라마 채널'
                    : 'CH 00 · Alle K-Dramas'
                  : `CH 0${activeShow?.channelNumber || 1} · K-Drama`}
              </div>
              <div className="font-bold text-sm text-ink truncate">
                {!hasItems
                  ? isKr
                    ? 'K-드라마 단어장을 직접 추가해주세요'
                    : 'Eigene K-Drama Vokabelliste hochladen'
                  : selectedSub === 'all'
                  ? isKr
                    ? '업로드된 모든 K-드라마 통합'
                    : 'Alle K-Drama Vokabellisten (Gesamtmix)'
                  : activeShow
                  ? activeShow.title
                  : selectedSub}
              </div>
              <div className="text-xs text-muted italic truncate mt-0.5">
                {!hasItems
                  ? isKr
                    ? '이 모드는 오직 사용자가 올린 드라마 목록으로만 작동합니다.'
                    : 'Dieser Modus wird ausschließlich mit deinen eigenen K-Drama Listen bespielt.'
                  : activeShow
                  ? `${activeShow.count} ${isKr ? '개 단어 포함' : 'Vokabeln in dieser Liste'}`
                  : `${dramaItems.length} ${isKr ? '개 단어 포함' : 'Vokabeln insgesamt'}`}
              </div>
            </div>
          </div>

          {hasItems && dramaShows.length > 1 && (
            <button
              type="button"
              onClick={handleRandomChannel}
              className="px-3 py-2 rounded-xl bg-card hover:bg-stone-200/70 dark:hover:bg-stone-700/60 border border-border-card text-xs font-semibold text-ink transition flex items-center gap-1.5 shrink-0"
              title={isKr ? '랜덤 채널 돌리기' : 'Zufälliges K-Drama wählen'}
            >
              <Shuffle className="w-3.5 h-3.5 text-obangBlue" />
              <span className="hidden sm:inline">{isKr ? '채널 변경' : 'Zufall'}</span>
            </button>
          )}
        </div>

        {/* Main Content Area */}
        {!hasItems ? (
          /* Empty State: Inviting the user to upload their own drama vocabularies */
          <div className="space-y-4 py-4 flex-1 flex flex-col items-center justify-center text-center px-4 bg-surface/40 rounded-2xl border border-dashed border-border-card">
            <div className="w-14 h-14 rounded-2xl bg-obangBlue/10 border border-obangBlue/30 flex items-center justify-center text-obangBlue">
              <RetroTvIcon className="w-8 h-8" idPrefix="drama-empty-icon" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="font-bold text-sm sm:text-base text-ink">
                {isKr ? '등록된 K-드라마 단어장이 없습니다' : 'Noch keine K-Drama Listen vorhanden'}
              </h4>
              <p className="text-xs text-muted leading-relaxed">
                {isKr
                  ? '이 Spielmodus는 미리 채워진 단어 없이 사용자가 직접 올린 드라마 목록으로만 채워집니다. 아래 버튼을 눌러 첫 번째 드라마 단어장을 업로드해보세요!'
                  : 'Dieser Modus enthält keine festen Vorgaben mehr. Du kannst ihn selbst mit deinen Lieblings-Dramas füttern (z. B. Goblin, Crash Landing on You, Queen of Tears).'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  if (onOpenAddDrama) onOpenAddDrama('import');
                }}
                className="px-4 py-2.5 rounded-xl bg-obangBlue hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isKr ? 'CSV / Markdown 파일 업로드' : 'Drama-Liste importieren (CSV/MD)'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  if (onOpenAddDrama) onOpenAddDrama('single');
                }}
                className="px-3.5 py-2.5 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-xs font-semibold text-ink transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-obangBlue" />
                <span>{isKr ? '단어 직접 입력' : 'Einzeln eintragen'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Populated State: User's Drama Lists */
          <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0">
            {/* All K-Dramas Combined Card */}
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
                    {dramaItems.length} {isKr ? '단어' : 'Wörter'}
                  </span>
                </div>
                <div className="text-[11px] text-muted mt-0.5">
                  {isKr ? '모든 등록된 드라마 단어를 믹스하여 학습합니다' : 'Mixt alle von dir hochgeladenen K-Drama Vokabeln'}
                </div>
              </div>
              {selectedSub === 'all' && <Check className="w-4 h-4 text-obangBlue shrink-0" />}
            </button>

            {/* Individual Drama Shows Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dramaShows.map((show) => {
                const isSelected = selectedSub === show.subcategory;

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
                          {show.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-card border border-border-card text-muted shrink-0">
                          {show.count}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-obangBlue truncate">
                        CH 0{show.channelNumber} · K-Drama
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {show.previewWords.map((word) => (
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

            {/* Upload More Button */}
            <div className="pt-1 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  if (onOpenAddDrama) onOpenAddDrama('import');
                }}
                className="px-3.5 py-2 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-xs font-semibold text-muted hover:text-ink transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-obangBlue" />
                <span>{isKr ? '새로운 K-드라마 리스트 추가' : '+ Weitere Drama-Liste hochladen'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode Selector & Start Action (Only enabled when items exist) */}
        {hasItems && (
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
        )}
      </div>
    </div>
  );
};
