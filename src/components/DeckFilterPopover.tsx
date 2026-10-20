import React, { useEffect, useRef } from 'react';
import { Filter, RotateCw, Shuffle, Clock, Check, X, FolderOpen } from 'lucide-react';
import { AppLanguage, translations } from '../utils/translations';
import { hapticTap } from '../utils/haptics';

export type CategoryFilter =
  | 'all'
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'phrase'
  | 'grammar'
  | 'custom';

interface DeckFilterPopoverProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  category: CategoryFilter;
  onSelectCategory: (cat: CategoryFilter) => void;
  subcategory: string;
  onSelectSubcategory: (sub: string) => void;
  availableSubcategories: string[];
  getSubcategoryCount: (sub: string) => number;
  categoryCounts?: {
    all: number;
    noun: number;
    verb: number;
    adjective: number;
    adverb: number;
    phrase: number;
    grammar: number;
    custom?: number;
  };
  customCount: number;
  deckCount: number;
  onlyDue: boolean;
  dueCount: number;
  onToggleOnlyDue: () => void;
  krToDe: boolean;
  onToggleDirection: () => void;
  onShuffle: () => void;
  lang: AppLanguage;
  isDramaMode?: boolean;
}

export const DeckFilterPopover: React.FC<DeckFilterPopoverProps> = ({
  isOpen,
  onToggleOpen,
  onClose,
  category,
  onSelectCategory,
  subcategory,
  onSelectSubcategory,
  availableSubcategories,
  getSubcategoryCount,
  categoryCounts,
  deckCount,
  onlyDue,
  dueCount,
  onToggleOnlyDue,
  krToDe,
  onToggleDirection,
  onShuffle,
  lang,
  isDramaMode = false,
}) => {
  const t = translations[lang];
  const isKr = lang === 'kr';
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  const categoryLabels: Record<CategoryFilter, string> = {
    all: t.categories.all,
    noun: t.categories.noun,
    verb: t.categories.verb,
    adjective: t.categories.adjective,
    adverb: t.categories.adverb,
    phrase: t.categories.phrase,
    grammar: t.categories.grammar,
    custom: t.categories.all,
  };

  // Build concise summary label for the single trigger button
  const activeSummaryParts: string[] = [];
  if (category !== 'all' && category !== 'custom') {
    activeSummaryParts.push(categoryLabels[category]);
  }
  if (subcategory !== 'all') {
    activeSummaryParts.push(subcategory);
  }
  if (activeSummaryParts.length === 0) {
    activeSummaryParts.push(t.categories.all);
  }
  if (!krToDe) {
    activeSummaryParts.push('DE ➔ KR');
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Single Unified Filter Trigger Button */}
      <button
        type="button"
        onClick={() => {
          hapticTap();
          onToggleOpen();
        }}
        aria-label={isKr ? '단어장 필터' : 'Vokabel-Filter'}
        className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-2 ${
          isOpen || (category !== 'all' && category !== 'custom') || subcategory !== 'all' || !krToDe
            ? 'bg-card border-celadon/60 text-ink shadow-2xs'
            : 'bg-surface/80 hover:bg-surface border-border-card text-ink'
        }`}
      >
        <Filter className="w-3.5 h-3.5 text-celadon shrink-0" />
        <span className="truncate max-w-[200px] sm:max-w-xs">
          {activeSummaryParts.join(' · ')}
        </span>
        <span className="text-muted font-mono tabular-nums">({deckCount})</span>
        <span className="text-muted text-[10px] ml-0.5">▾</span>
      </button>

      {/* Dropdown Filter Menu Panel */}
      {isOpen && (
        <div
          className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl hanji-card-elevated p-4 z-40 space-y-4 animate-pop"
          role="menu"
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-border-card">
            <span className="text-xs font-bold text-ink">
              {isKr ? '카테고리 및 주제 선택' : 'Kategorie & Thema wählen'}
            </span>
            <button
              type="button"
              onClick={() => {
                hapticTap();
                onClose();
              }}
              className="p-1 rounded-lg text-muted hover:text-ink hover:bg-surface transition"
              aria-label={isKr ? '닫기' : 'Schließen'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Grammatical Category (Wortart) Menu */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-muted block">
                {isKr ? '품사 (Wortart)' : 'Kategorie (Wortart)'}
              </label>
              {isDramaMode && (
                <span className="text-[10px] text-muted font-medium">
                  {isKr ? '드라마 모드 비활성화' : 'im Drama-Modus inaktiv'}
                </span>
              )}
            </div>

            {isDramaMode ? (
              <div className="p-2.5 rounded-xl bg-obangBlue/10 border border-obangBlue/25 text-xs text-obangBlue font-medium flex items-center justify-between">
                <span>{isKr ? '🎬 K-드라마 전용 어휘' : '🎬 K-Drama Serien-Mix'}</span>
                <span className="font-mono font-bold">{categoryCounts?.all || 0} {isKr ? '단어' : 'Vokabeln'}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'all', label: t.categories.all, count: categoryCounts?.all },
                    { id: 'noun', label: t.categories.noun, count: categoryCounts?.noun },
                    { id: 'verb', label: t.categories.verb, count: categoryCounts?.verb },
                    { id: 'adjective', label: t.categories.adjective, count: categoryCounts?.adjective },
                    { id: 'adverb', label: t.categories.adverb, count: categoryCounts?.adverb },
                    { id: 'phrase', label: t.categories.phrase, count: categoryCounts?.phrase },
                    { id: 'grammar', label: t.categories.grammar, count: categoryCounts?.grammar },
                  ] as const
                ).map((cat) => {
                  const active =
                    category === cat.id || (cat.id === 'all' && category === 'custom');
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        hapticTap();
                        onSelectCategory(cat.id as CategoryFilter);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between gap-1.5 border ${
                        active
                          ? 'bg-ink text-hanji border-ink shadow-2xs'
                          : 'bg-surface text-ink border-border-card hover:bg-stone-200 dark:hover:bg-stone-700/60'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{cat.label}</span>
                      </span>
                      {typeof cat.count === 'number' && (
                        <span className="opacity-75 font-mono text-[10px] shrink-0">
                          {cat.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Subcategory / Topic Menu List */}
          <div className="space-y-1.5 pt-2 border-t border-border-card">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-muted flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-celadon" />
                <span>
                  {isDramaMode
                    ? isKr
                      ? 'K-드라마 시리즈'
                      : 'K-Drama Serie / Liste'
                    : isKr
                    ? '세부 주제 (Unterkategorie)'
                    : 'Unterkategorie'}
                </span>
              </label>
              {subcategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    hapticTap();
                    onSelectSubcategory('all');
                  }}
                  className="text-[11px] text-celadon hover:underline font-semibold"
                >
                  {isKr ? '초기화' : 'Zurücksetzen'}
                </button>
              )}
            </div>

            {availableSubcategories.length > 0 ? (
              <div className="max-h-52 overflow-y-auto rounded-xl border border-border-card bg-surface/60 divide-y divide-border-card/60">
                <button
                  type="button"
                  onClick={() => {
                    hapticTap();
                    onSelectSubcategory('all');
                    onClose();
                  }}
                  className={`w-full px-3 py-2.5 text-xs font-semibold transition flex items-center justify-between gap-2 text-left ${
                    subcategory === 'all'
                      ? 'bg-celadon/15 text-celadon font-bold'
                      : 'text-ink hover:bg-surface'
                  }`}
                >
                  <span className="truncate">
                    {isKr ? '전체 주제 (Alle Unterkategorien)' : 'Alle Unterkategorien'}
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[11px] text-muted">
                      {categoryCounts ? categoryCounts.all : deckCount}
                    </span>
                    {subcategory === 'all' && <Check className="w-3.5 h-3.5 text-celadon" />}
                  </span>
                </button>

                {availableSubcategories.map((sub) => {
                  const active = subcategory === sub;
                  const count = getSubcategoryCount(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => {
                        hapticTap();
                        onSelectSubcategory(sub);
                        onClose();
                      }}
                      className={`w-full px-3 py-2.5 text-xs font-semibold transition flex items-center justify-between gap-2 text-left ${
                        active
                          ? 'bg-celadon/15 text-celadon font-bold'
                          : 'text-ink hover:bg-surface'
                      }`}
                    >
                      <span className="truncate">{sub}</span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-[11px] text-muted">{count}</span>
                        {active && <Check className="w-3.5 h-3.5 text-celadon" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted italic">
                {isKr
                  ? '아직 등록된 세부 주제가 없습니다.'
                  : 'Noch keine Unterkategorien vorhanden.'}
              </p>
            )}
          </div>

          {/* 3. Deck & Study Options (Direction, Due Only, Shuffle) */}
          <div className="pt-2 border-t border-border-card space-y-2">
            <label className="text-[11px] font-semibold text-muted block">
              {isKr ? '학습 설정' : 'Lern-Einstellungen'}
            </label>

            <div className="grid grid-cols-2 gap-2">
              {/* Direction Toggle */}
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  onToggleDirection();
                }}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-ink text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5 text-celadon" />
                <span>{krToDe ? t.actions.directionKrDe : t.actions.directionDeKr}</span>
              </button>

              {/* Shuffle Action */}
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  onShuffle();
                  onClose();
                }}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-ink text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Shuffle className="w-3.5 h-3.5 text-obangBlue" />
                <span>{t.actions.shuffle}</span>
              </button>
            </div>

            {/* Due Today Filter Toggle inside Popover */}
            <button
              type="button"
              onClick={() => {
                hapticTap();
                onToggleOnlyDue();
              }}
              className={`w-full min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold transition flex items-center justify-between ${
                onlyDue
                  ? 'bg-ochre/15 border-ochre text-ochre'
                  : 'bg-surface border-border-card text-ink hover:bg-stone-200 dark:hover:bg-stone-700/60'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{t.actions.dueOnly}</span>
              </span>
              <span className="font-mono tabular-nums font-bold">
                {dueCount} {t.stats.due}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
