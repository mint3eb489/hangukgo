import { VocabItem, VocabCategory, TopikLevel } from '../data/vocabData';

/**
 * Dynamically loads and parses any Markdown (.md) files placed inside /src/data.
 * Uses Vite's eager glob import so any new .md file added to the repository
 * is automatically discovered and loaded into the vocabulary bank at compile/dev time.
 */

// Vite glob import of all .md files in /src/data
const rawMarkdownFiles = import.meta.glob('/src/data/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function parseMarkdownVocabContent(content: string, fallbackSub: string): VocabItem[] {
  const items: VocabItem[] = [];
  if (!content || !content.trim()) return items;

  let currentSub = fallbackSub;
  let currentLevel: TopikLevel = 'TOPIK II';
  let currentCat: VocabCategory = 'noun';

  const lines = content.split(/\r?\n/);

  lines.forEach((line, idx) => {
    const raw = line.trim();
    if (!raw) return;

    // Detect H1 / H2 headers to set subcategory or level
    if (raw.startsWith('#')) {
      const headerText = raw.replace(/^#+\s*/, '').trim();
      if (headerText.toLowerCase().includes('topik 1') || headerText.toLowerCase().includes('topik i')) {
        currentLevel = 'TOPIK I';
      } else if (headerText.toLowerCase().includes('topik 2') || headerText.toLowerCase().includes('topik ii')) {
        currentLevel = 'TOPIK II';
      }
      if (headerText.toLowerCase().includes('verb') || headerText.toLowerCase().includes('동사')) {
        currentCat = 'verb';
      } else if (headerText.toLowerCase().includes('gramm') || headerText.toLowerCase().includes('문법')) {
        currentCat = 'grammar';
      } else if (headerText.toLowerCase().includes('nomen') || headerText.toLowerCase().includes('명사')) {
        currentCat = 'noun';
      }

      // If header doesn't just specify category or level, use it as subcategory
      const cleanHeader = headerText.replace(/\b(topik\s*(i|ii|1|2)?|nomen|verben|grammatik)\b/gi, '').trim();
      if (cleanHeader) {
        currentSub = cleanHeader;
      }
      return;
    }

    // Ignore markdown table header separators
    if (/^\|?[\s\-:|]+\|[\s\-:|]+\|?$/.test(raw)) return;

    // Clean markdown list prefixes (*, -, +) or bold
    let clean = raw.replace(/^(\*|\+|-|\d+\.)\s+/, '').trim();
    clean = clean.replace(/\*\*/g, '').replace(/__/g, '');

    const lower = clean.toLowerCase();
    if (lower.includes('koreanisch') && (lower.includes('deutsch') || lower.includes('german'))) return;
    if (lower.startsWith('kr;') || lower.startsWith('kr|') || lower.startsWith('kr,')) return;

    let parts: string[] = [];
    if (clean.includes('|')) {
      parts = clean.replace(/^\|/, '').replace(/\|$/, '').split('|');
    } else if (clean.includes(';')) {
      parts = clean.split(';');
    } else if (clean.includes('\t')) {
      parts = clean.split('\t');
    } else if (clean.includes(' - ')) {
      parts = clean.split(' - ');
    } else if (clean.includes(' – ')) {
      parts = clean.split(' – ');
    } else if (clean.includes(',')) {
      parts = clean.split(',');
    } else {
      return;
    }

    parts = parts.map((p) => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length < 2 || !parts[0] || !parts[1]) return;

    const kr = parts[0];
    const de = parts[1];
    let en: string | undefined = undefined;
    let exKr: string | undefined = undefined;
    let exDe: string | undefined = undefined;
    let exEn: string | undefined = undefined;

    // Detect if column 2 is English or Korean example:
    // If parts[2] contains Korean characters [가-힣], it's exKr.
    // Otherwise, if parts[2] has letters and no Korean characters, it's the English translation!
    if (parts.length >= 3 && parts[2]) {
      const hasHangul = /[가-힣]/.test(parts[2]);
      if (!hasHangul) {
        en = parts[2];
        exKr = parts[3] || undefined;
        exDe = parts[4] || undefined;
        exEn = parts[5] || undefined;
      } else {
        exKr = parts[2];
        exDe = parts[3] || undefined;
        en = parts[4] || undefined;
        exEn = parts[5] || undefined;
      }
    }

    let cat: VocabCategory = currentCat;
    if (kr.startsWith('-') || kr.startsWith('-(으)')) {
      cat = 'grammar';
    }

    // Sanitize subcategory name
    const sub = currentSub.replace(/^[#\s\-_]+/, '').trim() || fallbackSub;

    items.push({
      id: `md_${fallbackSub.replace(/\s+/g, '_')}_${idx}_${kr}`,
      level: currentLevel,
      cat,
      sub,
      kr,
      de,
      en: en || undefined,
      exKr,
      exDe,
      exEn: exEn || undefined,
      custom: true,
    });
  });

  return items;
}

/**
 * Loads all static .md files found under /src/data
 */
export function loadAllMarkdownFilesVocab(): VocabItem[] {
  const allLoaded: VocabItem[] = [];

  for (const [path, fileContent] of Object.entries(rawMarkdownFiles)) {
    if (typeof fileContent !== 'string') continue;

    // Derive readable fallback subcategory from file name
    const match = path.match(/\/([^/]+)\.md$/i);
    const fileName = match ? match[1] : 'Markdown Vokabeln';
    const subcategoryName = fileName
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

    const items = parseMarkdownVocabContent(fileContent, subcategoryName);
    allLoaded.push(...items);
  }

  return allLoaded;
}
