import { VocabItem, VocabCategory } from '../data/vocabData';

export type GameMode = 'card' | 'match' | 'quiz';

export type SojuCategory = 'all' | VocabCategory | 'custom';

export interface SojuCombo {
  category: SojuCategory;
  categoryLabel: string;
  subcategory: string;
  itemCount: number;
}

export interface SojuSelection {
  mode: GameMode;
  modeLabel: string;
  category: SojuCategory;
  categoryLabel: string;
  subcategory: string;
  itemCount: number;
}

export const SOJU_CORE_CATEGORIES: VocabCategory[] = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'phrase',
  'grammar',
];

export const GAME_MODES: { id: GameMode; label: string; iconName: string; desc: string }[] = [
  {
    id: 'card',
    label: 'Karten',
    iconName: 'Layers',
    desc: 'Klassisches Karteikarten-Training mit Spaced Repetition (SRS)',
  },
  {
    id: 'match',
    label: 'Match',
    iconName: 'Zap',
    desc: 'Koreanisch ⇄ Deutsch 짝맞추기: Schnelligkeit, Präzision & Wortpaare',
  },
  {
    id: 'quiz',
    label: 'Quiz',
    iconName: 'Sparkles',
    desc: 'Multiple-Choice Fragen mit thematisch passenden Antwortoptionen',
  },
];

export const CATEGORY_LABELS: Record<SojuCategory, string> = {
  all: 'Alle Kategorien',
  noun: 'Nomen',
  verb: 'Verben',
  adjective: 'Adjektive',
  adverb: 'Adverbien',
  phrase: 'Ausdrücke',
  grammar: 'Grammatik',
  custom: 'Eigene',
};

export const CATEGORY_LABELS_KR: Record<SojuCategory, string> = {
  all: '전체 카테고리',
  noun: '명사',
  verb: '동사',
  adjective: '형용사',
  adverb: '부사',
  phrase: '표현',
  grammar: '문법',
  custom: '내 단어',
};

export const GAME_MODES_KR: Record<GameMode, string> = {
  card: '플래시카드',
  match: '짝맞추기',
  quiz: '퀴즈',
};

/**
 * Dynamically computes all valid (category, subcategory) combinations from the current deck.
 * Guaranteed to detect newly added subcategories from .md files or custom imports.
 * Constrained strictly to the 6 grammatical categories: Nomen, Verben, Adjektive, Adverbien, Ausdrücke, Grammatik.
 */
export function getAvailableSojuCombos(items: VocabItem[], lang: 'de' | 'kr' = 'de'): SojuCombo[] {
  if (!items || items.length === 0) return [];
  const isKr = lang === 'kr';
  const labels = isKr ? CATEGORY_LABELS_KR : CATEGORY_LABELS;

  // Group items by subcategory
  const subcategoryMap = new Map<string, VocabItem[]>();
  items.forEach((item) => {
    const sub = item.sub?.trim() || 'Allgemein';
    const list = subcategoryMap.get(sub) || [];
    list.push(item);
    subcategoryMap.set(sub, list);
  });

  const combos: SojuCombo[] = [];

  for (const [sub, subItems] of subcategoryMap.entries()) {
    // Only search between the requested categories: Nomen, Verben, Adjektive, Adverbien, Ausdrücke, Grammatik
    SOJU_CORE_CATEGORIES.forEach((cat) => {
      const count = subItems.filter((i) => i.cat === cat).length;
      if (count > 0) {
        combos.push({
          category: cat,
          categoryLabel: labels[cat] || cat,
          subcategory: sub,
          itemCount: count,
        });
      }
    });
  }

  // Fallback: If no subcategory has these (e.g. general items), group globally by the 6 categories
  if (combos.length === 0) {
    SOJU_CORE_CATEGORIES.forEach((cat) => {
      const count = items.filter((i) => i.cat === cat).length;
      if (count > 0) {
        combos.push({
          category: cat,
          categoryLabel: labels[cat] || cat,
          subcategory: 'Allgemein',
          itemCount: count,
        });
      }
    });
  }

  return combos;
}

/**
 * Randomly picks a game mode (Karten, Match, Quiz) and a category (Nomen, Verben, Adjektive, etc.).
 * Constrained strictly to mode and category without subcategory (subcategory is always 'all').
 */
export function generateRandomSojuSelection(items: VocabItem[], lang: 'de' | 'kr' = 'de'): SojuSelection {
  const isKr = lang === 'kr';
  const labels = isKr ? CATEGORY_LABELS_KR : CATEGORY_LABELS;

  // Filter core categories that have items in the deck
  const activeCategories = SOJU_CORE_CATEGORIES.filter((cat) =>
    items.some((i) => i.cat === cat)
  );

  const availableCats = activeCategories.length > 0 ? activeCategories : SOJU_CORE_CATEGORIES;

  // 1. Pick random game mode: Karten (card), Match (match), or Quiz (quiz)
  const randomModeObj = GAME_MODES[Math.floor(Math.random() * GAME_MODES.length)];

  // 2. Pick random category from the available core categories
  const randomCat = availableCats[Math.floor(Math.random() * availableCats.length)];
  const catCount = items.filter((i) => i.cat === randomCat).length;

  return {
    mode: randomModeObj.id,
    modeLabel: isKr ? GAME_MODES_KR[randomModeObj.id] : randomModeObj.label,
    category: randomCat,
    categoryLabel: labels[randomCat] || randomCat,
    subcategory: 'all', // Keine Unterkategorie
    itemCount: catCount,
  };
}
