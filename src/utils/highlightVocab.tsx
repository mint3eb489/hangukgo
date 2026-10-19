import React from 'react';

/**
 * Escapes special RegExp characters in a string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates candidate Korean stems/patterns from a vocabulary or grammar entry
 * so that conjugated verbs, nouns with particles, and grammar forms are
 * accurately highlighted inside Korean example sentences.
 */
function buildKoreanMatchPatterns(vocabKr: string): string[] {
  const raw = vocabKr.trim();
  if (!raw) return [];

  // Remove parenthetical notes like "(명사)" or "/" alternatives
  const cleaned = raw.replace(/\([^)]*\)/g, '').trim();
  const candidates = new Set<string>();

  // Split by "/" or "," if multiple forms are listed
  const parts = cleaned
    .split(/[/,~]/)
    .map((p) => p.replace(/^[-~]+/, '').trim())
    .filter(Boolean);

  // Also include the full cleaned word without leading dashes
  const baseFull = cleaned.replace(/^[-~]+/, '').trim();
  if (baseFull) parts.unshift(baseFull);

  for (const part of parts) {
    if (part.length === 0) continue;

    // 1. Exact form + optional attached Korean particles/endings (up to 3 syllables)
    candidates.add(`${escapeRegExp(part)}[가-힣]{0,3}`);

    // 2. If it's a verb/adjective ending in '다' (e.g. 먹다, 공부하다, 아름답다, 다르다)
    if (part.endsWith('다') && part.length >= 2) {
      const stem = part.slice(0, -1); // strip '다'
      if (stem.length >= 1) {
        candidates.add(`${escapeRegExp(stem)}[가-힣]{0,4}`);
      }

      // Handle '-하다' verbs where noun and 하다 might be separated or conjugated (e.g. 공부해요, 공부를 하다)
      if (part.endsWith('하다') && part.length >= 3) {
        const nounRoot = part.slice(0, -2);
        if (nounRoot.length >= 2) {
          candidates.add(`${escapeRegExp(nounRoot)}[가-힣]{0,4}`);
        }
      }
    }
  }

  // Also handle grammar patterns like -(으)면서, -아/어서, -(으)ㄹ 수 있다
  const rawWithoutParens = raw.replace(/\(으\)/g, '').replace(/^[-~]+/, '').trim();
  if (rawWithoutParens && rawWithoutParens.length >= 2) {
    candidates.add(`${escapeRegExp(rawWithoutParens)}[가-힣]{0,2}`);
  }

  return Array.from(candidates);
}

/**
 * Highlights occurrences of the target Korean vocabulary word (including conjugated
 * stems or attached particles) inside an example sentence.
 */
export function highlightKoreanVocab(
  sentence: string,
  vocabKr: string,
  tone: 'celadon' | 'dancheong' | 'obangBlue' = 'celadon'
): React.ReactNode {
  if (!sentence || !vocabKr) return sentence;

  const patterns = buildKoreanMatchPatterns(vocabKr);
  if (patterns.length === 0) return sentence;

  const toneClasses: Record<'celadon' | 'dancheong' | 'obangBlue', string> = {
    celadon:
      'text-celadon font-bold bg-celadon/12 px-1 py-0.5 rounded-md underline decoration-celadon/45 decoration-2 underline-offset-4',
    dancheong:
      'text-dancheong font-bold bg-dancheong/12 px-1 py-0.5 rounded-md underline decoration-dancheong/45 decoration-2 underline-offset-4',
    obangBlue:
      'text-obangBlue font-bold bg-obangBlue/12 px-1 py-0.5 rounded-md underline decoration-obangBlue/45 decoration-2 underline-offset-4',
  };

  try {
    const combinedRegex = new RegExp(`(${patterns.join('|')})`, 'g');
    const segments = sentence.split(combinedRegex);

    if (segments.length <= 1) {
      return sentence;
    }

    const testRegex = new RegExp(`^(?:${patterns.join('|')})$`);

    return segments.map((segment, index) => {
      if (testRegex.test(segment)) {
        return (
          <mark
            key={index}
            className={`bg-transparent ${toneClasses[tone]}`}
          >
            {segment}
          </mark>
        );
      }
      return <React.Fragment key={index}>{segment}</React.Fragment>;
    });
  } catch {
    return sentence;
  }
}
