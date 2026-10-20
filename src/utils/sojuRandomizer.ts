import { VocabItem, VocabCategory } from '../data/vocabData';

export type GameMode = 'card' | 'listening' | 'quiz';

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

export const GAME_MODES: { id: GameMode; label: string; iconName: string; desc: string }[] = [
  {
    id: 'card',
    label: 'Karten (플래시카드)',
    iconName: 'Layers',
    desc: 'Klassisches Karteikarten-Training mit Spaced Repetition (SRS)',
  },
  {
    id: 'listening',
    label: 'Hören (듣기)',
    iconName: 'Headphones',
    desc: 'Erst koreanische Aussprache anhören, dann Bedeutung aufdecken',
  },
  {
    id: 'quiz',
    label: 'Quiz (퀴즈)',
    iconName: 'Sparkles',
    desc: 'Multiple-Choice Fragen mit thematisch passenden Antwortoptionen',
  },
];

export const CATEGORY_LABELS: Record<SojuCategory, string> = {
  all: 'Alle Kategorien',
  noun: 'Nomen (명사)',
  verb: 'Verben (동사)',
  adjective: 'Adjektive (형용사)',
  adverb: 'Adverbien (부사)',
  phrase: 'Ausdrücke (표현)',
  grammar: 'Grammatik (문법)',
  custom: 'Eigene / Markdown',
};

export const CATEGORY_LABELS_KR: Record<SojuCategory, string> = {
  all: '전체 카테고리',
  noun: '명사',
  verb: '동사',
  adjective: '형용사',
  adverb: '부사',
  phrase: '표현',
  grammar: '문법',
  custom: '내 단어 / 마크다운',
};

export const GAME_MODES_KR: Record<GameMode, string> = {
  card: '플래시카드',
  listening: '듣기',
  quiz: '퀴즈',
};

/**
 * Dynamically computes all valid (category, subcategory) combinations from the current deck.
 * Guaranteed to detect newly added subcategories from .md files or custom imports.
 */
export function getAvailableSojuCombos(items: VocabItem[], lang: 'de' | 'kr' = 'de'): SojuCombo[] {
  if (!items || items.length === 0) return [];
  const isKr = lang === 'kr';
  const labels = isKr ? CATEGORY_LABELS_KR : CATEGORY_LABELS;

  // Group items by subcategory
  const subcategoryMap = new Map<string, VocabItem[]>();
  items.forEach((item) => {
    const sub = item.sub || 'Allgemein';
    const list = subcategoryMap.get(sub) || [];
    list.push(item);
    subcategoryMap.set(sub, list);
  });

  const combos: SojuCombo[] = [];

  for (const [sub, subItems] of subcategoryMap.entries()) {
    // Determine categories present in this subcategory
    const distinctCats = Array.from(new Set(subItems.map((i) => i.cat)));
    const allCustom = subItems.every((i) => i.custom);

    // If there is a single predominant category
    if (distinctCats.length === 1) {
      const cat = distinctCats[0];
      combos.push({
        category: cat,
        categoryLabel: labels[cat] || cat,
        subcategory: sub,
        itemCount: subItems.length,
      });

      // If all items are custom, also make it available as custom category
      if (allCustom) {
        combos.push({
          category: 'custom',
          categoryLabel: labels.custom,
          subcategory: sub,
          itemCount: subItems.length,
        });
      }
    } else {
      // Mixed categories in this subcategory
      combos.push({
        category: 'all',
        categoryLabel: `${labels.all} (${distinctCats.map(c => labels[c] || c).join(', ')})`,
        subcategory: sub,
        itemCount: subItems.length,
      });

      // Also allow selecting each specific category present in this subcategory
      distinctCats.forEach((cat) => {
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
  }

  return combos;
}

/**
 * Randomly picks a game mode (Karten, Hören, Quiz) and a matching category & subcategory combo.
 */
export function generateRandomSojuSelection(items: VocabItem[], lang: 'de' | 'kr' = 'de'): SojuSelection {
  const isKr = lang === 'kr';
  const combos = getAvailableSojuCombos(items, lang);

  // Fallback if no items
  if (combos.length === 0) {
    const randomMode = GAME_MODES[Math.floor(Math.random() * GAME_MODES.length)].id;
    return {
      mode: randomMode,
      modeLabel: isKr ? GAME_MODES_KR[randomMode] : (GAME_MODES.find((m) => m.id === randomMode)?.label || 'Karten'),
      category: 'all',
      categoryLabel: isKr ? CATEGORY_LABELS_KR.all : CATEGORY_LABELS.all,
      subcategory: 'all',
      itemCount: 0,
    };
  }

  // 1. Pick random game mode: Karten, Hören, or Quiz
  const randomModeObj = GAME_MODES[Math.floor(Math.random() * GAME_MODES.length)];

  // 2. Pick random (category, subcategory) combo
  const randomCombo = combos[Math.floor(Math.random() * combos.length)];

  return {
    mode: randomModeObj.id,
    modeLabel: isKr ? GAME_MODES_KR[randomModeObj.id] : randomModeObj.label,
    category: randomCombo.category,
    categoryLabel: randomCombo.categoryLabel,
    subcategory: randomCombo.subcategory,
    itemCount: randomCombo.itemCount,
  };
}
