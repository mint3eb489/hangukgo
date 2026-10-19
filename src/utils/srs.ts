export interface SrsRecord {
  level: number; // 0 = New/Unlearned, 1 = 1 day, 2 = 3 days, 3 = 7 days, 4 = 14 days, 5 = 30 days (Mastered)
  nextReviewDate: number; // Unix timestamp in ms
  lastReviewedDate?: number; // Unix timestamp in ms
  reps: number;
  lapses: number;
}

export type SrsMap = Record<string, SrsRecord>;

// Intervals in milliseconds:
// Level 1: 1 day
// Level 2: 3 days
// Level 3: 7 days
// Level 4: 14 days
// Level 5: 30 days
export const SRS_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30] as const;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Normalizes a timestamp to the end of that day (23:59:59) for fair daily scheduling
 */
export function getEndOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/**
 * Returns default or migrated record
 */
export function getSrsRecord(
  id: string,
  srsMap: SrsMap,
  legacyProgressMap?: Record<string, string>
): SrsRecord {
  if (srsMap[id]) {
    return srsMap[id];
  }

  // Migrate legacy progress if present
  if (legacyProgressMap && legacyProgressMap[id]) {
    const legacy = legacyProgressMap[id];
    if (legacy === 'learned') {
      return {
        level: 1,
        nextReviewDate: getEndOfDay(Date.now() + ONE_DAY_MS),
        lastReviewedDate: Date.now(),
        reps: 1,
        lapses: 0,
      };
    } else if (legacy === 'review') {
      return {
        level: 0,
        nextReviewDate: Date.now() - 1000, // Due immediately
        lastReviewedDate: Date.now(),
        reps: 1,
        lapses: 1,
      };
    }
  }

  return {
    level: 0,
    nextReviewDate: Date.now() - 1000, // Due immediately
    reps: 0,
    lapses: 0,
  };
}

/**
 * Checks whether the card is due for review today
 */
export function isCardDue(record: SrsRecord): boolean {
  if (record.level === 0) return true;
  return Date.now() >= record.nextReviewDate;
}

/**
 * Advances the SRS level upon successful learning / answer
 */
export function advanceSrs(record: SrsRecord): SrsRecord {
  const nextLevel = Math.min(record.level + 1, 5);
  const intervalDays = SRS_INTERVALS_DAYS[nextLevel];
  const nextReviewDate = getEndOfDay(Date.now() + intervalDays * ONE_DAY_MS);

  return {
    level: nextLevel,
    nextReviewDate,
    lastReviewedDate: Date.now(),
    reps: (record.reps || 0) + 1,
    lapses: record.lapses || 0,
  };
}

/**
 * Resets / penalizes the SRS level upon failure / 'review'
 */
export function failSrs(record: SrsRecord): SrsRecord {
  return {
    level: 1, // Drops back to level 1 for quick 1-day recovery
    nextReviewDate: Date.now() - 1000, // Due immediately for practice
    lastReviewedDate: Date.now(),
    reps: (record.reps || 0) + 1,
    lapses: (record.lapses || 0) + 1,
  };
}

/**
 * Human-readable label for SRS stage
 */
export function getSrsStageLabel(level: number, lang: 'de' | 'kr' = 'de'): {
  name: string;
  interval: string;
  colorClass: string;
} {
  const isKr = lang === 'kr';
  switch (level) {
    case 5:
      return {
        name: isKr ? '5단계 (마스터)' : 'Stufe 5 (Gemeistert)',
        interval: isKr ? '30일' : '30 Tage',
        colorClass: 'bg-celadon text-white',
      };
    case 4:
      return {
        name: isKr ? '4단계' : 'Stufe 4',
        interval: isKr ? '14일' : '14 Tage',
        colorClass: 'bg-celadon/80 text-white',
      };
    case 3:
      return {
        name: isKr ? '3단계' : 'Stufe 3',
        interval: isKr ? '7일' : '7 Tage',
        colorClass: 'bg-ochre text-white',
      };
    case 2:
      return {
        name: isKr ? '2단계' : 'Stufe 2',
        interval: isKr ? '3일' : '3 Tage',
        colorClass: 'bg-obangBlue text-white',
      };
    case 1:
      return {
        name: isKr ? '1단계' : 'Stufe 1',
        interval: isKr ? '1일' : '1 Tag',
        colorClass: 'bg-dancheong/80 text-white',
      };
    default:
      return {
        name: isKr ? '미학습 (신규)' : 'Neu / Ungelernt',
        interval: isKr ? '즉시' : 'Sofort',
        colorClass: 'bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-300',
      };
  }
}

/**
 * Format relative due string
 */
export function formatDueText(nextReviewDate: number, level: number, lang: 'de' | 'kr' = 'de'): string {
  const isKr = lang === 'kr';
  if (level === 0) return isKr ? '신규' : 'Neu';

  const diffMs = nextReviewDate - Date.now();
  if (diffMs <= 0) {
    return isKr ? '오늘 복습' : 'Heute fällig';
  }

  const days = Math.ceil(diffMs / ONE_DAY_MS);
  if (days <= 1) {
    return isKr ? '내일 복습' : 'Morgen fällig';
  }
  return isKr ? `${days}일 후` : `in ${days} Tagen`;
}
