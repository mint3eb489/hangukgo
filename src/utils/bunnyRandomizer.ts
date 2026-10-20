import { VocabItem, VocabCategory } from '../data/vocabData';
import { GameMode, GAME_MODES } from './sojuRandomizer';

export interface BunnyHopResult {
  items: VocabItem[];
  mode: GameMode;
  sourceSubcategories: string[];
  totalAvailableLists: number;
  categoryBreakdown: {
    noun: number;
    verb: number;
    grammar: number;
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generates a brand-new mixed vocabulary list by hopping wildly across
 * ALL available vocabulary lists (subcategories) and ALL categories (noun, verb, grammar).
 */
export function generateBunnyHopList(
  allItems: VocabItem[],
  targetSize = 25
): BunnyHopResult {
  const randomMode = GAME_MODES[Math.floor(Math.random() * GAME_MODES.length)].id;

  if (!allItems || allItems.length === 0) {
    return {
      items: [],
      mode: randomMode,
      sourceSubcategories: [],
      totalAvailableLists: 0,
      categoryBreakdown: { noun: 0, verb: 0, grammar: 0 },
    };
  }

  // Deduplicate pool by id
  const uniqueMap = new Map<string, VocabItem>();
  allItems.forEach((item) => {
    if (!uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  });
  const pool = shuffleArray(Array.from(uniqueMap.values()));

  // Discover all distinct subcategories (lists)
  const allSubs = Array.from(
    new Set(pool.map((i) => (i.sub && i.sub.trim() ? i.sub.trim() : 'Allgemein')))
  );

  // Organize items by category AND by subcategory so the bunny hops across every category & list
  const categories: VocabCategory[] = ['noun', 'verb', 'grammar'];
  const pickedIds = new Set<string>();
  const pickedItems: VocabItem[] = [];

  const maxCount = Math.min(targetSize, pool.length);

  // Pass 1: Ensure every present category (noun, verb, grammar) gets at least one hop right away
  for (const cat of shuffleArray(categories)) {
    if (pickedItems.length >= maxCount) break;
    const candidate = pool.find((item) => item.cat === cat && !pickedIds.has(item.id));
    if (candidate) {
      pickedIds.add(candidate.id);
      pickedItems.push(candidate);
    }
  }

  // Pass 2: Round-robin hop across all available lists (subcategories) while alternating categories
  const subBuckets = new Map<string, VocabItem[]>();
  for (const sub of allSubs) {
    const itemsInSub = shuffleArray(
      pool.filter(
        (i) =>
          (i.sub && i.sub.trim() ? i.sub.trim() : 'Allgemein') === sub &&
          !pickedIds.has(i.id)
      )
    );
    if (itemsInSub.length > 0) {
      subBuckets.set(sub, itemsInSub);
    }
  }

  let catCursor = 0;
  let madeProgress = true;
  while (pickedItems.length < maxCount && madeProgress) {
    madeProgress = false;
    const shuffledSubs = shuffleArray(Array.from(subBuckets.keys()));

    for (const sub of shuffledSubs) {
      if (pickedItems.length >= maxCount) break;
      const bucket = subBuckets.get(sub);
      if (!bucket || bucket.length === 0) continue;

      const preferredCat = categories[catCursor % categories.length];
      catCursor++;

      // Try to pick an item of preferredCat from this list first, otherwise any item from this list
      let idx = bucket.findIndex((i) => i.cat === preferredCat);
      if (idx === -1) idx = 0;

      const [chosen] = bucket.splice(idx, 1);
      if (chosen && !pickedIds.has(chosen.id)) {
        pickedIds.add(chosen.id);
        pickedItems.push(chosen);
        madeProgress = true;
      }
    }
  }

  // Final wild bunny shuffle of the assembled mixed list
  const finalItems = shuffleArray(pickedItems);

  const sourceSubcategories = Array.from(
    new Set(finalItems.map((i) => (i.sub && i.sub.trim() ? i.sub.trim() : 'Allgemein')))
  );

  const categoryBreakdown = {
    noun: finalItems.filter((i) => i.cat === 'noun').length,
    verb: finalItems.filter((i) => i.cat === 'verb').length,
    grammar: finalItems.filter((i) => i.cat === 'grammar').length,
  };

  return {
    items: finalItems,
    mode: randomMode,
    sourceSubcategories,
    totalAvailableLists: allSubs.length,
    categoryBreakdown,
  };
}
