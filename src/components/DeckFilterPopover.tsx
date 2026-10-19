import React, { useEffect, useRef } from 'react';
import { Filter, RotateCw, Shuffle, Clock, Check, X } from 'lucide-react';
import { AppLanguage, translations } from '../utils/translations';
import { hapticTap } from '../utils/haptics';

export type CategoryFilter = 'all' | 'noun' | 'verb' | 'grammar' | 'custom';

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
  customCount: number;
  deckCount: number;
  onlyDue: boolean;
  dueCount: number;
  onToggleOnlyDue: () => void;
  krToDe: boolean;
  onToggleDirection: () => void;
  onShuffle: () => void;
  lang: AppLanguage;
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
  customCount,
  deckCount,
  onlyDue,
  dueCount,
  onToggleOnlyDue,
  krToDe,
  onToggleDirection,
  onShuffle,
  lang,
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
    grammar: t.categories.grammar,
    custom: t.categories.custom,
  };

  // Build concise summary label for the single trigger button
  const activeSummaryParts: string[] = [categoryLabels[category]];
  if (subcategory !== 'all') {
    activeSummaryParts.push(subcategory);
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
          isOpen || category !== 'all' || subcategory !== 'all' || !krToDe
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

      {/* Dropdown Popover Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl hanji-card-elevated p-4 z-40 space-y-4 animate-pop">
          <div className="flex items-center justify-between pb-2.5 border-b border-border-card">
            <span className="text-xs font-bold text-ink">
              {isKr ? '단어장 필터 및 학습 옵션' : 'Filter & Lern-Optionen'}
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

          {/* 1. Category Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted block">
              {isKr ? '품사 / 카테고리' : 'Wortart / Kategorie'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'all', label: t.categories.all },
                  { id: 'noun', label: t.categories.noun },
                  { id: 'verb', label: t.categories.verb },
                  { id: 'grammar', label: t.categories.grammar },
                  ...(customCount > 0 ? [{ id: 'custom', label: t.categories.custom }] : []),
                ] as const
              ).map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      hapticTap();
                      onSelectCategory(cat.id as CategoryFilter);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                      active
                        ? 'bg-ink text-hanji shadow-2xs'
                        : 'bg-surface text-ink hover:bg-stone-200 dark:hover:bg-stone-700/60'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Subcategory Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted block">
              {isKr ? '세부 주제' : 'Themenbereich'}
            </label>
            <select
              value={subcategory}
              onChange={(e) => {
                hapticTap();
                onSelectSubcategory(e.target.value);
              }}
              className="w-full bg-surface border border-border-card text-ink rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-celadon"
            >
              <option value="all">
                {t.subcategories.allOption(
                  availableSubcategories.length > 0 ? deckCount : 0
                )}
              </option>
              {availableSubcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub} ({getSubcategoryCount(sub)})
                </option>
              ))}
            </select>
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
                className="min-h-[40px] px-3 py-2 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-ink text-xs font-semibold transition flex items-center justify-center gap-1.5"
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
