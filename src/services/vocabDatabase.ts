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
 * Helper to normalize category
 */
export function normalizeCategory(rawCat?: string, fallback: VocabCategory = 'noun'): VocabCategory {
  if (!rawCat) return fallback;
  const c = rawCat.toLowerCase().trim();
  if (c.includes('verb') || c.includes('동사')) return 'verb';
  if (c.includes('gramm') || c.includes('문법')) return 'grammar';
  if (c.includes('noun') || c.includes('nomen') || c.includes('명사')) return 'noun';
  return fallback;
}

/**
 * Robust CSV & Markdown parser that supports:
 * - Markdown tables (| Korean | German | English | ...)
 * - Markdown bullet points (- **약속**: Verabredung (appointment))
 * - Standard CSV (comma, semicolon, tab, pipe, colon)
 * - German & English translations (either, or both)
 * - Sino-Korean Hanja and Korean/German/English example sentences
 */
export function parseVocabCsv(csvOrMdText: string, defaultTopikLevel: TopikLevel = 'TOPIK I'): VocabItem[] {
  const trimmed = csvOrMdText.trim();
  if (!trimmed) return [];

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

        results.push({
          id: `c_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
          level: obj.level === 'TOPIK II' ? 'TOPIK II' : 'TOPIK I',
          cat: normalizeCategory(obj.cat || obj.category || (kr.startsWith('-') ? 'grammar' : 'noun')),
          sub: String(obj.sub || obj.subcategory || obj.lesson || 'Eigene Vokabeln').trim(),
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

  // Check if first row is a header row
  const headerMap: { [col: string]: number } = {};
  let startIndex = 0;
  let activeSub = 'Eigene Vokabeln';
  let activeCat: VocabCategory = 'noun';

  // Detect header row pattern
  const firstLineLower = lines[0].toLowerCase();
  const isTableSeparator = (l: string) => /^\|?[\s\-:|]+\|[\s\-:|]+\|?$/.test(l);

  const cleanHeader = (h: string) => h.replace(/^\|/, '').replace(/\|$/, '').trim().toLowerCase();

  const isHeaderCandidate =
    firstLineLower.includes('korean') ||
    firstLineLower.includes('hangul') ||
    firstLineLower.includes('deutsch') ||
    firstLineLower.includes('german') ||
    firstLineLower.includes('english') ||
    firstLineLower.includes('bedeutung') ||
    firstLineLower.includes('meaning') ||
    firstLineLower.includes('한국어') ||
    firstLineLower.includes('단어') ||
    firstLineLower.startsWith('kr;') ||
    firstLineLower.startsWith('kr,') ||
    firstLineLower.startsWith('kr|') ||
    firstLineLower.startsWith('kr\t');

  if (isHeaderCandidate) {
    let headerCols: string[] = [];
    if (lines[0].includes('|')) {
      headerCols = lines[0].split('|').map(cleanHeader).filter(Boolean);
    } else if (lines[0].includes('\t')) {
      headerCols = lines[0].split('\t').map(cleanHeader).filter(Boolean);
    } else if (lines[0].includes(';')) {
      headerCols = lines[0].split(';').map(cleanHeader).filter(Boolean);
    } else if (lines[0].includes(',')) {
      headerCols = lines[0].split(',').map(cleanHeader).filter(Boolean);
    }

    if (headerCols.length > 0) {
      headerCols.forEach((h, idx) => {
        if (h.includes('korean') || h.includes('hangul') || h === 'kr' || h.includes('한국어') || h.includes('단어') || h.includes('표현')) headerMap['kr'] = idx;
        else if (h.includes('deutsch') || h.includes('german') || h === 'de' || h.includes('독일어') || h.includes('bedeutung')) headerMap['de'] = idx;
        else if (h.includes('english') || h.includes('englisch') || h === 'en' || h.includes('영어') || h.includes('meaning')) headerMap['en'] = idx;
        else if (h.includes('cat') || h.includes('kategorie') || h.includes('품사') || h.includes('wortart')) headerMap['cat'] = idx;
        else if (h.includes('sub') || h.includes('thema') || h.includes('lektion') || h.includes('주제') || h.includes('kapitel')) headerMap['sub'] = idx;
        else if (h.includes('exkr') || (h.includes('beispiel') && (h.includes('kr') || h.includes('kor'))) || h.includes('예문')) headerMap['exKr'] = idx;
        else if (h.includes('exde') || (h.includes('beispiel') && (h.includes('de') || h.includes('ger')))) headerMap['exDe'] = idx;
        else if (h.includes('exen') || (h.includes('beispiel') && (h.includes('en') || h.includes('eng'))) || (h.includes('example') && h.includes('sentence'))) headerMap['exEn'] = idx;
        else if (h.includes('hanja') || h.includes('한자')) headerMap['hanja'] = idx;
      });
      startIndex = 1;
    }
  }

  const results: VocabItem[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    if (isTableSeparator(rawLine)) continue;

    // Handle markdown topic headings (# Lektion 1)
    if (rawLine.startsWith('#')) {
      const heading = rawLine.replace(/^#+\s*/, '').trim();
      if (heading) {
        activeSub = heading;
        const low = heading.toLowerCase();
        if (low.includes('verb') || low.includes('동사')) activeCat = 'verb';
        else if (low.includes('gramm') || low.includes('문법')) activeCat = 'grammar';
        else if (low.includes('nomen') || low.includes('noun') || low.includes('명사')) activeCat = 'noun';
      }
      continue;
    }

    // Strip bullet points (- or * or 1.) and bold/italics
    let cleanLine = rawLine.replace(/^(\*|\+|-|\d+\.)\s+/, '').trim();

    // Check if line is a Markdown table row (| col1 | col2 | ...)
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
    } else if (cleanLine.includes(' - ')) {
      cols = cleanLine.split(' - ').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    } else if (cleanLine.includes(' – ')) {
      cols = cleanLine.split(' – ').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    } else if (cleanLine.includes(' : ') || cleanLine.includes(':')) {
      // Handles **한국어**: German (English) or 한국어 : German : English
      const colonSplit = cleanLine.split(/:(.+)/);
      if (colonSplit.length >= 2) {
        cols = [colonSplit[0].replace(/\*\*/g, '').trim(), colonSplit[1].trim()];
      }
    } else if (cleanLine.includes(',')) {
      // CSV comma split respecting quotes
      const pattern = /(".*?"|[^",]+)(?=,|$)/g;
      const matches = cleanLine.match(pattern);
      if (matches) {
        cols = matches.map((m) => m.replace(/^["']|["']$/g, '').trim());
      } else {
        cols = cleanLine.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      }
    }

    if (cols.length < 2) continue;

    let kr = '';
    let de = '';
    let en: string | undefined = undefined;
    let catStr = '';
    let sub = activeSub;
    let exKr = '';
    let exDe = '';
    let exEn = '';
    let hanja: string | undefined = undefined;

    // A. Use mapped header positions if available
    if (headerMap['kr'] !== undefined && (headerMap['de'] !== undefined || headerMap['en'] !== undefined)) {
      kr = cols[headerMap['kr']]?.trim() || '';
      if (headerMap['de'] !== undefined) de = cols[headerMap['de']]?.trim() || '';
      if (headerMap['en'] !== undefined) en = cols[headerMap['en']]?.trim() || undefined;
      if (headerMap['cat'] !== undefined) catStr = cols[headerMap['cat']]?.trim() || '';
      if (headerMap['sub'] !== undefined) sub = cols[headerMap['sub']]?.trim() || activeSub;
      if (headerMap['exKr'] !== undefined) exKr = cols[headerMap['exKr']]?.trim() || '';
      if (headerMap['exDe'] !== undefined) exDe = cols[headerMap['exDe']]?.trim() || '';
      if (headerMap['exEn'] !== undefined) exEn = cols[headerMap['exEn']]?.trim() || '';
      if (headerMap['hanja'] !== undefined) hanja = cols[headerMap['hanja']]?.trim() || undefined;

      // Fallback if only English was in header
      if (!de && en) de = en;
    } else {
      // B. Smart positional heuristic
      // 1. Detect which column contains Korean Hangul
      let krIndex = cols.findIndex((c) => /[가-힣]/.test(c) || c.startsWith('-'));
      if (krIndex === -1) krIndex = 0;
      kr = cols[krIndex]?.trim();

      // Remaining columns
      const otherCols = cols.filter((_, idx) => idx !== krIndex);

      if (otherCols.length >= 2) {
        // We have at least 2 remaining columns!
        const c1 = otherCols[0].trim();
        const c2 = otherCols[1].trim();

        // Check if c2 is an English translation or example
        const isC2Example = c2.length > 35 || c2.includes('.') || /[가-힣]/.test(c2);
        const isC1Category = ['nomen', 'verb', 'noun', 'grammar', '문법', '동사', '명사'].includes(c1.toLowerCase());

        if (isC1Category) {
          catStr = c1;
          de = c2;
          if (otherCols[2]) en = otherCols[2].trim();
        } else if (!isC2Example) {
          // Check if c1 or c2 has English indicator or German indicator
          de = c1;
          en = c2;
          if (otherCols[2]) {
            const c3 = otherCols[2].trim();
            if (['nomen', 'verb', 'noun', 'grammar'].includes(c3.toLowerCase())) {
              catStr = c3;
            } else if (/[가-힣]/.test(c3)) {
              exKr = c3;
              exDe = otherCols[3]?.trim() || '';
              exEn = otherCols[4]?.trim() || '';
            }
          }
        } else {
          de = c1;
          if (/[가-힣]/.test(c2)) {
            exKr = c2;
            exDe = otherCols[2]?.trim() || '';
            exEn = otherCols[3]?.trim() || '';
          }
        }
      } else if (otherCols.length === 1) {
        const text = otherCols[0].trim();
        // Check for parenthesized English in format: "Verabredung (appointment)"
        const parenMatch = text.match(/^([^(]+)\s*\(([^)]+)\)$/);
        if (parenMatch) {
          de = parenMatch[1].trim();
          en = parenMatch[2].trim();
        } else {
          de = text;
        }
      }
    }

    if (!kr || (!de && !en)) continue;
    if (!de && en) de = en;

    let cat: VocabCategory = activeCat;
    if (catStr) {
      cat = normalizeCategory(catStr, activeCat);
    } else if (kr.startsWith('-') || kr.startsWith('-(으)')) {
      cat = 'grammar';
    }

    const sanitizedId = `c_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`;

    results.push({
      id: sanitizedId,
      kr,
      de,
      en: en || undefined,
      cat,
      sub: sub || 'Import',
      level: defaultTopikLevel,
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

  const now = new Date().toISOString();
  const filePath = `sharedVocab/${item.id}`;
  try {
    await setDoc(doc(db, filePath), {
      id: item.id,
      userId: user.uid,
      korean: item.kr,
      german: item.de,
      english: item.en || '',
      hanja: item.hanja || '',
      category: item.cat,
      subcategory: item.sub || 'Eigene Vokabeln',
      topikLevel: item.level || 'TOPIK I',
      exampleKorean: item.exKr || '',
      exampleGerman: item.exDe || '',
      exampleEnglish: item.exEn || '',
      createdAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, filePath);
  }
}

/**
 * Save multiple vocabulary items (parsed from CSV, bulk text, or JSON) directly into
 * the global shared database (/sharedVocab) and stores the file in /sharedVocabFiles.
 * This ensures uploaded files and vocabulary apply to the whole app for all users!
 */
export async function saveMultipleVocabToCloud(
  items: VocabItem[],
  rawContent?: string,
  fileName?: string,
  topikLevel: string = 'TOPIK I'
): Promise<void> {
  const user = auth.currentUser;
  if (!user || items.length === 0) return;

  const now = new Date().toISOString();

  // 1. If raw file content was provided, save in sharedVocabFiles
  if (rawContent && fileName) {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const filePath = `sharedVocabFiles/${fileId}`;
    try {
      await setDoc(doc(db, filePath), {
        id: fileId,
        userId: user.uid,
        fileName,
        content: rawContent,
        vocabCount: items.length,
        topikLevel,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      console.warn('Could not save shared file record:', error);
    }
  }

  // 2. Batch insert up to 450 items into /sharedVocab (accessible by all app users)
  try {
    const batch = writeBatch(db);
    const slice = items.slice(0, 450);
    slice.forEach((item) => {
      const vocabRef = doc(db, `sharedVocab/${item.id}`);
      batch.set(vocabRef, {
        id: item.id,
        userId: user.uid,
        korean: item.kr,
        german: item.de,
        english: item.en || '',
        hanja: item.hanja || '',
        category: item.cat,
        subcategory: item.sub || 'Eigene Vokabeln',
        topikLevel: item.level || topikLevel,
        exampleKorean: item.exKr || '',
        exampleGerman: item.exDe || '',
        exampleEnglish: item.exEn || '',
        createdAt: now,
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'sharedVocab');
  }
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
 * Clear all custom vocabulary items from the shared database
 */
export async function clearAllCustomVocabFromCloud(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const path = 'sharedVocab';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Fetch all CSV files saved in the shared repository (/sharedVocabFiles)
 */
export async function fetchUserCsvFiles(): Promise<VocabFileRecord[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const path = 'sharedVocabFiles';
  try {
    const snap = await getDocs(collection(db, path));
    const records: VocabFileRecord[] = [];
    snap.forEach((d) => {
      records.push(d.data() as VocabFileRecord);
    });

    // Also check legacy user files if any
    try {
      const userSnap = await getDocs(collection(db, `users/${user.uid}/vocabFiles`));
      userSnap.forEach((d) => {
        const rec = d.data() as VocabFileRecord;
        if (!records.some((r) => r.id === rec.id)) {
          records.push(rec);
        }
      });
    } catch {
      // ignore
    }

    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Delete a shared CSV file from Firestore
 */
export async function deleteCsvFileFromCloud(fileId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Nicht angemeldet.');

  const path = `sharedVocabFiles/${fileId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch {
    // If not in shared, try user subcollection
    try {
      await deleteDoc(doc(db, `users/${user.uid}/vocabFiles/${fileId}`));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
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
