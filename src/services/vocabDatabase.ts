import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { VocabItem, TopikLevel, VocabCategory } from '../data/vocabData';
import { SrsMap, SrsRecord } from '../utils/srs';

export interface VocabFileRecord {
  id: string;
  userId: string;
  fileName: string;
  content: string;
  vocabCount: number;
  topikLevel: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Robust CSV parser that handles:
 * - Commas, semicolons, or tabs
 * - Quotes around values
 * - Headers (optional with kr, de, en, category, subcategory, examples)
 * - German & English translations
/**
 * Checks if a raw string explicitly represents a grammatical part of speech (Wortart)
 */
export function isPartOfSpeechValue(raw?: string): VocabCategory | null {
  if (!raw) return null;
  const c = raw.toLowerCase().trim();
  if (
    c === 'verb' ||
    c === 'verben' ||
    c === 'v' ||
    c === 'adjektiv' ||
    c === 'adjektive' ||
    c === 'adjective' ||
    c === 'adj' ||
    c === '동사' ||
    c === '형용사' ||
    c === '동사/형용사'
  ) {
    return 'verb';
  }
  if (
    c === 'grammar' ||
    c === 'grammatik' ||
    c === 'gramm' ||
    c === 'partikel' ||
    c === 'particle' ||
    c === 'endung' ||
    c === 'ending' ||
    c === '문법' ||
    c === '조사' ||
    c === '어미'
  ) {
    return 'grammar';
  }
  if (
    c === 'noun' ||
    c === 'nouns' ||
    c === 'nomen' ||
    c === 'substantiv' ||
    c === 'substantive' ||
    c === 'n' ||
    c === 'adverb' ||
    c === '부사' ||
    c === '명사' ||
    c === '표현' ||
    c === 'ausdruck' ||
    c === 'phrase'
  ) {
    return 'noun';
  }
  return null;
}

/**
 * Helper to normalize category
 */
export function normalizeCategory(rawCat?: string, fallback: VocabCategory = 'noun'): VocabCategory {
  if (!rawCat) return fallback;
  const exact = isPartOfSpeechValue(rawCat);
  if (exact) return exact;
  const c = rawCat.toLowerCase().trim();
  if (c.includes('verb') || c.includes('adjektiv') || c.includes('동사') || c.includes('형용사')) return 'verb';
  if (c.includes('gramm') || c.includes('문법') || c.includes('partikel') || c.includes('조사')) return 'grammar';
  if (c.includes('noun') || c.includes('nomen') || c.includes('substantiv') || c.includes('명사')) return 'noun';
  return fallback;
}

/**
 * Smartly infers the Wortart (noun | verb | grammar) from the Korean word and translations
 * when no explicit Wortart column is provided in the file.
 */
export function inferWordCategory(
  kr: string,
  de: string,
  en?: string,
  fallback: VocabCategory = 'noun'
): VocabCategory {
  const cleanKr = kr.trim();
  if (cleanKr.startsWith('-') || cleanKr.startsWith('~') || cleanKr.startsWith('-(으)')) {
    return 'grammar';
  }
  // Typical Korean verb/adjective dictionary endings
  if (
    cleanKr.length >= 2 &&
    (cleanKr.endsWith('하다') ||
      cleanKr.endsWith('되다') ||
      cleanKr.endsWith('시키다') ||
      cleanKr.endsWith('스럽다') ||
      cleanKr.endsWith('롭다') ||
      cleanKr.endsWith('지다'))
  ) {
    return 'verb';
  }
  // Other dictionary verbs ending in 다 (excluding common nouns like 바다, 수다, 마다)
  const nonVerbDaNouns = new Set(['바다', '수다', '마다', '바리스타', '캐나다', '우간다', '베란다', '캘린더', '사이다']);
  if (cleanKr.length >= 2 && cleanKr.endsWith('다') && !cleanKr.includes(' ') && !nonVerbDaNouns.has(cleanKr)) {
    const cleanDe = de.trim();
    const cleanEn = (en || '').trim().toLowerCase();
    // In German, nouns start with an uppercase letter (unless preceded by article), whereas verbs/adjectives start lowercase
    const deFirstChar = cleanDe.charAt(0);
    const isDeLowercase = deFirstChar !== '' && deFirstChar === deFirstChar.toLowerCase() && deFirstChar !== deFirstChar.toUpperCase();
    if (isDeLowercase || cleanDe.toLowerCase().startsWith('sich ') || cleanEn.startsWith('to ') || cleanEn.startsWith('be ')) {
      return 'verb';
    }
  }
  return fallback;
}

/**
 * Robust CSV & Markdown parser that supports:
 * - Markdown tables (| Korean | German | English | Kategorie | Unterkategorie | ...)
 * - Markdown headings (# Thema, ## Unterkategorie, ### Lektion)
 * - Markdown bullet points (- **약속**: Verabredung (appointment))
 * - Standard CSV (comma, semicolon, tab, pipe, colon)
 * - German & English translations (either, or both)
 * - Automatic detection of Subcategories (Themenbereiche) and Wortarten (Nomen, Verben, Grammatik)
 */
export function parseVocabCsv(
  csvOrMdText: string,
  defaultTopikLevel: TopikLevel = 'TOPIK I',
  defaultSubcategory: string = '',
  defaultCategory: VocabCategory = 'noun'
): VocabItem[] {
  const trimmed = csvOrMdText.trim();
  if (!trimmed) return [];

  const fallbackSub = defaultSubcategory.trim() || 'Allgemein';

  // 1. JSON Array Support
  if (trimmed.startsWith('[') || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      const parsed = JSON.parse(trimmed);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const results: VocabItem[] = [];
      arr.forEach((obj, idx) => {
        const kr = String(obj.kr || obj.korean || obj.hangul || '').trim();
        const de = String(obj.de || obj.german || obj.deutsch || '').trim();
        const en = obj.en || obj.english || obj.englisch ? String(obj.en || obj.english || obj.englisch).trim() : undefined;
        if (!kr || (!de && !en)) return;

        const rawCat = String(obj.cat || obj.category || obj.wortart || obj.type || '').trim();
        const rawSub = String(obj.sub || obj.subcategory || obj.unterkategorie || obj.topic || obj.thema || obj.lesson || obj.lektion || '').trim();

        const posCat = isPartOfSpeechValue(rawCat);
        const finalSub = rawSub || (!posCat && rawCat ? rawCat : fallbackSub);
        const finalCat = posCat || inferWordCategory(kr, de || (en || ''), en, defaultCategory);

        results.push({
          id: `c_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
          level: obj.level === 'TOPIK II' || obj.level === 'TOPIK 2' ? 'TOPIK II' : obj.level === 'TOPIK I' || obj.level === 'TOPIK 1' ? 'TOPIK I' : defaultTopikLevel,
          cat: finalCat,
          sub: finalSub,
          kr,
          de: de || (en ? en : ''),
          en: en || undefined,
          hanja: obj.hanja ? String(obj.hanja).trim() : undefined,
          exKr: obj.exKr || obj.exampleKorean ? String(obj.exKr || obj.exampleKorean).trim() : undefined,
          exDe: obj.exDe || obj.exampleGerman ? String(obj.exDe || obj.exampleGerman).trim() : undefined,
          exEn: obj.exEn || obj.exampleEnglish ? String(obj.exEn || obj.exampleEnglish).trim() : undefined,
          custom: true,
        });
      });
      if (results.length > 0) return results;
    } catch {
      // Continue to line parser
    }
  }

  // 2. Line-based processing
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('```'));

  if (lines.length === 0) return [];

  const isTableSeparator = (l: string) => /^\|?[\s\-:|]+\|[\s\-:|]+\|?$/.test(l);
  const cleanHeader = (h: string) =>
    h
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .replace(/^["']|["']$/g, '')
      .replace(/^\uFEFF/, '')
      .trim()
      .toLowerCase();

  const headerMap: { [col: string]: number } = {};
  let activeSub = fallbackSub;
  let activeCat: VocabCategory = defaultCategory;
  let activeLevel: TopikLevel = defaultTopikLevel;

  const tryParseHeaderLine = (line: string): boolean => {
    const low = line.toLowerCase();
    const isCandidate =
      low.includes('korean') ||
      low.includes('hangul') ||
      low.includes('deutsch') ||
      low.includes('german') ||
      low.includes('english') ||
      low.includes('englisch') ||
      low.includes('bedeutung') ||
      low.includes('meaning') ||
      low.includes('unterkategorie') ||
      low.includes('subcategory') ||
      low.includes('kategorie') ||
      low.includes('category') ||
      low.includes('thema') ||
      low.includes('topic') ||
      low.includes('한국어') ||
      low.includes('단어') ||
      low.startsWith('kr;') ||
      low.startsWith('kr,') ||
      low.startsWith('kr|') ||
      low.startsWith('kr\t');

    if (!isCandidate) return false;

    let headerCols: string[] = [];
    if (line.includes('|')) {
      headerCols = line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(cleanHeader);
    } else if (line.includes('\t')) {
      headerCols = line.split('\t').map(cleanHeader);
    } else if (line.includes(';')) {
      headerCols = line.split(';').map(cleanHeader);
    } else if (line.includes(',')) {
      headerCols = line.split(',').map(cleanHeader);
    }

    if (headerCols.length < 2) return false;

    const tempMap: { [col: string]: number } = {};
    headerCols.forEach((h, idx) => {
      if (!h) return;
      if (
        h === 'kr' ||
        h.includes('korean') ||
        h.includes('hangul') ||
        h.includes('한국어') ||
        h.includes('단어') ||
        h.includes('표현') ||
        h === 'wort'
      ) {
        if (tempMap['kr'] === undefined) tempMap['kr'] = idx;
      } else if (
        h.includes('exkr') ||
        (h.includes('beispiel') && (h.includes('kr') || h.includes('kor'))) ||
        (h.includes('example') && (h.includes('kr') || h.includes('kor'))) ||
        h.includes('예문')
      ) {
        tempMap['exKr'] = idx;
      } else if (
        h.includes('exde') ||
        (h.includes('beispiel') && (h.includes('de') || h.includes('ger') || h.includes('dt'))) ||
        h === 'beispielsatz (de)' ||
        h === 'beispiel (de)'
      ) {
        tempMap['exDe'] = idx;
      } else if (
        h.includes('exen') ||
        (h.includes('beispiel') && (h.includes('en') || h.includes('eng'))) ||
        (h.includes('example') && (h.includes('en') || h.includes('sentence')))
      ) {
        tempMap['exEn'] = idx;
      } else if (
        h === 'de' ||
        h.includes('deutsch') ||
        h.includes('german') ||
        h.includes('독일어') ||
        h.includes('bedeutung') ||
        h.includes('übersetzung')
      ) {
        if (tempMap['de'] === undefined) tempMap['de'] = idx;
      } else if (
        h === 'en' ||
        h.includes('english') ||
        h.includes('englisch') ||
        h.includes('영어') ||
        h.includes('meaning')
      ) {
        if (tempMap['en'] === undefined) tempMap['en'] = idx;
      } else if (
        // IMPORTANT: Check subcategory BEFORE category so "Unterkategorie" and "Subcategory" match 'sub'!
        h.includes('unterkategorie') ||
        h.includes('subcategory') ||
        h.includes('sub-category') ||
        h.includes('sub_category') ||
        h === 'sub' ||
        h.includes('thema') ||
        h.includes('themenbereich') ||
        h.includes('topic') ||
        h.includes('lektion') ||
        h.includes('lesson') ||
        h.includes('kapitel') ||
        h.includes('chapter') ||
        h.includes('unit') ||
        h.includes('gruppe') ||
        h.includes('group') ||
        h.includes('rubrik') ||
        h.includes('section') ||
        h.includes('deck') ||
        h.includes('tag') ||
        h.includes('세부') ||
        h.includes('주제') ||
        h.includes('단원') ||
        h.includes('분류')
      ) {
        tempMap['sub'] = idx;
      } else if (
        h.includes('wortart') ||
        h.includes('part of speech') ||
        h === 'pos' ||
        h.includes('품사') ||
        h.includes('kategorie') ||
        h.includes('category') ||
        h === 'cat' ||
        h === 'type' ||
        h === 'typ'
      ) {
        tempMap['cat'] = idx;
      } else if (h.includes('level') || h.includes('topik') || h.includes('stufe') || h.includes('급수')) {
        tempMap['level'] = idx;
      } else if (h.includes('hanja') || h.includes('한자')) {
        tempMap['hanja'] = idx;
      }
    });

    if (tempMap['kr'] !== undefined && (tempMap['de'] !== undefined || tempMap['en'] !== undefined)) {
      Object.assign(headerMap, tempMap);
      return true;
    }
    return false;
  };

  const results: VocabItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].replace(/^\uFEFF/, '').trim();
    if (!rawLine || isTableSeparator(rawLine)) continue;

    // Handle markdown topic headings (# Lektion 1, ## Unterkategorie, ### Verben)
    if (rawLine.startsWith('#')) {
      const heading = rawLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      if (heading) {
        const low = heading.toLowerCase();
        if (low.includes('topik 1') || low.includes('topik i') || low.includes('topik1')) {
          activeLevel = 'TOPIK I';
        } else if (low.includes('topik 2') || low.includes('topik ii') || low.includes('topik2')) {
          activeLevel = 'TOPIK II';
        }

        const directPos = isPartOfSpeechValue(heading);
        if (directPos) {
          // Heading is purely a Wortart like "## Nomen" or "## Verben" -> keep activeSub!
          activeCat = directPos;
        } else {
          if (low.includes('verb') || low.includes('adjektiv') || low.includes('동사') || low.includes('형용사')) {
            activeCat = 'verb';
          } else if (low.includes('gramm') || low.includes('문법')) {
            activeCat = 'grammar';
          } else if (low.includes('nomen') || low.includes('substantiv') || low.includes('noun') || low.includes('명사')) {
            activeCat = 'noun';
          }

          // Clean heading to use as subcategory (remove pure level/POS suffixes if combined)
          const cleanedTopic = heading
            .replace(/\b(topik\s*(i|ii|1|2))\b/gi, '')
            .replace(/^[\s\-:–—|]+|[\s\-:–—|]+$/g, '')
            .trim();

          if (cleanedTopic && !isPartOfSpeechValue(cleanedTopic)) {
            activeSub = cleanedTopic;
          }
        }
      }
      continue;
    }

    // Check if this line is a table/CSV header row (works even after Markdown # headings!)
    if (tryParseHeaderLine(rawLine)) {
      continue;
    }

    // Strip bullet points (- or * or 1.) unless it's a Korean grammar pattern like "-고 싶다"
    let cleanLine = rawLine;
    if (!/^-[가-힣(]/.test(cleanLine)) {
      cleanLine = cleanLine.replace(/^(\*|\+|-|\d+[.)])\s+/, '').trim();
    }

    // Split line into columns
    let cols: string[] = [];
    if (cleanLine.includes('|')) {
      cols = cleanLine
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.replace(/\*\*/g, '').replace(/__/g, '').trim());
    } else if (cleanLine.includes('\t')) {
      cols = cleanLine.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    } else if (cleanLine.includes(';')) {
      cols = cleanLine.split(';').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    } else if (cleanLine.includes(',')) {
      // Proper CSV split respecting quotes
      const csvCols: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let charIdx = 0; charIdx < cleanLine.length; charIdx++) {
        const ch = cleanLine[charIdx];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          csvCols.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += ch;
        }
      }
      csvCols.push(current.trim().replace(/^["']|["']$/g, ''));
      cols = csvCols;
    } else if (cleanLine.includes(' - ')) {
      cols = cleanLine.split(' - ').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    } else if (cleanLine.includes(' – ')) {
      cols = cleanLine.split(' – ').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    } else if (cleanLine.includes(' : ') || cleanLine.includes(':')) {
      const colonSplit = cleanLine.split(/:(.+)/);
      if (colonSplit.length >= 2) {
        cols = [colonSplit[0].replace(/\*\*/g, '').trim(), colonSplit[1].trim()];
      }
    }

    if (cols.length < 2) continue;

    let kr = '';
    let de = '';
    let en: string | undefined = undefined;
    let catStr = '';
    let subStr = '';
    let levelStr = '';
    let exKr = '';
    let exDe = '';
    let exEn = '';
    let hanja: string | undefined = undefined;

    // A. Use mapped header positions if available
    if (headerMap['kr'] !== undefined && (headerMap['de'] !== undefined || headerMap['en'] !== undefined)) {
      kr = cols[headerMap['kr']]?.replace(/\*\*/g, '').trim() || '';
      if (headerMap['de'] !== undefined) de = cols[headerMap['de']]?.trim() || '';
      if (headerMap['en'] !== undefined) en = cols[headerMap['en']]?.trim() || undefined;
      if (headerMap['cat'] !== undefined) catStr = cols[headerMap['cat']]?.trim() || '';
      if (headerMap['sub'] !== undefined) subStr = cols[headerMap['sub']]?.trim() || '';
      if (headerMap['level'] !== undefined) levelStr = cols[headerMap['level']]?.trim() || '';
      if (headerMap['exKr'] !== undefined) exKr = cols[headerMap['exKr']]?.trim() || '';
      if (headerMap['exDe'] !== undefined) exDe = cols[headerMap['exDe']]?.trim() || '';
      if (headerMap['exEn'] !== undefined) exEn = cols[headerMap['exEn']]?.trim() || '';
      if (headerMap['hanja'] !== undefined) hanja = cols[headerMap['hanja']]?.trim() || undefined;

      if (!de && en) de = en;
    } else {
      // B. Smart positional heuristic when no header row exists
      let krIndex = cols.findIndex((c) => /[가-힣]/.test(c) || c.startsWith('-'));
      if (krIndex === -1) krIndex = 0;
      kr = cols[krIndex]?.replace(/\*\*/g, '').trim();

      const otherCols = cols.filter((_, idx) => idx !== krIndex).map((c) => c.trim());

      if (otherCols.length === 1) {
        const text = otherCols[0];
        const parenMatch = text.match(/^([^(]+)\s*\(([^)]+)\)$/);
        if (parenMatch) {
          de = parenMatch[1].trim();
          en = parenMatch[2].trim();
        } else {
          de = text;
        }
      } else if (otherCols.length >= 2) {
        // Inspect remaining columns intelligently
        const remaining = [...otherCols];

        // Check if first remaining column is a POS (Wortart)
        if (isPartOfSpeechValue(remaining[0]) && remaining.length >= 2) {
          catStr = remaining.shift()!;
        }

        de = remaining.shift() || '';

        // Walk through remaining columns to classify English, Wortart, Subcategory, and Examples
        for (let rIdx = 0; rIdx < remaining.length; rIdx++) {
          const val = remaining[rIdx];
          if (!val) continue;

          // 1. Check if it's a Korean example sentence
          if (/[가-힣]/.test(val)) {
            if (!exKr) {
              exKr = val;
              if (remaining[rIdx + 1] && !/[가-힣]/.test(remaining[rIdx + 1])) {
                exDe = remaining[rIdx + 1];
                rIdx++;
              }
              if (remaining[rIdx + 1] && !/[가-힣]/.test(remaining[rIdx + 1])) {
                exEn = remaining[rIdx + 1];
                rIdx++;
              }
            }
            continue;
          }

          // 2. Check if it's explicitly a Wortart (noun/verb/grammar)
          if (isPartOfSpeechValue(val)) {
            catStr = val;
            continue;
          }

          // 3. Check if it's a TOPIK Level
          if (/^topik\s*(i|ii|1|2)$/i.test(val)) {
            levelStr = val;
            continue;
          }

          // 4. Long text or sentence with punctuation -> example translation
          const isSentence = val.length > 40 || /[.?!]$/.test(val);
          if (isSentence) {
            if (!exDe) exDe = val;
            else if (!exEn) exEn = val;
            continue;
          }

          // 5. Short text: assign to English first (if not set), or Subcategory if English is already set!
          if (!en) {
            en = val;
          } else if (!subStr) {
            subStr = val;
          }
        }
      }
    }

    if (!kr || (!de && !en)) continue;
    if (!de && en) de = en;

    // Resolve Wortart (cat) and Unterkategorie (sub)
    let resolvedCat: VocabCategory = activeCat;
    let resolvedSub: string = subStr || activeSub;

    if (catStr) {
      const explicitPos = isPartOfSpeechValue(catStr);
      if (explicitPos) {
        resolvedCat = explicitPos;
      } else {
        // The column labeled "Kategorie"/"Category" actually contains a Topic/Subcategory (e.g. "Essen", "Reisen")!
        if (!subStr) {
          resolvedSub = catStr;
        }
        resolvedCat = inferWordCategory(kr, de, en, activeCat);
      }
    } else {
      resolvedCat = inferWordCategory(kr, de, en, activeCat);
    }

    // Resolve TOPIK Level
    let resolvedLevel: TopikLevel = activeLevel;
    if (levelStr) {
      const lowLvl = levelStr.toLowerCase();
      if (lowLvl.includes('2') || lowLvl.includes('ii') || lowLvl.includes('b1') || lowLvl.includes('b2')) {
        resolvedLevel = 'TOPIK II';
      } else if (lowLvl.includes('1') || lowLvl.includes('i') || lowLvl.includes('a1') || lowLvl.includes('a2')) {
        resolvedLevel = 'TOPIK I';
      }
    }

    const sanitizedId = `c_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`;

    results.push({
      id: sanitizedId,
      kr,
      de,
      en: en || undefined,
      cat: resolvedCat,
      sub: resolvedSub || fallbackSub,
      level: resolvedLevel,
      exKr: exKr || undefined,
      exDe: exDe || undefined,
      exEn: exEn || undefined,
      hanja: hanja || undefined,
      custom: true,
    });
  }

  return results;
}

/**
 * Save a single custom vocabulary item to the GLOBAL shared database (/sharedVocab).
 * This makes it immediately available for the entire app across all users.
 */
export async function saveSingleVocabToCloud(item: VocabItem): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const safeId = (item.id || `c_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const now = new Date().toISOString();
  const filePath = `sharedVocab/${safeId}`;
  try {
    await setDoc(doc(db, filePath), {
      id: safeId,
      userId: user.uid,
      korean: String(item.kr || '').trim().slice(0, 450),
      german: String(item.de || item.en || '').trim().slice(0, 950),
      english: String(item.en || '').trim().slice(0, 950),
      hanja: String(item.hanja || '').trim().slice(0, 250),
      category: String(item.cat || 'noun').trim().slice(0, 50),
      subcategory: String(item.sub || 'Allgemein').trim().slice(0, 250),
      topikLevel: String(item.level || 'TOPIK I').trim().slice(0, 32),
      exampleKorean: String(item.exKr || '').trim().slice(0, 1900),
      exampleGerman: String(item.exDe || '').trim().slice(0, 1900),
      exampleEnglish: String(item.exEn || '').trim().slice(0, 1900),
      createdAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, filePath);
  }
}

/**
 * Save multiple vocabulary items (parsed from CSV, bulk text, or JSON) directly into
 * the global shared database (/sharedVocab) and stores the file in /sharedVocabFiles.
 * Performs smart upsert by matching existing Korean words so re-uploading a CSV updates
 * subcategories and translations in place without creating duplicates!
 */
export async function saveMultipleVocabToCloud(
  items: VocabItem[],
  rawContent?: string,
  fileName?: string,
  topikLevel: string = 'TOPIK I'
): Promise<VocabItem[]> {
  const user = auth.currentUser;
  if (!user || items.length === 0) return items;

  const now = new Date().toISOString();

  // 1. If raw file content was provided, save in sharedVocabFiles
  if (rawContent && fileName) {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const filePath = `sharedVocabFiles/${fileId}`;
    try {
      await setDoc(doc(db, filePath), {
        id: fileId,
        userId: user.uid,
        fileName: fileName.slice(0, 250),
        content: rawContent.slice(0, 850000),
        vocabCount: items.length,
        topikLevel: String(topikLevel || 'TOPIK I').slice(0, 32),
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      console.warn('Could not save shared file record:', error);
    }
  }

  // 2. Fetch existing sharedVocab to match by Korean word (upsert without duplicates)
  const existingByKr = new Map<string, string>();
  try {
    const existingSnap = await getDocs(collection(db, 'sharedVocab'));
    existingSnap.forEach((d) => {
      const data = d.data();
      if (data.korean && d.id) {
        existingByKr.set(String(data.korean).trim(), d.id);
      }
    });
  } catch {
    // ignore if offline
  }

  // Also deduplicate within the uploaded batch itself by Korean word
  const seenInBatch = new Map<string, VocabItem>();
  items.forEach((item) => {
    const krKey = item.kr.trim();
    if (!krKey) return;
    const existingId = existingByKr.get(krKey) || seenInBatch.get(krKey)?.id || item.id;
    const safeId = existingId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    seenInBatch.set(krKey, { ...item, id: safeId });
  });

  const finalItems: VocabItem[] = Array.from(seenInBatch.values());

  // 3. Batch upsert in chunks of 400 to support large CSV lists
  try {
    const chunkSize = 400;
    for (let i = 0; i < finalItems.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = finalItems.slice(i, i + chunkSize);
      chunk.forEach((item) => {
        const vocabRef = doc(db, `sharedVocab/${item.id}`);
        batch.set(vocabRef, {
          id: item.id,
          userId: user.uid,
          korean: String(item.kr || '').trim().slice(0, 450),
          german: String(item.de || item.en || '').trim().slice(0, 950),
          english: String(item.en || '').trim().slice(0, 950),
          hanja: String(item.hanja || '').trim().slice(0, 250),
          category: String(item.cat || 'noun').trim().slice(0, 50),
          subcategory: String(item.sub || 'Allgemein').trim().slice(0, 250),
          topikLevel: String(item.level || topikLevel || 'TOPIK I').trim().slice(0, 32),
          exampleKorean: String(item.exKr || '').trim().slice(0, 1900),
          exampleGerman: String(item.exDe || '').trim().slice(0, 1900),
          exampleEnglish: String(item.exEn || '').trim().slice(0, 1900),
          createdAt: now,
        });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'sharedVocab');
  }

  return finalItems;
}

/**
 * Delete a single custom vocabulary item from Firestore
 */
export async function deleteSingleVocabFromCloud(itemId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const path = `sharedVocab/${itemId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Clear all custom vocabulary items and uploaded files from the shared database
 */
export async function clearAllCustomVocabFromCloud(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const collectionsToClear = [
    'sharedVocab',
    'sharedVocabFiles',
    `users/${user.uid}/vocabFiles`,
    `users/${user.uid}/customVocab`,
  ];

  for (const collPath of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, collPath));
      if (snap.empty) continue;

      const docs = snap.docs;
      const chunkSize = 400;
      for (let i = 0; i < docs.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + chunkSize);
        chunk.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (error) {
      console.warn(`Could not clear collection ${collPath}:`, error);
    }
  }
}

/**
 * Fetch all CSV files saved in the shared repository (/sharedVocabFiles and user collections)
 */
export async function fetchUserCsvFiles(): Promise<VocabFileRecord[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const records: VocabFileRecord[] = [];

  try {
    const snap = await getDocs(collection(db, 'sharedVocabFiles'));
    snap.forEach((d) => {
      const data = d.data();
      const id = d.id || data.id || '';
      records.push({ ...data, id } as VocabFileRecord);
    });
  } catch (error) {
    console.warn('Error fetching sharedVocabFiles:', error);
  }

  // Also check legacy user files if any
  try {
    const userSnap = await getDocs(collection(db, `users/${user.uid}/vocabFiles`));
    userSnap.forEach((d) => {
      const data = d.data();
      const id = d.id || data.id || '';
      const rec = { ...data, id } as VocabFileRecord;
      if (!records.some((r) => r.id === rec.id || (r.fileName && r.fileName === rec.fileName))) {
        records.push(rec);
      }
    });
  } catch {
    // ignore
  }

  return records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

/**
 * Delete a CSV file from Firestore and optionally its associated vocabulary items from sharedVocab
 */
export async function deleteCsvFileAndVocabFromCloud(
  file: VocabFileRecord,
  deleteVocabCards: boolean = true
): Promise<{ deletedFile: boolean; deletedVocabCount: number; deletedIds: string[] }> {
  const user = auth.currentUser;
  if (!user) throw new Error('Nicht angemeldet.');

  const fileId = file.id;
  const fileName = file.fileName;

  // 1. Delete the file document from sharedVocabFiles and users/{uid}/vocabFiles
  const fileDeletePromises: Promise<any>[] = [];
  if (fileId) {
    fileDeletePromises.push(deleteDoc(doc(db, `sharedVocabFiles/${fileId}`)).catch(() => {}));
    fileDeletePromises.push(deleteDoc(doc(db, `users/${user.uid}/vocabFiles/${fileId}`)).catch(() => {}));
  }

  // Also clean up any other matching documents by fileName or id
  try {
    const sharedSnap = await getDocs(collection(db, 'sharedVocabFiles'));
    sharedSnap.forEach((d) => {
      const data = d.data();
      if (d.id === fileId || data.id === fileId || (fileName && data.fileName === fileName)) {
        fileDeletePromises.push(deleteDoc(d.ref).catch(() => {}));
      }
    });
  } catch {}

  try {
    const userSnap = await getDocs(collection(db, `users/${user.uid}/vocabFiles`));
    userSnap.forEach((d) => {
      const data = d.data();
      if (d.id === fileId || data.id === fileId || (fileName && data.fileName === fileName)) {
        fileDeletePromises.push(deleteDoc(d.ref).catch(() => {}));
      }
    });
  } catch {}

  await Promise.allSettled(fileDeletePromises);

  // 2. If deleting associated vocab cards
  const deletedDocIds: string[] = [];
  if (deleteVocabCards) {
    const candidateKrWords = new Set<string>();
    const candidateIds = new Set<string>();
    const candidateSubcategories = new Set<string>();

    if (file.content) {
      try {
        const parsed = parseVocabCsv(file.content, (file.topikLevel || 'TOPIK I') as TopikLevel);
        parsed.forEach((item) => {
          if (item.kr) candidateKrWords.add(item.kr.trim().toLowerCase());
          if (item.id) candidateIds.add(item.id);
          if (item.sub) candidateSubcategories.add(item.sub.trim().toLowerCase());
        });
      } catch (err) {
        console.warn('Could not parse file content for deletion:', err);
      }
    }

    // Also consider formatted filename as a subcategory fallback
    if (fileName) {
      const subFromFileName = fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\b(topik\s*(i|ii|1|2))\b/gi, '')
        .replace(/\b(vokabeln?|liste|wortliste|words?|vocab)\b/gi, '')
        .trim()
        .toLowerCase();
      if (subFromFileName && subFromFileName !== 'allgemein' && subFromFileName !== 'eigene vokabeln') {
        candidateSubcategories.add(subFromFileName);
      }
    }

    // Find all matching vocabulary items in sharedVocab
    const docsToDelete: { ref: any; id: string }[] = [];
    try {
      const snap = await getDocs(collection(db, 'sharedVocab'));
      snap.forEach((d) => {
        const data = d.data();
        const kr = String(data.korean || '').trim().toLowerCase();
        const sub = String(data.subcategory || '').trim().toLowerCase();
        const id = d.id;

        const isMatch =
          candidateIds.has(id) ||
          (kr && candidateKrWords.has(kr)) ||
          (candidateKrWords.size === 0 && candidateSubcategories.has(sub));

        if (isMatch) {
          docsToDelete.push({ ref: d.ref, id });
        }
      });
    } catch (err) {
      console.warn('Could not list sharedVocab for deletion:', err);
    }

    // Also check users/{uid}/customVocab
    try {
      const userVocabSnap = await getDocs(collection(db, `users/${user.uid}/customVocab`));
      userVocabSnap.forEach((d) => {
        const data = d.data();
        const kr = String(data.korean || '').trim().toLowerCase();
        const id = d.id;
        if (candidateIds.has(id) || (kr && candidateKrWords.has(kr))) {
          docsToDelete.push({ ref: d.ref, id });
        }
      });
    } catch {}

    // Batch delete in chunks of 400
    const chunkSize = 400;
    for (let i = 0; i < docsToDelete.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = docsToDelete.slice(i, i + chunkSize);
      chunk.forEach((item) => {
        batch.delete(item.ref);
        deletedDocIds.push(item.id);
        // Also delete SRS record if present
        const srsRef = doc(db, `users/${user.uid}/srsProgress/${item.id}`);
        batch.delete(srsRef);
      });
      try {
        await batch.commit();
      } catch (err) {
        console.warn('Batch delete chunk warning:', err);
      }
    }
  }

  return {
    deletedFile: true,
    deletedVocabCount: deletedDocIds.length,
    deletedIds: deletedDocIds,
  };
}

/**
 * Delete a shared CSV file from Firestore (legacy signature wrapper)
 */
export async function deleteCsvFileFromCloud(fileId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Nicht angemeldet.');

  await Promise.allSettled([
    deleteDoc(doc(db, `sharedVocabFiles/${fileId}`)),
    deleteDoc(doc(db, `users/${user.uid}/vocabFiles/${fileId}`)),
  ]);
}

/**
 * Save a CSV file directly to the whole app (/sharedVocabFiles and /sharedVocab)
 */
export async function saveCsvFileToCloud(
  fileName: string,
  content: string,
  topikLevel: string = 'TOPIK I'
): Promise<{ fileRecord: VocabFileRecord; parsedItems: VocabItem[] }> {
  const user = auth.currentUser;
  if (!user) throw new Error('Benutzer ist nicht eingeloggt. Bitte zuerst anmelden.');

  const parsedItems = parseVocabCsv(content, topikLevel as TopikLevel);
  const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const fileRecord: VocabFileRecord = {
    id: fileId,
    userId: user.uid,
    fileName,
    content,
    vocabCount: parsedItems.length,
    topikLevel,
    createdAt: now,
    updatedAt: now,
  };

  await saveMultipleVocabToCloud(parsedItems, content, fileName, topikLevel);
  return { fileRecord, parsedItems };
}

/**
 * Save an individual card's SRS rating directly to user's isolated /users/{userId}/srsProgress
 */
export async function saveSingleSrsToCloud(vocabId: string, record: SrsRecord): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const now = new Date().toISOString();
  const path = `users/${user.uid}/srsProgress/${vocabId}`;
  try {
    await setDoc(doc(db, path), {
      id: vocabId,
      userId: user.uid,
      level: record.level,
      nextReviewDate: record.nextReviewDate,
      reps: record.reps,
      lapses: record.lapses,
      updatedAt: now,
    });
  } catch (err) {
    console.warn('Single SRS cloud save warning:', err);
  }
}

/**
 * Sync all shared vocabulary items to /sharedVocab AND save user's INDIVIDUAL
 * Spaced Repetition (SRS) progress to /users/{userId}/srsProgress.
 */
export async function syncAllToCloud(
  customVocab: VocabItem[],
  srsMap: SrsMap
): Promise<{ vocabSaved: number; srsSaved: number }> {
  const user = auth.currentUser;
  if (!user) throw new Error('Bitte zuerst anmelden.');

  const now = new Date().toISOString();
  let vocabCount = 0;
  let srsCount = 0;

  // 1. Save custom vocab items to sharedVocab for the entire app
  if (customVocab.length > 0) {
    const vocabBatch = writeBatch(db);
    const itemsToSync = customVocab.slice(0, 250);
    itemsToSync.forEach((item) => {
      const ref = doc(db, `sharedVocab/${item.id}`);
      vocabBatch.set(ref, {
        id: item.id,
        userId: user.uid,
        korean: item.kr,
        german: item.de,
        english: item.en || '',
        hanja: item.hanja || '',
        category: item.cat,
        subcategory: item.sub,
        topikLevel: item.level,
        exampleKorean: item.exKr || '',
        exampleGerman: item.exDe || '',
        exampleEnglish: item.exEn || '',
        createdAt: now,
      });
      vocabCount++;
    });
    try {
      await vocabBatch.commit();
    } catch (err) {
      console.warn('Vocab sync batch warning:', err);
    }
  }

  // 2. Save individual user's SRS progress to /users/{user.uid}/srsProgress
  const srsBatch = writeBatch(db);
  const srsEntries = Object.entries(srsMap).slice(0, 200);
  srsEntries.forEach(([vocabId, rec]) => {
    const ref = doc(db, `users/${user.uid}/srsProgress/${vocabId}`);
    srsBatch.set(ref, {
      id: vocabId,
      userId: user.uid,
      level: rec.level,
      nextReviewDate: rec.nextReviewDate,
      reps: rec.reps,
      lapses: rec.lapses,
      updatedAt: now,
    });
    srsCount++;
  });

  try {
    await srsBatch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/srsProgress`);
  }

  return { vocabSaved: vocabCount, srsSaved: srsCount };
}

/**
 * Load all global shared vocabulary for the entire app (/sharedVocab),
 * and load the INDIVIDUAL user's SRS progress from /users/{userId}/srsProgress.
 */
export async function loadAllFromCloud(): Promise<{
  customVocab: VocabItem[];
  srsMap: SrsMap;
}> {
  const user = auth.currentUser;
  if (!user) throw new Error('Bitte zuerst anmelden.');

  const customVocab: VocabItem[] = [];
  const srsMap: SrsMap = {};

  // 1. Load shared global vocabulary (applies to the entire app)
  try {
    const sharedSnap = await getDocs(collection(db, 'sharedVocab'));
    sharedSnap.forEach((d) => {
      const data = d.data();
      let cat: VocabCategory = 'noun';
      if (data.category === 'verb' || data.category === 'grammar') {
        cat = data.category;
      }
      customVocab.push({
        id: data.id,
        kr: data.korean,
        de: data.german,
        en: data.english || undefined,
        hanja: data.hanja || undefined,
        cat,
        sub: data.subcategory || 'Import',
        level: (data.topikLevel as TopikLevel) || 'TOPIK I',
        exKr: data.exampleKorean || undefined,
        exDe: data.exampleGerman || undefined,
        exEn: data.exampleEnglish || undefined,
        custom: true,
      });
    });
  } catch (error) {
    console.warn('Load sharedVocab check:', error);
  }

  // Also check if user has customVocab in their personal subcollection for backwards compatibility
  try {
    const userVocabSnap = await getDocs(collection(db, `users/${user.uid}/customVocab`));
    userVocabSnap.forEach((d) => {
      const data = d.data();
      if (!customVocab.some((v) => v.id === data.id || (v.kr === data.korean && v.de === data.german))) {
        let cat: VocabCategory = 'noun';
        if (data.category === 'verb' || data.category === 'grammar') {
          cat = data.category;
        }
        customVocab.push({
          id: data.id,
          kr: data.korean,
          de: data.german,
          en: data.english || undefined,
          hanja: data.hanja || undefined,
          cat,
          sub: data.subcategory || 'Import',
          level: (data.topikLevel as TopikLevel) || 'TOPIK I',
          exKr: data.exampleKorean || undefined,
          exDe: data.exampleGerman || undefined,
          exEn: data.exampleEnglish || undefined,
          custom: true,
        });
      }
    });
  } catch {
    // ignore
  }

  // 2. Load INDIVIDUAL user's SRS progress
  const srsPath = `users/${user.uid}/srsProgress`;
  try {
    const srsSnap = await getDocs(collection(db, srsPath));
    srsSnap.forEach((d) => {
      const data = d.data();
      srsMap[data.id] = {
        level: data.level,
        nextReviewDate: data.nextReviewDate,
        reps: data.reps,
        lapses: data.lapses,
      } as SrsRecord;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, srsPath);
  }

  return { customVocab, srsMap };
}
