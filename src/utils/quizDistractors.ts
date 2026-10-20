import { VocabCategory, VocabItem } from '../data/vocabData';

export interface DistractorItem {
  kr: string;
  de: string;
}

/**
 * Rich, authentic Korean vocabulary pools strictly partitioned by grammatical category (Wortart).
 * Used by QuizView to guarantee that 100% of distractors match the exact category of the question
 * (e.g. nouns for nouns, verbs for verbs, adjectives for adjectives, adverbs for adverbs, phrases for phrases, grammar for grammar).
 */
export const CATEGORY_LEXICON: Record<VocabCategory, DistractorItem[]> = {
  noun: [
    { kr: '사람', de: 'Mensch / Person' },
    { kr: '친구', de: 'Freund / Freundin' },
    { kr: '시간', de: 'Zeit / Stunde' },
    { kr: '집', de: 'Haus / Zuhause' },
    { kr: '학교', de: 'Schule' },
    { kr: '물', de: 'Wasser' },
    { kr: '음식', de: 'Essen / Speise' },
    { kr: '마음', de: 'Herz / Gemüt / Gefühl' },
    { kr: '생각', de: 'Gedanke / Idee' },
    { kr: '오늘', de: 'heute / der heutige Tag' },
    { kr: '내일', de: 'morgen / der morgige Tag' },
    { kr: '책', de: 'Buch' },
    { kr: '가족', de: 'Familie' },
    { kr: '일', de: 'Arbeit / Sache' },
    { kr: '날씨', de: 'Wetter' },
    { kr: '음악', de: 'Musik' },
    { kr: '길', de: 'Weg / Straße' },
    { kr: '돈', de: 'Geld' },
    { kr: '세상', de: 'Welt' },
    { kr: '이름', de: 'Name' },
    { kr: '나라', de: 'Land / Staat' },
    { kr: '회사', de: 'Firma / Unternehmen' },
    { kr: '눈', de: 'Auge / Schnee' },
    { kr: '말', de: 'Sprache / Wort / Pferd' },
    { kr: '꿈', de: 'Traum' },
  ],
  verb: [
    { kr: '가다', de: 'gehen / fahren' },
    { kr: '오다', de: 'kommen' },
    { kr: '먹다', de: 'essen' },
    { kr: '마시다', de: 'trinken' },
    { kr: '보다', de: 'sehen / schauen' },
    { kr: '듣다', de: 'hören / zuhören' },
    { kr: '읽다', de: 'lesen' },
    { kr: '쓰다', de: 'schreiben / verwenden' },
    { kr: '만들다', de: 'machen / herstellen' },
    { kr: '배우다', de: 'lernen' },
    { kr: '가르치다', de: 'unterrichten / beibringen' },
    { kr: '말하다', de: 'sprechen / sagen' },
    { kr: '생각하다', de: 'denken / nachdenken' },
    { kr: '시작하다', de: 'beginnen / anfangen' },
    { kr: '끝나다', de: 'enden / aufhören' },
    { kr: '기다리다', de: 'warten' },
    { kr: '돕다', de: 'helfen' },
    { kr: '찾다', de: 'suchen / finden' },
    { kr: '살다', de: 'leben / wohnen' },
    { kr: '알다', de: 'wissen / kennen' },
    { kr: '극복하다', de: 'überwinden / bewältigen' },
    { kr: '기억하다', de: 'sich erinnern' },
    { kr: '사랑하다', de: 'lieben' },
    { kr: '떠나다', de: 'verlassen / abreisen' },
    { kr: '만나다', de: 'treffen' },
  ],
  adjective: [
    { kr: '좋다', de: 'gut sein' },
    { kr: '나쁘다', de: 'schlecht sein' },
    { kr: '크다', de: 'groß sein' },
    { kr: '작다', de: 'klein sein' },
    { kr: '많다', de: 'viel sein / zahlreich sein' },
    { kr: '적다', de: 'wenig sein' },
    { kr: '빠르다', de: 'schnell sein' },
    { kr: '느리다', de: 'langsam sein' },
    { kr: '예쁘다', de: 'hübsch sein' },
    { kr: '아름답다', de: 'wunderschön sein' },
    { kr: '어렵다', de: 'schwer sein / schwierig sein' },
    { kr: '쉽다', de: 'einfach sein / leicht sein' },
    { kr: '기쁘다', de: 'erfreut sein / froh sein' },
    { kr: '슬프다', de: 'traurig sein' },
    { kr: '따뜻하다', de: 'warm sein' },
    { kr: '춥다', de: 'kalt sein' },
    { kr: '덥다', de: 'heiß sein' },
    { kr: '바쁘다', de: 'beschäftigt sein' },
    { kr: '편하다', de: 'bequem sein / angenehm sein' },
    { kr: '중요하다', de: 'wichtig sein' },
    { kr: '재미있다', de: 'interessant sein / Spaß machen' },
    { kr: '맛있다', de: 'lecker sein' },
    { kr: '쓸쓸하다', de: 'einsam sein / melancholisch sein' },
    { kr: '찬란하다', de: 'strahlend sein / glanzvoll sein' },
    { kr: '눈부시다', de: 'blendend schön sein' },
  ],
  adverb: [
    { kr: '빨리', de: 'schnell' },
    { kr: '천천히', de: 'langsam' },
    { kr: '자주', de: 'oft' },
    { kr: '가끔', de: 'manchmal' },
    { kr: '항상', de: 'immer' },
    { kr: '매우', de: 'sehr' },
    { kr: '아주', de: 'äußerst / ganz' },
    { kr: '정말', de: 'wirklich / wahrhaftig' },
    { kr: '진짜', de: 'echt' },
    { kr: '벌써', de: 'schon / bereits' },
    { kr: '아직', de: 'noch / noch nicht' },
    { kr: '갑자기', de: 'plötzlich' },
    { kr: '꼭', de: 'unbedingt / fest' },
    { kr: '드디어', de: 'endlich / schließlich' },
    { kr: '다시', de: 'wieder / noch einmal' },
    { kr: '함께', de: 'zusammen / gemeinsam' },
    { kr: '혼자', de: 'allein' },
    { kr: '열심히', de: 'fleißig / engagiert' },
    { kr: '특히', de: 'besonders' },
    { kr: '조금', de: 'ein wenig / etwas' },
    { kr: '거의', de: 'fast / beinahe' },
    { kr: '직접', de: 'selbst / direkt' },
  ],
  phrase: [
    { kr: '안녕하세요', de: 'Guten Tag / Hallo' },
    { kr: '감사합니다', de: 'Vielen Dank' },
    { kr: '죄송합니다', de: 'Entschuldigung' },
    { kr: '잘 지내요?', de: 'Wie geht es dir?' },
    { kr: '오랜만이에요', de: 'Lange nicht gesehen' },
    { kr: '만나서 반가워요', de: 'Schön dich kennenzulernen' },
    { kr: '수고하셨습니다', de: 'Gute Arbeit / Vielen Dank für die Mühe' },
    { kr: '어쩔 수 없다', de: 'Da kann man nichts machen' },
    { kr: '힘내세요!', de: 'Kopf hoch! / Gib nicht auf!' },
    { kr: '마음에 들다', de: 'gefallen' },
    { kr: '잘 부탁드립니다', de: 'Ich zähle auf gute Zusammenarbeit' },
    { kr: '안녕히 가세요', de: 'Auf Wiedersehen (zum Gehenden)' },
    { kr: '안녕히 계세요', de: 'Auf Wiedersehen (zum Bleibenden)' },
    { kr: '괜찮아요', de: 'Alles in Ordnung / Kein Problem' },
    { kr: '좋은 하루 보내세요', de: 'Schönen Tag noch' },
    { kr: '축하합니다', de: 'Herzlichen Glückwunsch' },
  ],
  grammar: [
    { kr: '-은/는', de: 'Themenpartikel' },
    { kr: '-이/가', de: 'Subjektpartikel' },
    { kr: '-을/를', de: 'Objektpartikel' },
    { kr: '-에', de: 'Ort- und Zeitpartikel' },
    { kr: '-에서', de: 'Handlungsortpartikel / von' },
    { kr: '-지만', de: 'aber, obwohl' },
    { kr: '-아/어서', de: 'weil, da; und dann' },
    { kr: '-(으)ㄹ 수 있다', de: 'können (Fähigkeit / Möglichkeit)' },
    { kr: '-(으)ㄹ 수 없다', de: 'nicht können' },
    { kr: '-(으)려고 하다', de: 'beabsichtigen zu / vorhaben zu' },
    { kr: '-기 때문에', de: 'weil, da (Begründung)' },
    { kr: '-(으)면', de: 'wenn, falls (Bedingung)' },
    { kr: '-고 싶다', de: 'möchten / wollen' },
    { kr: '-(으)ㄹ 때', de: 'wenn, als (Zeitpunkt)' },
    { kr: '-아/어야 하다', de: 'müssen' },
    { kr: '-아/어도 되다', de: 'dürfen / es ist erlaubt' },
    { kr: '-(으)면 안 되다', de: 'nicht dürfen / verboten sein' },
    { kr: '-아/어 보다', de: 'versuchen zu / ausprobieren' },
    { kr: '-기 전에', de: 'bevor' },
    { kr: '-(으)ㄴ 후에', de: 'nachdem' },
  ],
  custom: [
    { kr: '대박', de: 'Wahnsinn! / Unglaublich!' },
    { kr: '진짜', de: 'wirklich / echt' },
    { kr: '보고 싶다', de: 'ich vermisse dich' },
    { kr: '사랑해', de: 'ich liebe dich' },
    { kr: '걱정 마', de: 'keine Sorge' },
    { kr: '어떻게 해', de: 'was soll ich tun' },
    { kr: '운명', de: 'Schicksal' },
    { kr: '기억해', de: 'erinnere dich' },
    { kr: '괜찮아', de: 'alles gut / in Ordnung' },
    { kr: '가지 마', de: 'geh nicht' },
    { kr: '약속해', de: 'versprich es mir' },
    { kr: '행복하자', de: 'lass uns glücklich sein' },
  ],
};

function normalizeAnswerText(text: string): string {
  return text.trim().toLowerCase().replace(/[\s\-_.,/()]+/g, '');
}

/**
 * Builds 4 unique quiz options strictly from the same grammatical category.
 * Absolutely never includes distractors from a different category.
 */
export function buildStrictCategoryOptions(
  targetItem: VocabItem,
  krToDe: boolean,
  deckPool: VocabItem[],
  allLevelItems: VocabItem[]
): string[] {
  const cat = targetItem.cat || 'noun';
  const correctAnswer = (krToDe ? targetItem.de : targetItem.kr).trim();
  const normalizedCorrect = normalizeAnswerText(correctAnswer);

  const seenNormalized = new Set<string>([normalizedCorrect]);
  const candidates: string[] = [];

  // Helper to add candidate if not duplicate
  const addCandidate = (text?: string) => {
    if (!text) return;
    const clean = text.trim();
    if (!clean) return;
    const norm = normalizeAnswerText(clean);
    if (!seenNormalized.has(norm)) {
      seenNormalized.add(norm);
      candidates.push(clean);
    }
  };

  // 1. First priority: items from current active deck with EXACT SAME category
  const deckSameCat = deckPool.filter((i) => i.id !== targetItem.id && i.cat === cat);
  for (const item of [...deckSameCat].sort(() => Math.random() - 0.5)) {
    addCandidate(krToDe ? item.de : item.kr);
    if (candidates.length >= 8) break;
  }

  // 2. Second priority: items from entire active level with EXACT SAME category
  if (candidates.length < 3) {
    const levelSameCat = allLevelItems.filter(
      (i) => i.id !== targetItem.id && i.cat === cat
    );
    for (const item of [...levelSameCat].sort(() => Math.random() - 0.5)) {
      addCandidate(krToDe ? item.de : item.kr);
      if (candidates.length >= 8) break;
    }
  }

  // 3. Guaranteed same-category fallback from CATEGORY_LEXICON
  const fallbackList = CATEGORY_LEXICON[cat] || CATEGORY_LEXICON.noun;
  for (const entry of [...fallbackList].sort(() => Math.random() - 0.5)) {
    addCandidate(krToDe ? entry.de : entry.kr);
    if (candidates.length >= 8) break;
  }

  // Pick 3 unique distractors
  const chosenDistractors = candidates.slice(0, 3);

  // Combine with correct answer and shuffle
  const finalOptions = [correctAnswer, ...chosenDistractors].sort(
    () => Math.random() - 0.5
  );

  return finalOptions;
}
