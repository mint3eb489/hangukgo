import { VocabCategory } from '../data/vocabData';

export interface HanjaRootSyllable {
  syllable: string; // e.g. '경'
  char: string;     // e.g. '經'
  de: string;       // e.g. 'durchmachen, Weg'
  kr: string;       // e.g. '지날 경'
}

export interface HanjaWordEntry {
  hanja: string;                // e.g. '經驗'
  roots: HanjaRootSyllable[];   // Breakdown per syllable
  family?: string[];            // Related words sharing the root(s)
}

/**
 * Known pure Korean words (순우리말) or loanwords so the fallback syllable analyzer
 * never produces false positives on non-Hanja words.
 */
const NATIVE_KOREAN_WORDS = new Set<string>([
  '만나다', '기다리다', '도와주다', '물어보다', '찾다', '배우다', '끝나다',
  '생각', '버릇', '바꾸다', '바뀌다', '늘다', '늘어나다', '줄다', '줄어들다',
  '줄이다', '사라지다', '생기다', '깨닫다', '어울리다', '참다', '겪다',
  '이루다', '이루어지다', '미치다', '주다', '막다', '지키다', '보이다',
  '닫히다', '열리다', '끊기다', '먹이다', '입히다', '알리다', '웃기다',
  '재우다', '짠', '불고기', '찌개', '막걸리', '삼겹살',
]);

/**
 * Curated Word-Level Hanja Dictionary covering TOPIK I, TOPIK II, Cultural Vocab,
 * and frequent Sino-Korean compounds.
 */
export const HANJA_WORD_DICT: Record<string, HanjaWordEntry> = {
  // === TOPIK I NOMEN & VERBEN ===
  약속: {
    hanja: '約束',
    roots: [
      { syllable: '약', char: '約', de: 'versprechen, Bündnis', kr: '맺을 약' },
      { syllable: '속', char: '束', de: 'binden, bündeln', kr: '묶을 속' },
    ],
    family: ['예약 (Reservierung)', '계약 (Vertrag)'],
  },
  준비: {
    hanja: '準備',
    roots: [
      { syllable: '준', char: '準', de: 'Maßstab, richten', kr: '법도 준' },
      { syllable: '비', char: '備', de: 'vorbereiten, ausrüsten', kr: '갖출 비' },
    ],
    family: ['수준 (Niveau)', '비율 (Verhältnis)'],
  },
  선물: {
    hanja: '膳物',
    roots: [
      { syllable: '선', char: '膳', de: 'Speise, darbieten', kr: '반찬 선' },
      { syllable: '물', char: '物', de: 'Ding, Gegenstand', kr: '물건 물' },
    ],
    family: ['물건 (Gegenstand)', '동물 (Tier)'],
  },
  주말: {
    hanja: '週末',
    roots: [
      { syllable: '주', char: '週', de: 'Woche', kr: '주일 주' },
      { syllable: '말', char: '末', de: 'Ende', kr: '끝 말' },
    ],
    family: ['이번 주 (diese Woche)', '연말 (Jahresende)', '월말 (Monatsende)'],
  },
  취미: {
    hanja: '趣味',
    roots: [
      { syllable: '취', char: '趣', de: 'Neigung, Sinn', kr: '뜻 취' },
      { syllable: '미', char: '味', de: 'Geschmack, Reiz', kr: '맛 미' },
    ],
    family: ['흥미 (Interesse)', '의미 (Bedeutung)'],
  },
  가족: {
    hanja: '家族',
    roots: [
      { syllable: '가', char: '家', de: 'Haus, Familie', kr: '집 가' },
      { syllable: '족', char: '族', de: 'Sippe, Stamm', kr: '겨레 족' },
    ],
    family: ['국가 (Staat)', '민족 (Volk)', '가정 (Haushalt)'],
  },
  건강: {
    hanja: '健康',
    roots: [
      { syllable: '건', char: '健', de: 'stark, rüstig', kr: '굳셀 건' },
      { syllable: '강', char: '康', de: 'Wohlbefinden, Frieden', kr: '편안 강' },
    ],
    family: ['보건 (Gesundheitswesen)', '건전 (gesund/solide)'],
  },
  비행기: {
    hanja: '飛行機',
    roots: [
      { syllable: '비', char: '飛', de: 'fliegen', kr: '날 비' },
      { syllable: '행', char: '行', de: 'gehen, fahren', kr: '다닐 행' },
      { syllable: '기', char: '機', de: 'Maschine, Gerät', kr: '틀 기' },
    ],
    family: ['여행 (Reise)', '기계 (Maschine)', '세탁기 (Waschmaschine)'],
  },
  지하철: {
    hanja: '地下鐵',
    roots: [
      { syllable: '지', char: '地', de: 'Erde, Boden', kr: '땅 지' },
      { syllable: '하', char: '下', de: 'unten, unter', kr: '아래 하' },
      { syllable: '철', char: '鐵', de: 'Eisen, Schiene', kr: '쇠 철' },
    ],
    family: ['지역 (Region)', '철도 (Eisenbahn)', '지하 (Untergrund)'],
  },
  여행: {
    hanja: '旅行',
    roots: [
      { syllable: '여', char: '旅', de: 'reisen', kr: '나그네 여' },
      { syllable: '행', char: '行', de: 'gehen, ziehen', kr: '다닐 행' },
    ],
    family: ['여권 (Reisepass)', '행동 (Handlung)'],
  },
  시작하다: {
    hanja: '始作',
    roots: [
      { syllable: '시', char: '始', de: 'Anfang, beginnen', kr: '비로소 시' },
      { syllable: '작', char: '作', de: 'machen, schaffen', kr: '지을 작' },
    ],
    family: ['작품 (Werk)', '작업 (Arbeit)', '출발 (Aufbruch)'],
  },

  // === KULTUR & ESSEN (.md) ===
  건배: {
    hanja: '乾杯',
    roots: [
      { syllable: '건', char: '乾', de: 'trocken, leeren', kr: '마를 건' },
      { syllable: '배', char: '杯', de: 'Becher, Glas', kr: '잔 배' },
    ],
    family: ['건조 (Trocknung)', '축배 (Trinkspruch)'],
  },
  안주: {
    hanja: '按酒',
    roots: [
      { syllable: '안', char: '按', de: 'begleiten, stützen', kr: '누를 안' },
      { syllable: '주', char: '酒', de: 'Alkohol, Wein', kr: '술 주' },
    ],
    family: ['맥주 (Bier)', '소주 (Soju)'],
  },
  회식: {
    hanja: '會食',
    roots: [
      { syllable: '회', char: '會', de: 'versammeln, treffen', kr: '모일 회' },
      { syllable: '식', char: '食', de: 'essen, Speise', kr: '밥 식' },
    ],
    family: ['회사 (Firma)', '사회 (Gesellschaft)', '식당 (Restaurant)'],
  },
  포장마차: {
    hanja: '布帳馬車',
    roots: [
      { syllable: '포', char: '布', de: 'Stoff, Tuch', kr: '베 포' },
      { syllable: '장', char: '帳', de: 'Zelt, Vorhang', kr: '휘장 장' },
      { syllable: '마', char: '馬', de: 'Pferd', kr: '말 마' },
      { syllable: '차', char: '車', de: 'Wagen, Fahrzeug', kr: '수레 차' },
    ],
    family: ['포장 (Verpackung)', '자동차 (Auto)'],
  },
  치맥: {
    hanja: 'Chicken + 麥(酒)',
    roots: [
      { syllable: '치', char: 'En', de: 'Chicken (Hähnchen)', kr: '치킨' },
      { syllable: '맥', char: '麥', de: 'Gerste -> 맥주 (Bier)', kr: '보리 맥' },
    ],
    family: ['맥주 (Bier)', '소맥 (Soju + Bier)'],
  },

  // === TOPIK II NOMEN: Gesellschaft & Umwelt ===
  경험: {
    hanja: '經驗',
    roots: [
      { syllable: '경', char: '經', de: 'durchmachen, passieren', kr: '지날 경' },
      { syllable: '험', char: '驗', de: 'prüfen, erfahren', kr: '시험 험' },
    ],
    family: ['시험 (Prüfung)', '실험 (Experiment)', '경력 (Werdegang)'],
  },
  기회: {
    hanja: '機會',
    roots: [
      { syllable: '기', char: '機', de: 'Wendepunkt, Anlass', kr: '틀 기' },
      { syllable: '회', char: '會', de: 'zusammentreffen', kr: '모일 회' },
    ],
    family: ['위기 (Krise)', '동기 (Motivation)', '회의 (Meeting)'],
  },
  문화: {
    hanja: '文化',
    roots: [
      { syllable: '문', char: '文', de: 'Schrift, Kultur', kr: '글월 문' },
      { syllable: '화', char: '化', de: 'werden, wandeln', kr: '될 화' },
    ],
    family: ['문학 (Literatur)', '변화 (Veränderung)', '화해 (Versöhnung)'],
  },
  사회: {
    hanja: '社會',
    roots: [
      { syllable: '사', char: '社', de: 'Gemeinschaft, Verband', kr: '모일 사' },
      { syllable: '회', char: '會', de: 'Versammlung', kr: '모일 회' },
    ],
    family: ['회사 (Firma)', '사장 (Firmenchef)', '회원 (Mitglied)'],
  },
  환경: {
    hanja: '環境',
    roots: [
      { syllable: '환', char: '環', de: 'Ring, umgeben', kr: '고리 환' },
      { syllable: '경', char: '境', de: 'Grenze, Gebiet, Lage', kr: '지경 경' },
    ],
    family: ['국경 (Landesgrenze)', '순환 (Kreislauf)'],
  },
  자연: {
    hanja: '自然',
    roots: [
      { syllable: '자', char: '自', de: 'von selbst, eigen', kr: '스스로 자' },
      { syllable: '연', char: '然', de: 'so sein, Zustand', kr: '그럴 연' },
    ],
    family: ['자유 (Freiheit)', '자신 (selbst)', '당연 (selbstverständlich)'],
  },
  전통: {
    hanja: '傳統',
    roots: [
      { syllable: '전', char: '傳', de: 'überliefern, weitergeben', kr: '전할 전' },
      { syllable: '통', char: '統', de: 'verbinden, Linie', kr: '거느릴 통' },
    ],
    family: ['전달 (Übermittlung)', '통일 (Wiedervereinigung)'],
  },
  인구: {
    hanja: '人口',
    roots: [
      { syllable: '인', char: '人', de: 'Mensch, Person', kr: '사람 인' },
      { syllable: '구', char: '口', de: 'Mund, Kopfzahl', kr: '입 구' },
    ],
    family: ['인간 (Mensch)', '입구 (Eingang)', '출구 (Ausgang)'],
  },
  경제: {
    hanja: '經濟',
    roots: [
      { syllable: '경', char: '經', de: 'verwalten, steuern', kr: '다스릴 경' },
      { syllable: '제', char: '濟', de: 'helfen, überqueren', kr: '건널 제' },
    ],
    family: ['경영 (Betriebswirtschaft)', '구제 (Rettung/Hilfe)'],
  },
  사건: {
    hanja: '事件',
    roots: [
      { syllable: '사', char: '事', de: 'Sache, Ereignis', kr: '일 사' },
      { syllable: '건', char: '件', de: 'Fall, Gegenstand', kr: '사건 건' },
    ],
    family: ['사고 (Unfall)', '조건 (Bedingung)', '사실 (Tatsache)'],
  },
  사고: {
    hanja: '事故',
    roots: [
      { syllable: '사', char: '事', de: 'Ereignis, Angelegenheit', kr: '일 사' },
      { syllable: '고', char: '故', de: 'Grund, Zwischenfall', kr: '연고 고' },
    ],
    family: ['사건 (Vorfall)', '고장 (Defekt)'],
  },
  현상: {
    hanja: '現象',
    roots: [
      { syllable: '현', char: '現', de: 'erscheinen, gegenwärtig', kr: '나타날 현' },
      { syllable: '상', char: '象', de: 'Gestalt, Erscheinung', kr: '코끼리/모양 상' },
    ],
    family: ['현재 (Gegenwart)', '현실 (Realität)', '인상 (Eindruck)'],
  },
  규칙: {
    hanja: '規則',
    roots: [
      { syllable: '규', char: '規', de: 'Zirkel, Norm', kr: '법 규' },
      { syllable: '칙', char: '則', de: 'Regel, Gesetz', kr: '법칙 칙' },
    ],
    family: ['원칙 (Prinzip)', '법칙 (Gesetzmäßigkeit)'],
  },
  법: {
    hanja: '法',
    roots: [
      { syllable: '법', char: '法', de: 'Gesetz, Methode, Recht', kr: '법 법' },
    ],
    family: ['방법 (Methode)', '문법 (Grammatik)', '법률 (Gesetz)'],
  },

  // === TOPIK II NOMEN: Beruf & Entwicklung ===
  목표: {
    hanja: '目標',
    roots: [
      { syllable: '목', char: '目', de: 'Auge, Blickpunkt', kr: '눈 목' },
      { syllable: '표', char: '標', de: 'Zeichen, Orientierung', kr: '표할 표' },
    ],
    family: ['목적 (Zweck)', '표시 (Markierung)', '표현 (Ausdruck)'],
  },
  계획: {
    hanja: '計劃',
    roots: [
      { syllable: '계', char: '計', de: 'berechnen, planen', kr: '셈할 계' },
      { syllable: '획', char: '劃', de: 'Linie ziehen, entwerfen', kr: '그을 획' },
    ],
    family: ['계산 (Berechnung)', '기획 (Konzeption)', '시계 (Uhr)'],
  },
  결과: {
    hanja: '結果',
    roots: [
      { syllable: '결', char: '結', de: 'knüpfen, hervorbringen', kr: '맺을 결' },
      { syllable: '과', char: '果', de: 'Frucht, Resultat', kr: '열매 과' },
    ],
    family: ['결정 (Entscheidung)', '과일 (Obst)', '효과 (Effekt)'],
  },
  원인: {
    hanja: '原因',
    roots: [
      { syllable: '원', char: '原', de: 'Ursprung, Quelle', kr: '근원 원' },
      { syllable: '인', char: '因', de: 'Ursache, Grund', kr: '인할 인' },
    ],
    family: ['원칙 (Prinzip)', '원래 (ursprünglich)', '요인 (Faktor)'],
  },
  이유: {
    hanja: '理由',
    roots: [
      { syllable: '이', char: '理', de: 'Vernunft, Prinzip', kr: '다스릴 리' },
      { syllable: '유', char: '由', de: 'Grund, Herkunft', kr: '말미암을 유' },
    ],
    family: ['이해 (Verständnis)', '자유 (Freiheit)'],
  },
  과정: {
    hanja: '過程',
    roots: [
      { syllable: '과', char: '過', de: 'durchlaufen, passieren', kr: '지날 과' },
      { syllable: '정', char: '程', de: 'Wegstrecke, Ablauf', kr: '길 정' },
    ],
    family: ['과거 (Vergangenheit)', '일정 (Zeitplan)'],
  },
  방법: {
    hanja: '方法',
    roots: [
      { syllable: '방', char: '方', de: 'Richtung, Weg', kr: '모 방' },
      { syllable: '법', char: '法', de: 'Methode, Gesetz', kr: '법 법' },
    ],
    family: ['방향 (Richtung)', '문법 (Grammatik)'],
  },
  성공: {
    hanja: '成功',
    roots: [
      { syllable: '성', char: '成', de: 'vollenden, werden', kr: '이룰 성' },
      { syllable: '공', char: '功', de: 'Verdienst, Leistung', kr: '공 공' },
    ],
    family: ['성장 (Wachstum)', '성적 (Note/Ergebnis)'],
  },
  실패: {
    hanja: '失敗',
    roots: [
      { syllable: '실', char: '失', de: 'verlieren, verfehlen', kr: '잃을 실' },
      { syllable: '패', char: '敗', de: 'scheitern, Niederlage', kr: '패할 패' },
    ],
    family: ['실수 (Fehler)', '실망 (Enttäuschung)'],
  },
  노력: {
    hanja: '努力',
    roots: [
      { syllable: '노', char: '努', de: 'sich anstrengen', kr: '힘쓸 노' },
      { syllable: '력', char: '力', de: 'Kraft, Stärke', kr: '힘 력' },
    ],
    family: ['능력 (Fähigkeit)', '실력 (Können)', '체력 (Körperkraft)'],
  },
  능력: {
    hanja: '能力',
    roots: [
      { syllable: '능', char: '能', de: 'fähig sein, Können', kr: '능할 능' },
      { syllable: '력', char: '力', de: 'Kraft', kr: '힘 력' },
    ],
    family: ['가능 (möglich)', '노력 (Bemühung)', '재능 (Talent)'],
  },
  실력: {
    hanja: '實力',
    roots: [
      { syllable: '실', char: '實', de: 'wahr, echt, Frucht', kr: '열매 실' },
      { syllable: '력', char: '力', de: 'Kraft, Können', kr: '힘 력' },
    ],
    family: ['사실 (Tatsache)', '현실 (Realität)', '실제 (Praxis)'],
  },
  책임: {
    hanja: '責任',
    roots: [
      { syllable: '책', char: '責', de: 'Pflicht, fordern', kr: '꾸짖을 책' },
      { syllable: '임', char: '任', de: 'anvertrauen, Amt', kr: '맡길 임' },
    ],
    family: ['임무 (Aufgabe)', '책임감 (Verantwortungsgefühl)'],
  },
  자격: {
    hanja: '資格',
    roots: [
      { syllable: '자', char: '資', de: 'Anlage, Mittel', kr: '재물 자' },
      { syllable: '격', char: '格', de: 'Status, Rang, Norm', kr: '격식 격' },
    ],
    family: ['자격증 (Zertifikat)', '성격 (Charakter)', '가격 (Preis)'],
  },
  경력: {
    hanja: '經歷',
    roots: [
      { syllable: '경', char: '經', de: 'durchlaufen', kr: '지날 경' },
      { syllable: '력', char: '歷', de: 'Verlauf, Geschichte', kr: '지낼 력' },
    ],
    family: ['경험 (Erfahrung)', '이력서 (Lebenslauf)', '역사 (Geschichte)'],
  },
  자료: {
    hanja: '資料',
    roots: [
      { syllable: '자', char: '資', de: 'Ressource, Basis', kr: '재물 자' },
      { syllable: '료', char: '料', de: 'Material, Stoff', kr: '헤아릴 료' },
    ],
    family: ['재료 (Zutaten)', '무료 (kostenlos)', '요금 (Gebühr)'],
  },
  정보: {
    hanja: '情報',
    roots: [
      { syllable: '정', char: '情', de: 'Umstand, Gefühl', kr: '뜻 정' },
      { syllable: '보', char: '報', de: 'berichten, melden', kr: '알릴 보' },
    ],
    family: ['보고서 (Bericht)', '예보 (Vorhersage)'],
  },
  기술: {
    hanja: '技術',
    roots: [
      { syllable: '기', char: '技', de: 'Fertigkeit, Handwerk', kr: '재주 기' },
      { syllable: '술', char: '術', de: 'Kunst, Technik', kr: '재주 술' },
    ],
    family: ['예술 (Kunst)', '수술 (Operation)', '미술 (Bildende Kunst)'],
  },

  // === TOPIK II NOMEN: Kommunikation & Denken ===
  관계: {
    hanja: '關係',
    roots: [
      { syllable: '관', char: '關', de: 'betreffen, verbinden', kr: '관계할 관' },
      { syllable: '계', char: '係', de: 'verknüpfen, Bezug', kr: '맬 계' },
    ],
    family: ['관심 (Interesse)', '관련 (Zusammenhang)'],
  },
  대화: {
    hanja: '對話',
    roots: [
      { syllable: '대', char: '對', de: 'gegenüber, erwidern', kr: '대할 대' },
      { syllable: '화', char: '話', de: 'sprechen, Rede', kr: '말씀 화' },
    ],
    family: ['통화 (Telefonat)', '회화 (Konversation)', '화제 (Gesprächsthema)'],
  },
  의견: {
    hanja: '意見',
    roots: [
      { syllable: '의', char: '意', de: 'Sinn, Gedanke', kr: '뜻 의' },
      { syllable: '견', char: '見', de: 'sehen, Ansicht', kr: '볼 견' },
    ],
    family: ['의미 (Bedeutung)', '발견 (Entdeckung)', '편견 (Vorurteil)'],
  },
  주장: {
    hanja: '主張',
    roots: [
      { syllable: '주', char: '主', de: 'Hauptsache, Herr', kr: '주인 주' },
      { syllable: '장', char: '張', de: 'ausbreiten, vertreten', kr: '베풀 장' },
    ],
    family: ['주제 (Thema)', '주인공 (Hauptfigur)', '긴장 (Anspannung)'],
  },
  태도: {
    hanja: '態度',
    roots: [
      { syllable: '태', char: '態', de: 'Haltung, Gestalt', kr: '모양 태' },
      { syllable: '도', char: '度', de: 'Maß, Auftreten', kr: '법도 도' },
    ],
    family: ['상태 (Zustand)', '속도 (Geschwindigkeit)', '온도 (Temperatur)'],
  },
  성격: {
    hanja: '性格',
    roots: [
      { syllable: '성', char: '性', de: 'Wesen, Natur', kr: '성품 성' },
      { syllable: '격', char: '格', de: 'Charakter, Format', kr: '격식 격' },
    ],
    family: ['개성 (Individualität)', '자격 (Qualifikation)', '인격 (Persönlichkeit)'],
  },
  '버릇 / 습관': {
    hanja: '순우리말 / 習慣',
    roots: [
      { syllable: '습', char: '習', de: 'üben, sich gewöhnen', kr: '익힐 습' },
      { syllable: '관', char: '慣', de: 'Gewohnheit, vertraut', kr: '익숙할 관' },
    ],
    family: ['연습 (Übung)', '복습 (Wiederholung)', '예습 (Vorbereitung)'],
  },
  습관: {
    hanja: '習慣',
    roots: [
      { syllable: '습', char: '習', de: 'üben, lernen', kr: '익힐 습' },
      { syllable: '관', char: '慣', de: 'Gewohnheit', kr: '익숙할 관' },
    ],
    family: ['연습 (Übung)', '복습 (Wiederholung)'],
  },
  기억: {
    hanja: '記憶',
    roots: [
      { syllable: '기', char: '記', de: 'aufzeichnen, merken', kr: '기록할 기' },
      { syllable: '억', char: '憶', de: 'sich erinnern, denken', kr: '생각할 억' },
    ],
    family: ['일기 (Tagebuch)', '기록 (Aufzeichnung)', '추억 (schöne Erinnerung)'],
  },
  감정: {
    hanja: '感情',
    roots: [
      { syllable: '감', char: '感', de: 'fühlen, empfinden', kr: '느낄 감' },
      { syllable: '정', char: '情', de: 'Gefühl, Zuneigung', kr: '뜻 정' },
    ],
    family: ['감사 (Dank)', '감동 (Rührung)', '표정 (Gesichtsausdruck)'],
  },
  분위기: {
    hanja: '雰圍氣',
    roots: [
      { syllable: '분', char: '雰', de: 'Dunst, Atmosphäre', kr: '안개 분' },
      { syllable: '위', char: '圍', de: 'umgeben, Umkreis', kr: '둘레 위' },
      { syllable: '기', char: '氣', de: 'Luft, Energie, Stimmung', kr: '기운 기' },
    ],
    family: ['기분 (Laune)', '공기 (Luft)', '주위 (Umgebung)'],
  },
  상황: {
    hanja: '狀況',
    roots: [
      { syllable: '상', char: '狀', de: 'Zustand, Form', kr: '모양 상' },
      { syllable: '황', char: '況', de: 'Lage, Umstand', kr: '상황 황' },
    ],
    family: ['상태 (Zustand)', '현황 (aktuelle Lage)'],
  },
  상태: {
    hanja: '狀態',
    roots: [
      { syllable: '상', char: '狀', de: 'Erscheinung, Zustand', kr: '모양 상' },
      { syllable: '태', char: '態', de: 'Beschaffenheit, Haltung', kr: '모양 태' },
    ],
    family: ['태도 (Einstellung)', '상황 (Situation)'],
  },
  입장: {
    hanja: '立場',
    roots: [
      { syllable: '입', char: '立', de: 'stehen, aufstellen', kr: '설 립' },
      { syllable: '장', char: '場', de: 'Ort, Platz, Stelle', kr: '마당 장' },
    ],
    family: ['독립 (Unabhängigkeit)', '장소 (Ort)', '직장 (Arbeitsplatz)'],
  },
  차이: {
    hanja: '差異',
    roots: [
      { syllable: '차', char: '差', de: 'Abweichung, Differenz', kr: '다를 차' },
      { syllable: '이', char: '異', de: 'verschieden, anders', kr: '다를 이' },
    ],
    family: ['차별 (Diskriminierung)', '이상 (ungewöhnlich)'],
  },
  공통점: {
    hanja: '共通點',
    roots: [
      { syllable: '공', char: '共', de: 'gemeinsam, zusammen', kr: '한가지 공' },
      { syllable: '통', char: '通', de: 'durchgehen, verbinden', kr: '통할 통' },
      { syllable: '점', char: '點', de: 'Punkt, Aspekt', kr: '점 점' },
    ],
    family: ['공공 (öffentlich)', '장점 (Vorteil)', '단점 (Nachteil)'],
  },
  '장점 / 단점': {
    hanja: '長點 / 短點',
    roots: [
      { syllable: '장', char: '長', de: 'lang, Stärke, Vorzug', kr: '길 장' },
      { syllable: '단', char: '短', de: 'kurz, Mangel, Schwäche', kr: '짧을 단' },
      { syllable: '점', char: '點', de: 'Punkt, Merkmal', kr: '점 점' },
    ],
    family: ['장기 (Langzeit/Stärke)', '단기 (Kurzzeit)', '공통점 (Gemeinsamkeit)'],
  },
  영향: {
    hanja: '影響',
    roots: [
      { syllable: '영', char: '影', de: 'Schatten, Spiegelbild', kr: '그림자 영' },
      { syllable: '향', char: '響', de: 'Echo, Widerhall', kr: '울릴 향' },
    ],
    family: ['촬영 (Dreh/Fotografie)', '음향 (Akustik/Sound)'],
  },
  '효과 / 해결': {
    hanja: '效果 / 解決',
    roots: [
      { syllable: '효', char: '效', de: 'Wirkung, nachahmen', kr: '본받을 효' },
      { syllable: '과', char: '果', de: 'Ergebnis, Frucht', kr: '열매 과' },
      { syllable: '해', char: '解', de: 'lösen, entwirren', kr: '풀 해' },
      { syllable: '결', char: '決', de: 'entscheiden, klären', kr: '결단할 결' },
    ],
    family: ['결과 (Ergebnis)', '이해 (Verständnis)', '결정 (Entscheidung)'],
  },

  // === TOPIK II VERBEN ===
  '변하다 / 바뀌다': {
    hanja: '變하다',
    roots: [
      { syllable: '변', char: '變', de: 'sich verändern, wandeln', kr: '변할 변' },
    ],
    family: ['변화 (Veränderung)', '변경 (Änderung)'],
  },
  발전하다: {
    hanja: '發展',
    roots: [
      { syllable: '발', char: '發', de: 'aufbrechen, entfalten', kr: '필 발' },
      { syllable: '전', char: '展', de: 'ausbreiten, erweitern', kr: '펼 전' },
    ],
    family: ['개발 (Entwicklung)', '출발 (Abfahrt)', '전시회 (Ausstellung)'],
  },
  개발하다: {
    hanja: '開發',
    roots: [
      { syllable: '개', char: '開', de: 'öffnen, erschließen', kr: '열 개' },
      { syllable: '발', char: '發', de: 'hervorbringen, entfalten', kr: '필 발' },
    ],
    family: ['공개 (Veröffentlichung)', '발전 (Fortschritt)', '발견 (Entdeckung)'],
  },
  유지하다: {
    hanja: '維持',
    roots: [
      { syllable: '유', char: '維', de: 'halten, Band', kr: '바 유' },
      { syllable: '지', char: '持', de: 'bewahren, stützen', kr: '가질 지' },
    ],
    family: ['지지 (Unterstützung)', '지속 (Fortdauer)'],
  },
  결정하다: {
    hanja: '決定',
    roots: [
      { syllable: '결', char: '決', de: 'beschließen, durchbrechen', kr: '결단할 결' },
      { syllable: '정', char: '定', de: 'festlegen, bestimmen', kr: '정할 정' },
    ],
    family: ['해결 (Lösung)', '결심 (Entschluss)', '예정 (geplant)'],
  },
  선택하다: {
    hanja: '選擇',
    roots: [
      { syllable: '선', char: '選', de: 'wählen, auslesen', kr: '가릴 선' },
      { syllable: '택', char: '擇', de: 'aussuchen', kr: '가릴 택' },
    ],
    family: ['선수 (Athlet/Ausgewählter)', '선거 (Wahl)'],
  },
  해결하다: {
    hanja: '解決',
    roots: [
      { syllable: '해', char: '解', de: 'auflösen, erklären', kr: '풀 해' },
      { syllable: '결', char: '決', de: 'entscheiden, klären', kr: '결단할 결' },
    ],
    family: ['이해 (Verstehen)', '오해 (Missverständnis)', '결정 (Entscheidung)'],
  },
  포기하다: {
    hanja: '抛棄',
    roots: [
      { syllable: '포', char: '抛', de: 'wegwerfen, fallenlassen', kr: '던질 포' },
      { syllable: '기', char: '棄', de: 'aufgeben, verwerfen', kr: '버릴 기' },
    ],
    family: ['기권 (Verzicht/Aufgabe)'],
  },
  집중하다: {
    hanja: '集中',
    roots: [
      { syllable: '집', char: '集', de: 'sammeln, bündeln', kr: '모을 집' },
      { syllable: '중', char: '中', de: 'Mitte, Zentrum', kr: '가운데 중' },
    ],
    family: ['모집 (Anwerbung)', '중심 (Zentrum)', '중요 (wichtig)'],
  },
  예상하다: {
    hanja: '豫想',
    roots: [
      { syllable: '예', char: '豫', de: 'im Voraus, vorher', kr: '미리 예' },
      { syllable: '상', char: '想', de: 'denken, sich vorstellen', kr: '생각 상' },
    ],
    family: ['예약 (Reservierung)', '예보 (Wetterbericht)', '상상 (Fantasie)'],
  },
  기대하다: {
    hanja: '期待',
    roots: [
      { syllable: '기', char: '期', de: 'Zeitpunkt, hoffen auf', kr: '기약할 기' },
      { syllable: '대', char: '待', de: 'warten, erwarten', kr: '기다릴 대' },
    ],
    family: ['기간 (Zeitraum)', '학기 (Semester)', '대기 (Warten)'],
  },
  비교하다: {
    hanja: '比較',
    roots: [
      { syllable: '비', char: '比', de: 'vergleichen, nebeneinander', kr: '견줄 비' },
      { syllable: '교', char: '較', de: 'abwägen, messen', kr: '견줄 교' },
    ],
    family: ['비율 (Quote/Verhältnis)', '비교적 (vergleichsweise)'],
  },
  확인하다: {
    hanja: '確認',
    roots: [
      { syllable: '확', char: '確', de: 'sicher, fest, genau', kr: '굳을 확' },
      { syllable: '인', char: '認', de: 'erkennen, bestätigen', kr: '알 인' },
    ],
    family: ['정확 (genau)', '확실 (sicher)', '인정 (Anerkennung)'],
  },
  인정하다: {
    hanja: '認定',
    roots: [
      { syllable: '인', char: '認', de: 'anerkennen, prüfen', kr: '알 인' },
      { syllable: '정', char: '定', de: 'feststellen', kr: '정할 정' },
    ],
    family: ['확인 (Bestätigung)', '인식 (Erkenntnis)', '결정 (Entscheidung)'],
  },
  의심하다: {
    hanja: '疑心',
    roots: [
      { syllable: '의', char: '疑', de: 'zweifeln, argwöhnen', kr: '의심할 의' },
      { syllable: '심', char: '心', de: 'Herz, Geist, Sinn', kr: '마음 심' },
    ],
    family: ['의문 (Frage/Zweifel)', '관심 (Interesse)', '안심 (Erleichterung)'],
  },
  후회하다: {
    hanja: '後悔',
    roots: [
      { syllable: '후', char: '後', de: 'danach, später', kr: '뒤 후' },
      { syllable: '회', char: '悔', de: 'bereuen', kr: '뉘우칠 회' },
    ],
    family: ['오후 (Nachmittag)', '최후 (letzter)'],
  },
  표현하다: {
    hanja: '表現',
    roots: [
      { syllable: '표', char: '表', de: 'Außenseite, ausdrücken', kr: '겉 표' },
      { syllable: '현', char: '現', de: 'zeigen, erscheinen', kr: '나타날 현' },
    ],
    family: ['발표 (Präsentation)', '표정 (Mimik)', '현상 (Phänomen)'],
  },
  설명하다: {
    hanja: '說明',
    roots: [
      { syllable: '설', char: '說', de: 'erklären, darlegen', kr: '말씀 설' },
      { syllable: '명', char: '明', de: 'hell, klar, deutlich', kr: '밝을 명' },
    ],
    family: ['설득 (Überzeugung)', '소설 (Roman)', '분명 (eindeutig)'],
  },
  주장하다: {
    hanja: '主張',
    roots: [
      { syllable: '주', char: '主', de: 'Haupt-, leiten', kr: '주인 주' },
      { syllable: '장', char: '張', de: 'vertreten, spannen', kr: '베풀 장' },
    ],
    family: ['주제 (Thema)', '강조 (Betonung)'],
  },
  설득하다: {
    hanja: '說得',
    roots: [
      { syllable: '설', char: '說', de: 'reden, darlegen', kr: '말씀 설' },
      { syllable: '득', char: '得', de: 'erlangen, gewinnen', kr: '얻을 득' },
    ],
    family: ['설명 (Erklärung)', '이득 (Gewinn/Vorteil)'],
  },
  칭찬하다: {
    hanja: '稱讚',
    roots: [
      { syllable: '칭', char: '稱', de: 'nennen, rühmen', kr: '일컬을 칭' },
      { syllable: '찬', char: '讚', de: 'loben, preisen', kr: '기릴 찬' },
    ],
    family: ['찬성 (Zustimmung)'],
  },
  비판하다: {
    hanja: '批判',
    roots: [
      { syllable: '비', char: '批', de: 'prüfen, kritisieren', kr: '비평할 비' },
      { syllable: '판', char: '判', de: 'urteilen, unterscheiden', kr: '판단할 판' },
    ],
    family: ['판단 (Urteil)', '재판 (Gerichtsprozess)'],
  },
  오해하다: {
    hanja: '誤解',
    roots: [
      { syllable: '오', char: '誤', de: 'Irrtum, falsch', kr: '그르칠 오' },
      { syllable: '해', char: '解', de: 'verstehen, lösen', kr: '풀 해' },
    ],
    family: ['이해 (Verständnis)', '해결 (Lösung)', '오류 (Fehler)'],
  },
  화해하다: {
    hanja: '和解',
    roots: [
      { syllable: '화', char: '和', de: 'Harmonie, Frieden', kr: '화할 화' },
      { syllable: '해', char: '解', de: 'auflösen (Konflikt)', kr: '풀 해' },
    ],
    family: ['평화 (Frieden)', '조화 (Harmonie)'],
  },
  용서하다: {
    hanja: '容恕',
    roots: [
      { syllable: '용', char: '容', de: 'dulden, aufnehmen', kr: '얼굴/용납할 용' },
      { syllable: '서', char: '恕', de: 'vergeben, nachsichtig sein', kr: '용서할 서' },
    ],
    family: ['내용 (Inhalt)', '허용 (Erlaubnis)'],
  },
  배려하다: {
    hanja: '配慮',
    roots: [
      { syllable: '배', char: '配', de: 'zuteilen, achten auf', kr: '나눌 배' },
      { syllable: '려', char: '慮', de: 'bedenken, sich sorgen', kr: '생각할 려' },
    ],
    family: ['고려 (Berücksichtigung)', '염려 (Sorge)'],
  },
  '참여하다 / 참석하다': {
    hanja: '參與 / 參席',
    roots: [
      { syllable: '참', char: '參', de: 'teilnehmen, beitreten', kr: '참여할 참' },
      { syllable: '여', char: '與', de: 'mitwirken, geben', kr: '더불 여' },
      { syllable: '석', char: '席', de: 'Sitzplatz', kr: '자리 석' },
    ],
    family: ['참가 (Teilnahme)', '좌석 (Sitzplatz)', '결석 (Abwesenheit)'],
  },
  '경험하다 / 겪다': {
    hanja: '經驗하다',
    roots: [
      { syllable: '경', char: '經', de: 'durchmachen', kr: '지날 경' },
      { syllable: '험', char: '驗', de: 'erproben, erfahren', kr: '시험 험' },
    ],
    family: ['체험 (Erlebnis)', '시험 (Prüfung)'],
  },
  노력하다: {
    hanja: '努力',
    roots: [
      { syllable: '노', char: '努', de: 'sich bemühen', kr: '힘쓸 노' },
      { syllable: '력', char: '力', de: 'Kraft', kr: '힘 력' },
    ],
    family: ['능력 (Fähigkeit)', '실력 (Können)'],
  },
  '성공하다 / 실패하다': {
    hanja: '成功 / 失敗',
    roots: [
      { syllable: '성', char: '成', de: 'vollenden', kr: '이룰 성' },
      { syllable: '공', char: '功', de: 'Erfolg, Leistung', kr: '공 공' },
      { syllable: '실', char: '失', de: 'verlieren', kr: '잃을 실' },
      { syllable: '패', char: '敗', de: 'scheitern', kr: '패할 패' },
    ],
    family: ['성취 (Errungenschaft)', '실수 (Fehler)'],
  },
  '영향을 미치다 (주다)': {
    hanja: '影響',
    roots: [
      { syllable: '영', char: '影', de: 'Schatten, Abbild', kr: '그림자 영' },
      { syllable: '향', char: '響', de: 'Widerhall, Echo', kr: '울릴 향' },
    ],
    family: ['영향력 (Einflusskraft)'],
  },
  '이용하다 / 사용하다': {
    hanja: '利用 / 使用',
    roots: [
      { syllable: '이', char: '利', de: 'Nutzen, Vorteil', kr: '이로울 리' },
      { syllable: '사', char: '使', de: 'benutzen, einsetzen', kr: '부릴 사' },
      { syllable: '용', char: '用', de: 'gebrauchen, anwenden', kr: '쓸 용' },
    ],
    family: ['편리 (bequem)', '활용 (Anwendung)', '비용 (Kosten)'],
  },
  제공하다: {
    hanja: '提供',
    roots: [
      { syllable: '제', char: '提', de: 'darreichen, vorlegen', kr: '끌 제' },
      { syllable: '공', char: '供', de: 'bereitstellen, liefern', kr: '바칠 공' },
    ],
    family: ['제안 (Vorschlag)', '공급 (Versorgung/Angebot)'],
  },
  발견하다: {
    hanja: '發見',
    roots: [
      { syllable: '발', char: '發', de: 'enthüllen, aufdecken', kr: '필 발' },
      { syllable: '견', char: '見', de: 'sehen, erblicken', kr: '볼 견' },
    ],
    family: ['발명 (Erfindung)', '의견 (Meinung)'],
  },
  피하다: {
    hanja: '避하다',
    roots: [
      { syllable: '피', char: '避', de: 'ausweichen, meiden', kr: '피할 피' },
    ],
    family: ['대피 (Evakuierung)', '피난 (Flucht/Schutz)'],
  },
  '피동 (Passiv): -이/히/리/기-': {
    hanja: '被動',
    roots: [
      { syllable: '피', char: '被', de: 'erleiden, empfangen', kr: '입을 피' },
      { syllable: '동', char: '動', de: 'bewegen, handeln', kr: '움직일 동' },
    ],
    family: ['피해 (Schaden)', '행동 (Handlung)'],
  },
  '사동 (Kausativ): -이/히/리/기/우/추-': {
    hanja: '使動',
    roots: [
      { syllable: '사', char: '使', de: 'veranlassen, einsetzen', kr: '부릴 사' },
      { syllable: '동', char: '動', de: 'bewegen, handeln', kr: '움직일 동' },
    ],
    family: ['사용 (Gebrauch)', '대사관 (Botschaft)'],
  },
};

/**
 * High-frequency TOPIK Hanja Syllable Lexicon for automatic root recognition
 * on newly added custom Sino-Korean vocabulary.
 */
const HANJA_SYLLABLE_FALLBACK: Record<string, HanjaRootSyllable> = {
  학: { syllable: '학', char: '學', de: 'lernen, Wissenschaft', kr: '배울 학' },
  생: { syllable: '생', char: '生', de: 'Leben, geboren werden, Schüler', kr: '날 생' },
  교: { syllable: '교', char: '校', de: 'Schule, prüfen', kr: '학교 교' },
  원: { syllable: '원', char: '院', de: 'Institut, Einrichtung', kr: '집 원' },
  문: { syllable: '문', char: '文', de: 'Schrift, Kultur', kr: '글월 문' },
  화: { syllable: '화', char: '化', de: 'werden, Wandel', kr: '될 화' },
  사: { syllable: '사', char: '社', de: 'Gesellschaft, Firma', kr: '모일 사' },
  회: { syllable: '회', char: '會', de: 'Versammlung, treffen', kr: '모일 회' },
  인: { syllable: '인', char: '人', de: 'Mensch, Person', kr: '사람 인' },
  국: { syllable: '국', char: '國', de: 'Land, Staat', kr: '나라 국' },
  어: { syllable: '어', char: '語', de: 'Sprache, Wort', kr: '말씀 어' },
  식: { syllable: '식', char: '食', de: 'Essen, Speise', kr: '밥 식' },
  실: { syllable: '실', char: '室', de: 'Raum, Zimmer', kr: '집 실' },
  도: { syllable: '도', char: '道', de: 'Weg, Provinz, Prinzip', kr: '길 도' },
  서: { syllable: '서', char: '書', de: 'Buch, Schrift', kr: '글 서' },
  관: { syllable: '관', char: '館', de: 'Gebäude, Halle', kr: '집 관' },
  자: { syllable: '자', char: '自', de: 'selbst, von Natur aus', kr: '스스로 자' },
  동: { syllable: '동', char: '動', de: 'bewegen, handeln', kr: '움직일 동' },
  력: { syllable: '력', char: '力', de: 'Kraft, Fähigkeit', kr: '힘 력' },
  심: { syllable: '심', char: '心', de: 'Herz, Geist', kr: '마음 심' },
  발: { syllable: '발', char: '發', de: 'entfalten, aufbrechen', kr: '필 발' },
  전: { syllable: '전', char: '展', de: 'ausbreiten, entwickeln', kr: '펼 전' },
  해: { syllable: '해', char: '解', de: 'lösen, verstehen', kr: '풀 해' },
  결: { syllable: '결', char: '決', de: 'entscheiden, klären', kr: '결단할 결' },
  정: { syllable: '정', char: '定', de: 'festlegen, bestimmen', kr: '정할 정' },
  한: { syllable: '한', char: '韓', de: 'Korea', kr: '한국 한' },
  시: { syllable: '시', char: '時', de: 'Zeit, Stunde', kr: '때 시' },
  간: { syllable: '간', char: '間', de: 'Zwischenraum, Intervall', kr: '사이 간' },
  병: { syllable: '병', char: '病', de: 'Krankheit, Leiden', kr: '병 병' },
  은: { syllable: '은', char: '銀', de: 'Silber, Geld', kr: '은 은' },
  행: { syllable: '행', char: '行', de: 'gehen, Handel treiben', kr: '다닐 행' },
  진: { syllable: '진', char: '眞', de: 'wahr, echt', kr: '참 진' },
  선: { syllable: '선', char: '先', de: 'zuerst, vorangehend', kr: '먼저 선' },
  수: { syllable: '수', char: '手', de: 'Hand, Könner, Fachmann', kr: '손 수' },
  공: { syllable: '공', char: '工', de: 'Arbeit, Fleiß', kr: '장인 공' },
  부: { syllable: '부', char: '夫', de: 'Mann, Ausdauer', kr: '지아비 부' },
  음: { syllable: '음', char: '音', de: 'Klang, Ton', kr: '소리 음' },
  악: { syllable: '악', char: '樂', de: 'Musik, Freude', kr: '풍류 악' },
  신: { syllable: '신', char: '新', de: 'neu, frisch', kr: '새 신' },
  가: { syllable: '가', char: '歌', de: 'Lied, Gesang', kr: '노래 가' },
  통: { syllable: '통', char: '通', de: 'durchgehen, verkehren', kr: '통할 통' },
  출: { syllable: '출', char: '出', de: 'hinausgehen, herauskommen', kr: '날 출' },
  입: { syllable: '입', char: '入', de: 'eintreten, hineingehen', kr: '들 입' },
  구: { syllable: '구', char: '口', de: 'Mündung, Öffnung, Kopfzahl', kr: '입 구' },
  직: { syllable: '직', char: '職', de: 'Beruf, Amt, Dienst', kr: '직분 직' },
  업: { syllable: '업', char: '業', de: 'Gewerbe, Tätigkeit', kr: '업 업' },
  필: { syllable: '필', char: '必', de: 'unbedingt, zwingend', kr: '반드시 필' },
  요: { syllable: '요', char: '要', de: 'wichtig, fordern', kr: '요긴할 요' },
  중: { syllable: '중', char: '重', de: 'schwer, gewichtig', kr: '무거울 중' },
  유: { syllable: '유', char: '有', de: 'haben, vorhanden sein', kr: '있을 유' },
  무: { syllable: '무', char: '無', de: 'ohne, nichts, fehlen', kr: '없을 무' },
  명: { syllable: '명', char: '名', de: 'Name, Ruhm', kr: '이름 명' },
  안: { syllable: '안', char: '案', de: 'Plan, Vorschlag', kr: '책상/생각 안' },
  내: { syllable: '내', char: '內', de: 'innen, leiten', kr: '안 내' },
  외: { syllable: '외', char: '外', de: 'außen, fremd', kr: '바깥 외' },
  소: { syllable: '소', char: '紹', de: 'verknüpfen, fortführen', kr: '이었을 소' },
  개: { syllable: '개', char: '介', de: 'vermitteln, dazwischen', kr: '끼일 개' },
  연: { syllable: '연', char: '練', de: 'üben, stählen', kr: '익힐 련' },
  습: { syllable: '습', char: '習', de: 'lernen, einüben', kr: '익힐 습' },
  복: { syllable: '복', char: '復', de: 'wiederkehren, wiederholen', kr: '회복할 복' },
  대: { syllable: '대', char: '大', de: 'groß, bedeutend', kr: '큰 대' },
  소2: { syllable: '소', char: '小', de: 'klein', kr: '작을 소' },
  당: { syllable: '당', char: '堂', de: 'Halle, Versammlungsraum', kr: '집 당' },
  차: { syllable: '차', char: '車', de: 'Wagen, Fahrzeug', kr: '수레 차' },
  점: { syllable: '점', char: '店', de: 'Laden, Geschäft', kr: '가게 점' },
};

/**
 * Looks up or derives the Hanja roots for a given Korean vocabulary item.
 * Supports:
 * - Curated word-level dictionary
 * - Automatic decomposition via high-frequency Sino-Korean roots
 * - Explicit Hanja embedded in parentheses (e.g. "학교(學校)") from CSVs
 * Returns null for grammar suffixes or pure Korean words (순우리말).
 */
export function getHanjaInfo(krWord: string, cat?: VocabCategory): HanjaWordEntry | null {
  if (!krWord) return null;
  const trimmed = krWord.trim();

  // Exclude grammar patterns starting with '-'
  if (cat === 'grammar' || trimmed.startsWith('-')) {
    return null;
  }

  // 1. Check if the string explicitly contains Hanja in parentheses: e.g. "학교(學校)" or "선생 (先生)"
  const hanjaInParenMatch = trimmed.match(/([가-힣]+)\s*\(([\u4E00-\u9FFF\s]+)\)/);
  if (hanjaInParenMatch) {
    const hangul = hanjaInParenMatch[1].trim();
    const hanjaChars = hanjaInParenMatch[2].replace(/\s+/g, '');
    const hangulChars = Array.from(hangul);
    const hanjaList = Array.from(hanjaChars);

    if (hangulChars.length === hanjaList.length) {
      const roots: HanjaRootSyllable[] = hangulChars.map((syl, i) => {
        const fallback = HANJA_SYLLABLE_FALLBACK[syl];
        return {
          syllable: syl,
          char: hanjaList[i],
          de: fallback?.char === hanjaList[i] ? fallback.de : `Bedeutung von ${hanjaList[i]}`,
          kr: fallback?.char === hanjaList[i] ? fallback.kr : `${hanjaList[i]}`,
        };
      });
      return {
        hanja: hanjaChars,
        roots,
      };
    }
  }

  // 2. Direct match in our curated word dictionary
  if (HANJA_WORD_DICT[trimmed]) {
    return HANJA_WORD_DICT[trimmed];
  }

  // Clean parenthetical notes
  const clean = trimmed.replace(/\([^)]*\)/g, '').trim();
  if (HANJA_WORD_DICT[clean]) {
    return HANJA_WORD_DICT[clean];
  }

  // Check if it's a native Korean word
  if (NATIVE_KOREAN_WORDS.has(clean)) {
    return null;
  }

  // If it's a '-하다' verb, check the noun root before '하다'
  if (clean.endsWith('하다') && clean.length >= 4) {
    const nounPart = clean.slice(0, -2);
    if (HANJA_WORD_DICT[nounPart]) {
      return HANJA_WORD_DICT[nounPart];
    }
    if (NATIVE_KOREAN_WORDS.has(nounPart)) {
      return null;
    }
  }

  // If the entry has a slash (e.g. "단어1 / 단어2"), try each side
  if (clean.includes('/')) {
    const parts = clean.split('/').map((s) => s.trim());
    for (const part of parts) {
      if (HANJA_WORD_DICT[part]) return HANJA_WORD_DICT[part];
      if (part.endsWith('하다') && HANJA_WORD_DICT[part.slice(0, -2)]) {
        return HANJA_WORD_DICT[part.slice(0, -2)];
      }
    }
  }

  // 3. Automatic Syllable-Level Fallback for 2–4 syllable Sino-Korean custom nouns/verbs
  const baseRoot = clean.endsWith('하다') ? clean.slice(0, -2) : clean;
  if (/^[가-힣]{2,4}$/.test(baseRoot) && !NATIVE_KOREAN_WORDS.has(baseRoot)) {
    const chars = Array.from(baseRoot);
    const matchedRoots: HanjaRootSyllable[] = [];
    for (const ch of chars) {
      if (HANJA_SYLLABLE_FALLBACK[ch]) {
        matchedRoots.push(HANJA_SYLLABLE_FALLBACK[ch]);
      } else {
        return null; // Only synthesize when all syllables are known Sino-Korean roots
      }
    }

    if (matchedRoots.length >= 2) {
      return {
        hanja: matchedRoots.map((r) => r.char).join(''),
        roots: matchedRoots,
      };
    }
  }

  return null;
}
