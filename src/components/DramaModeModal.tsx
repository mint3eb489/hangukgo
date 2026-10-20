import React, { useState, useEffect, useMemo } from 'react';
import { X, Layers, Headphones, Sparkles, List, Check, Shuffle, Play, ChevronDown, FolderPlus } from 'lucide-react';
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
  otherCustomItems?: VocabItem[];
  onStartDramaMode: (subcategory: string, mode: DramaViewMode) => void;
  onConvertSubcategoryToDrama?: (subcategoryName: string) => void;
}

export const DramaModeModal: React.FC<DramaModeModalProps> = ({
  isOpen,
  onClose,
  lang = 'de',
  currentShowSub = 'all',
  currentMode = 'card',
  dramaItems = [],
  otherCustomItems = [],
  onStartDramaMode,
  onConvertSubcategoryToDrama,
}) => {
  const isKr = lang === 'kr';
  const [selectedSub, setSelectedSub] = useState<string>(currentShowSub || 'all');
  const [selectedMode, setSelectedMode] = useState<DramaViewMode>(currentMode || 'card');
  const [showOtherLists, setShowOtherLists] = useState<boolean>(false);

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

  // Extract other uploaded subcategories (in case user uploaded a K-Drama list while TOPIK I/II was active)
  const convertibleLists = useMemo(() => {
    const map = new Map<string, number>();
    otherCustomItems.forEach((item) => {
      const subName = item.sub?.trim();
      if (!subName || subName === 'Allgemein' || subName === 'Import') return;
      map.set(subName, (map.get(subName) || 0) + 1);
    });
    return Array.from(map.entries()).map(([subName, count]) => ({ subName, count }));
  }, [otherCustomItems]);

  // Synchronize selected subcategory when modal opens or currentShowSub changes
  useEffect(() => {
    if (isOpen) {
      if (currentShowSub && currentShowSub !== 'all' && dramaShows.some((s) => s.subcategory === currentShowSub)) {
        setSelectedSub(currentShowSub);
      } else if (dramaShows.length === 1) {
        setSelectedSub(dramaShows[0].subcategory);
      } else {
        setSelectedSub(currentShowSub || 'all');
      }
      setSelectedMode(currentMode || 'card');
    }
  }, [isOpen, currentShowSub, currentMode, dramaShows.length]);

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

  const handleLaunchShow = (subToStart: string) => {
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
    onStartDramaMode(subToStart, selectedMode);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-ink/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center safe-modal-overlay z-50"
      onClick={onClose}
    >
      <div
        className="bg-hanji border border-border-card rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-3.5 animate-pop safe-modal-panel overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-card pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-obangBlue/12 border border-obangBlue/30 flex items-center justify-center shrink-0">
              <RetroTvIcon className="w-6 h-6" idPrefix="drama-modal-header" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-ink">
                  {isKr ? '드라마 모드 (K-Drama)' : 'Drama-Modus'}
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-obangBlue/15 text-obangBlue border border-obangBlue/30">
                  {dramaShows.length} {isKr ? '시리즈' : dramaShows.length === 1 ? 'Serie' : 'Serien'} · {dramaItems.length} {isKr ? '단어' : 'Vokabeln'}
                </span>
              </div>
              <p className="text-xs text-muted truncate">
                {isKr
                  ? '나만의 K-드라마 전용 학습 채널을 선택하세요'
                  : 'Tippe auf ein K-Drama unten oder wähle den Kanal direkt aus'}
              </p>
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

        {/* Retro TV Channel Stage + Direct Dropdown Selector */}
        <div className="bg-surface/80 rounded-2xl p-3.5 border border-border-card space-y-2.5">
          <div className="flex items-center justify-between gap-3">
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
                      : 'CH 00 · Alle K-Dramas (Mix)'
                    : `CH ${String(activeShow?.channelNumber || 1).padStart(2, '0')} · K-Drama Serie`}
                </div>
                <div className="font-bold text-sm text-ink truncate">
                  {!hasItems
                    ? isKr
                      ? 'K-드라마 단어장이 아직 없습니다'
                      : 'Noch keine K-Drama Vokabeln hinterlegt'
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
                      ? '„단어 추가“ 메뉴에서 K-드라마 목록을 업로드해주세요.'
                      : 'Lade deine K-Drama Listen unter „Vokabeln hinzufügen“ hoch.'
                    : activeShow
                    ? `${activeShow.count} ${isKr ? '개 단어 포함' : 'Vokabeln in dieser Serie'}`
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
                <span>{isKr ? '랜덤' : 'Zufall'}</span>
              </button>
            )}
          </div>

          {/* Direct Native Dropdown Picker for Instant Selection on iPhone & Desktop */}
          {hasItems && (
            <div className="relative pt-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                {isKr ? '📺 드라마 시리즈 직접 선택:' : '📺 K-Drama direkt auswählen:'}
              </label>
              <div className="relative">
                <select
                  value={selectedSub}
                  onChange={(e) => {
                    hapticTap();
                    setSelectedSub(e.target.value);
                  }}
                  className="w-full appearance-none bg-card border-2 border-obangBlue/40 focus:border-obangBlue rounded-xl px-3.5 py-2.5 pr-9 text-sm font-bold text-ink shadow-2xs focus:outline-none cursor-pointer transition"
                  aria-label={isKr ? 'K-드라마 선택' : 'K-Drama auswählen'}
                >
                  <option value="all">
                    {isKr
                      ? `CH 00 · 전체 K-드라마 통합 (${dramaItems.length} 단어)`
                      : `CH 00 · Alle K-Dramas im Mix (${dramaItems.length} Vokabeln)`}
                  </option>
                  {dramaShows.map((show) => (
                    <option key={show.id} value={show.subcategory}>
                      {`CH ${String(show.channelNumber).padStart(2, '0')} · ${show.title} (${show.count} ${
                        isKr ? '단어' : 'Vokabeln'
                      })`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-obangBlue absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area: K-Drama Cards List (Explicit max-height so iOS Safari never collapses it) */}
        {!hasItems ? (
          <div className="space-y-3 py-6 flex flex-col items-center justify-center text-center px-4 bg-surface/40 rounded-2xl border border-dashed border-border-card">
            <div className="w-12 h-12 rounded-2xl bg-obangBlue/10 border border-obangBlue/30 flex items-center justify-center text-obangBlue">
              <RetroTvIcon className="w-7 h-7" idPrefix="drama-empty-icon" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="font-bold text-sm sm:text-base text-ink">
                {isKr ? '등록된 K-드라마 단어장이 없습니다' : 'Noch keine K-Drama Listen hinterlegt'}
              </h4>
              <p className="text-xs text-muted leading-relaxed">
                {isKr
                  ? 'K-드라마 단어장은 메뉴의 [단어 추가]에서 목표 레벨을 „K-Drama“로 선택하여 등록할 수 있습니다.'
                  : 'Du kannst deine K-Drama Vokabellisten zentral unter Extras & Einstellungen → „Vokabeln hinzufügen“ hochladen (Ziel: 🎬 K-Drama Modus).'}
              </p>
            </div>

            {/* If user has uploaded lists under TOPIK I/II, let them activate any of them as K-Drama right here! */}
            {convertibleLists.length > 0 && onConvertSubcategoryToDrama && (
              <div className="w-full pt-3 mt-2 border-t border-border-card/60 text-left space-y-2">
                <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <FolderPlus className="w-4 h-4 text-obangBlue shrink-0" />
                  <span>
                    {isKr
                      ? '업로드된 목록을 K-드라마로 활성화하기:'
                      : 'Bereits hochgeladene Listen als K-Drama aktivieren:'}
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto overscroll-contain space-y-1.5 pr-1">
                  {convertibleLists.map((list) => (
                    <div
                      key={list.subName}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-card border border-border-card"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-ink truncate">{list.subName}</div>
                        <div className="text-[10px] text-muted">
                          {list.count} {isKr ? '단어' : 'Vokabeln'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          hapticTap();
                          onConvertSubcategoryToDrama(list.subName);
                          setSelectedSub(list.subName);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-obangBlue text-white text-xs font-bold hover:opacity-90 transition shrink-0"
                      >
                        {isKr ? '드라마로 설정' : 'Als K-Drama wählen'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                {isKr
                  ? `내 K-드라마 채널 (${dramaShows.length}개)`
                  : `Deine K-Drama Serien (${dramaShows.length})`}
              </span>
              <span className="text-[11px] text-muted">
                {isKr ? '클릭하여 선택' : 'Antippen zum Auswählen'}
              </span>
            </div>

            <div className="space-y-2 max-h-[34dvh] sm:max-h-[38vh] overflow-y-auto overscroll-contain pr-1">
              {/* All K-Dramas Combined Card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  hapticTap();
                  setSelectedSub('all');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedSub('all');
                  }
                }}
                className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                  selectedSub === 'all'
                    ? 'bg-obangBlue/12 border-obangBlue text-ink shadow-sm ring-1 ring-obangBlue/40'
                    : 'bg-surface/60 hover:bg-surface border-border-card text-ink'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                      selectedSub === 'all'
                        ? 'bg-obangBlue text-white shadow-xs'
                        : 'border-2 border-border-card bg-card'
                    }`}
                  >
                    {selectedSub === 'all' && <Check className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm flex items-center gap-2">
                      <span className="truncate">
                        {isKr ? '전체 K-드라마 통합 단어장' : 'Alle K-Dramas (Gesamtmix)'}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-card border border-border-card text-muted shrink-0">
                        {dramaItems.length} {isKr ? '단어' : 'Wörter'}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted truncate mt-0.5">
                      {isKr ? '모든 등록된 드라마 단어를 믹스하여 학습합니다' : 'Mixt alle deine K-Drama Vokabeln'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLaunchShow('all');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-obangBlue text-white text-xs font-bold hover:opacity-90 flex items-center gap-1.5 transition shrink-0 shadow-xs"
                  title={isKr ? '전체 드라마 바로 시작' : 'Alle K-Dramas starten'}
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>{isKr ? '시작' : 'Start'}</span>
                </button>
              </div>

              {/* Individual Drama Shows Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dramaShows.map((show) => {
                  const isSelected = selectedSub === show.subcategory;

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
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2.5 cursor-pointer select-none ${
                        isSelected
                          ? 'bg-obangBlue/12 border-obangBlue text-ink shadow-sm ring-1 ring-obangBlue/40'
                          : 'bg-surface/60 hover:bg-surface border-border-card text-ink'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center shrink-0 transition ${
                              isSelected
                                ? 'bg-obangBlue text-white shadow-xs'
                                : 'border-2 border-border-card bg-card'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>

                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-ink break-words line-clamp-2" title={show.title}>
                              {show.title}
                            </div>
                            <div className="text-[11px] font-semibold text-obangBlue truncate">
                              CH {String(show.channelNumber).padStart(2, '0')} · K-Drama
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-card border border-border-card text-muted shrink-0">
                          {show.count} {isKr ? '단어' : 'Wörter'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border-card/50">
                        <div className="flex flex-wrap gap-1 min-w-0">
                          {show.previewWords.slice(0, 3).map((word, wIdx) => (
                            <span
                              key={`${show.id}_w_${wIdx}`}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-card/90 border border-border-card text-muted truncate max-w-[80px]"
                            >
                              {word}
                            </span>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLaunchShow(show.subcategory);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-obangBlue text-white text-[11px] font-bold hover:opacity-90 flex items-center gap-1 transition shrink-0 shadow-xs"
                        >
                          <Play className="w-2.5 h-2.5 fill-white" />
                          <span>{isKr ? '시작' : 'Start'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Optional converter for lists that were uploaded under TOPIK I/II */}
              {convertibleLists.length > 0 && onConvertSubcategoryToDrama && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setShowOtherLists((prev) => !prev);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-surface/60 hover:bg-surface border border-dashed border-border-card text-xs font-semibold text-muted hover:text-ink flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <FolderPlus className="w-3.5 h-3.5 text-obangBlue" />
                      <span>
                        {isKr
                          ? `다른 업로드 목록을 K-드라마로 추가 (${convertibleLists.length})`
                          : `Weitere hochgeladene Listen als K-Drama nutzen (${convertibleLists.length})`}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${showOtherLists ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showOtherLists && (
                    <div className="mt-2 space-y-1.5 pl-1">
                      {convertibleLists.map((list) => (
                        <div
                          key={list.subName}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-card border border-border-card"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-ink truncate">{list.subName}</div>
                            <div className="text-[10px] text-muted">
                              {list.count} {isKr ? '단어' : 'Vokabeln'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              hapticTap();
                              onConvertSubcategoryToDrama(list.subName);
                              setSelectedSub(list.subName);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-obangBlue text-white text-[11px] font-bold hover:opacity-90 transition shrink-0"
                          >
                            {isKr ? '추가 및 선택' : 'Als K-Drama aktivieren'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mode Selector & Start Action (Only shown when items exist) */}
        {hasItems && (
          <div className="pt-2.5 border-t border-border-card space-y-3">
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

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-xs font-semibold text-muted hover:text-ink transition"
              >
                {isKr ? '취소' : 'Abbrechen'}
              </button>
              <button
                type="button"
                onClick={() => handleLaunchShow(selectedSub)}
                className="px-5 py-2.5 rounded-xl bg-obangBlue hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[230px] sm:max-w-[280px]">
                  {isKr
                    ? `„${selectedSub === 'all' ? '전체 드라마' : selectedSub}“ 시작 (${selectedCount}개)`
                    : `„${selectedSub === 'all' ? 'Alle K-Dramas' : selectedSub}“ starten (${selectedCount})`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
