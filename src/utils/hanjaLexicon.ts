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
  '사람', '사랑', '마음', '아이', '아기', '어제', '오늘', '내일', '모레',
  '우리', '나라', '머리', '노래', '바다', '하늘', '바람', '구름', '비를',
  '아침', '저녁', '여름', '가을', '겨울', '하루', '나이', '이름', '마당',
  '오빠', '언니', '누나', '엄마', '아빠', '할머니', '할아버지', '아저씨',
  '강아지', '고양이', '호랑이', '코끼리', '거북이', '토끼', '오리', '여우',
  '나무', '가지', '열매', '뿌리', '하나', '둘', '셋', '넷', '다섯', '여섯',
  '일곱', '여덟', '아홉', '열', '스물', '서른', '마흔', '쉰', '아름답다',
  '고맙다', '반갑다', '즐겁다', '슬프다', '기쁘다', '아프다', '바쁘다',
  '예쁘다', '나쁘다', '크다', '작다', '많다', '적다', '길다', '짧다',
  '높다', '낮다', '넓다', '좁다', '깊다', '얕다', '버스', '택시', '커피',
  '컴퓨터', '인터넷', '텔레비전', '라디오', '카메라', '호텔', '아파트',
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

  // === ERWEITERTE TOPIK I & II KERNWÖRTER (WIRTSCHAFT, ALLTAG, GESELLSCHAFT, MEDIZIN, REISEN) ===
  정치: {
    hanja: '政治',
    roots: [
      { syllable: '정', char: '政', de: 'Politik, Regierung', kr: '정사 정' },
      { syllable: '치', char: '治', de: 'regieren, ordnen, heilen', kr: '다스릴 치' },
    ],
    family: ['정부 (Regierung)', '행정 (Verwaltung)', '치료 (Behandlung)'],
  },
  산업: {
    hanja: '産業',
    roots: [
      { syllable: '산', char: '産', de: 'produzieren, hervorbringen, Geburt', kr: '낳을 산' },
      { syllable: '업', char: '業', de: 'Gewerbe, Branche, Tätigkeit', kr: '업 업' },
    ],
    family: ['생산 (Produktion)', '농업 (Landwirtschaft)', '상업 (Handel)'],
  },
  무역: {
    hanja: '貿易',
    roots: [
      { syllable: '무', char: '貿', de: 'Handel treiben, tauschen', kr: '무역할 무' },
      { syllable: '역', char: '易', de: 'austauschen, wechseln, leicht', kr: '바꿀 역' },
    ],
    family: ['수출 (Export)', '수입 (Import)', '교역 (Handelsverkehr)'],
  },
  가격: {
    hanja: '價格',
    roots: [
      { syllable: '가', char: '價', de: 'Preis, Wert', kr: '값 가' },
      { syllable: '격', char: '格', de: 'Norm, Rang, Status', kr: '격식 격' },
    ],
    family: ['가치 (Wert)', '물가 (Preisniveau)', '자격 (Qualifikation)'],
  },
  비용: {
    hanja: '費用',
    roots: [
      { syllable: '비', char: '費', de: 'Kosten, Gebühr, ausgeben', kr: '쓸 비' },
      { syllable: '용', char: '用', de: 'gebrauchen, nutzen', kr: '쓸 용' },
    ],
    family: ['학비 (Studiengebühr)', '생활비 (Lebenshaltungskosten)', '소비 (Konsum)'],
  },
  품질: {
    hanja: '品質',
    roots: [
      { syllable: '품', char: '品', de: 'Ware, Produkt, Güte', kr: '물건 품' },
      { syllable: '질', char: '質', de: 'Qualität, Beschaffenheit, Frage', kr: '바탕 질' },
    ],
    family: ['제품 (Produkt)', '상품 (Handelsware)', '질문 (Frage)'],
  },
  수량: {
    hanja: '數量',
    roots: [
      { syllable: '수', char: '數', de: 'Zahl, Anzahl, zählen', kr: '셈 수' },
      { syllable: '량', char: '量', de: 'Menge, Maß, abwägen', kr: '헤아릴 량' },
    ],
    family: ['수학 (Mathematik)', '분량 (Umfang/Menge)', '역량 (Kapazität)'],
  },
  번호: {
    hanja: '番號',
    roots: [
      { syllable: '번', char: '番', de: 'Nummer, Reihe, Mal', kr: '차례 번' },
      { syllable: '호', char: '號', de: 'Nummer, Zeichen, Name', kr: '이름 호' },
    ],
    family: ['순번 (Reihenfolge)', '신호 (Signal)', '기호 (Symbol)'],
  },
  세계: {
    hanja: '世界',
    roots: [
      { syllable: '세', char: '世', de: 'Welt, Generation, Epoche', kr: '인간 세' },
      { syllable: '계', char: '界', de: 'Grenze, Bereich, Welt', kr: '지경 계' },
    ],
    family: ['세대 (Generation)', '세기 (Jahrhundert)', '한계 (Grenze)'],
  },
  시대: {
    hanja: '時代',
    roots: [
      { syllable: '시', char: '時', de: 'Zeit, Epoche, Stunde', kr: '때 시' },
      { syllable: '대', char: '代', de: 'Generation, Ära, vertreten', kr: '대신할 대' },
    ],
    family: ['현대 (Moderne)', '대표 (Vertreter)', '대신 (anstelle von)'],
  },
  국민: {
    hanja: '國民',
    roots: [
      { syllable: '국', char: '國', de: 'Land, Staat, Nation', kr: '나라 국' },
      { syllable: '민', char: '民', de: 'Volk, Bürger', kr: '백성 민' },
    ],
    family: ['시민 (Bürger)', '민주주의 (Demokratie)', '주민 (Einwohner)'],
  },
  도시: {
    hanja: '都市',
    roots: [
      { syllable: '도', char: '都', de: 'Metropole, Hauptstadt', kr: '도읍 도' },
      { syllable: '시', char: '市', de: 'Stadt, Markt', kr: '저자 시' },
    ],
    family: ['수도 (Hauptstadt)', '시장 (Markt/Bürgermeister)', '시내 (Innenstadt)'],
  },
  지역: {
    hanja: '地域',
    roots: [
      { syllable: '지', char: '地', de: 'Erde, Boden, Ort', kr: '땅 지' },
      { syllable: '역', char: '域', de: 'Gebiet, Region, Zone', kr: '지경 역' },
    ],
    family: ['구역 (Bezirk/Zone)', '영역 (Bereich)', '지방 (Region)'],
  },
  운전: {
    hanja: '運轉',
    roots: [
      { syllable: '운', char: '運', de: 'bewegen, transportieren, Schicksal', kr: '옮길 운' },
      { syllable: '전', char: '轉', de: 'drehen, rollen, wenden', kr: '구를 전' },
    ],
    family: ['운동 (Sport/Bewegung)', '운명 (Schicksal)', '전환 (Wende)'],
  },
  주차: {
    hanja: '駐車',
    roots: [
      { syllable: '주', char: '駐', de: 'parken, stationiert sein', kr: '머무를 주' },
      { syllable: '차', char: '車', de: 'Wagen, Fahrzeug', kr: '수레 차' },
    ],
    family: ['주차장 (Parkplatz)', '정차 (Halten)', '자동차 (Auto)'],
  },
  정류장: {
    hanja: '停留場',
    roots: [
      { syllable: '정', char: '停', de: 'anhalten, stoppen', kr: '머무를 정' },
      { syllable: '류', char: '留', de: 'bleiben, verweilen', kr: '머무를 류' },
      { syllable: '장', char: '場', de: 'Platz, Ort', kr: '마당 장' },
    ],
    family: ['정지 (Stopp)', '유학 (Auslandsstudium)'],
  },
  숙박: {
    hanja: '宿泊',
    roots: [
      { syllable: '숙', char: '宿', de: 'übernachten, Unterkunft', kr: '잘 숙' },
      { syllable: '박', char: '泊', de: 'übernachten, ankern', kr: '머무를 박' },
    ],
    family: ['하숙 (Pension)', '기숙사 (Wohnheim)', '일박 (eine Übernachtung)'],
  },
  승객: {
    hanja: '乘客',
    roots: [
      { syllable: '승', char: '乘', de: 'einsteigen, fahren', kr: '탈 승' },
      { syllable: '객', char: '客', de: 'Gast, Kunde, Passagier', kr: '손 객' },
    ],
    family: ['고객 (Kunde)', '관광객 (Tourist)', '탑승 (Boarding)'],
  },
  건축: {
    hanja: '建築',
    roots: [
      { syllable: '건', char: '建', de: 'bauen, errichten, gründen', kr: '세울 건' },
      { syllable: '축', char: '築', de: 'bauen, aufschichten', kr: '쌓을 축' },
    ],
    family: ['건물 (Gebäude)', '건설 (Bauwesen)'],
  },
  시설: {
    hanja: '施設',
    roots: [
      { syllable: '시', char: '施', de: 'durchführen, anlegen', kr: '베풀 시' },
      { syllable: '설', char: '設', de: 'einrichten, aufbauen, gründen', kr: '베풀 설' },
    ],
    family: ['설치 (Installation)', '설계 (Entwurf)', '설비 (Ausstattung)'],
  },
  도구: {
    hanja: '道具',
    roots: [
      { syllable: '도', char: '道', de: 'Weg, Methode', kr: '길 도' },
      { syllable: '구', char: '具', de: 'Werkzeug, Gerät, ausstatten', kr: '갖출 구' },
    ],
    family: ['가구 (Möbel)', '기구 (Apparat)', '구체적 (konkret)'],
  },
  사진: {
    hanja: '寫眞',
    roots: [
      { syllable: '사', char: '寫', de: 'abbilden, kopieren', kr: '베낄 사' },
      { syllable: '진', char: '眞', de: 'wahr, echt, Wirklichkeit', kr: '참 진' },
    ],
    family: ['묘사 (Schilderung)', '진실 (Wahrheit)', '진심 (Aufrichtigkeit)'],
  },
  영화: {
    hanja: '映畵',
    roots: [
      { syllable: '영', char: '映', de: 'spiegeln, projizieren, scheinen', kr: '비칠 영' },
      { syllable: '화', char: '畵', de: 'Bild, Gemälde, zeichnen', kr: '그림 화' },
    ],
    family: ['만화 (Comic)', '화가 (Maler)', '반영 (Widerspiegelung)'],
  },
  연극: {
    hanja: '演劇',
    roots: [
      { syllable: '연', char: '演', de: 'aufführen, darbietend vortragen', kr: '펼 연' },
      { syllable: '극', char: '劇', de: 'Drama, Schauspiel, heftig', kr: '심할 극' },
    ],
    family: ['공연 (Aufführung)', '연주 (Musikvortrag)', '극장 (Theater/Kino)'],
  },
  예술: {
    hanja: '藝術',
    roots: [
      { syllable: '예', char: '藝', de: 'Kunst, Geschick, Talent', kr: '재주 예' },
      { syllable: '술', char: '術', de: 'Technik, Kunstfertigkeit', kr: '재주 술' },
    ],
    family: ['연예인 (Entertainer)', '미술 (Bildende Kunst)', '기술 (Technik)'],
  },
  독서: {
    hanja: '讀書',
    roots: [
      { syllable: '독', char: '讀', de: 'lesen, studieren', kr: '읽을 독' },
      { syllable: '서', char: '書', de: 'Buch, Schrift, schreiben', kr: '글 서' },
    ],
    family: ['독자 (Leser)', '도서관 (Bibliothek)', '서점 (Buchhandlung)'],
  },
  신문: {
    hanja: '新聞',
    roots: [
      { syllable: '신', char: '新', de: 'neu, frisch', kr: '새 신' },
      { syllable: '문', char: '聞', de: 'hören, vernehmen, Nachricht', kr: '들을 문' },
    ],
    family: ['소문 (Gerücht)', '뉴스/보도 (Bericht)'],
  },
  시청: {
    hanja: '視聽',
    roots: [
      { syllable: '시', char: '視', de: 'sehen, blicken, betrachten', kr: '볼 시' },
      { syllable: '청', char: '聽', de: 'hören, zuhören', kr: '들을 청' },
    ],
    family: ['시력 (Sehkraft)', '시청자 (Zuschauer)', '청취 (Zuhören)'],
  },
  의료: {
    hanja: '醫療',
    roots: [
      { syllable: '의', char: '醫', de: 'Medizin, Arzt, heilen', kr: '의원 의' },
      { syllable: '료', char: '療', de: 'behandeln, kurieren', kr: '고칠 료' },
    ],
    family: ['의사 (Arzt)', '치료 (Therapie)', '진료 (ärztliche Untersuchung)'],
  },
  약품: {
    hanja: '藥品',
    roots: [
      { syllable: '약', char: '藥', de: 'Medizin, Arznei, Heilmittel', kr: '약 약' },
      { syllable: '품', char: '品', de: 'Ware, Artikel', kr: '물건 품' },
    ],
    family: ['약국 (Apotheke)', '치약 (Zahnpasta)'],
  },
  증상: {
    hanja: '症狀',
    roots: [
      { syllable: '증', char: '症', de: 'Symptom, Krankheitserscheinung', kr: '증세 증' },
      { syllable: '상', char: '狀', de: 'Zustand, Form, Schreiben', kr: '형상 상' },
    ],
    family: ['통증 (Schmerz)', '상태 (Zustand)'],
  },
  신체: {
    hanja: '身體',
    roots: [
      { syllable: '신', char: '身', de: 'Körper, Leib, Person', kr: '몸 신' },
      { syllable: '체', char: '體', de: 'Körper, Gestalt, System', kr: '몸 체' },
    ],
    family: ['체육 (Sportunterricht)', '체온 (Körpertemperatur)', '자신 (man selbst)'],
  },
  부모: {
    hanja: '父母',
    roots: [
      { syllable: '부', char: '父', de: 'Vater', kr: '아버지 부' },
      { syllable: '모', char: '母', de: 'Mutter', kr: '어머니 모' },
    ],
    family: ['학부모 (Eltern von Schülern)', '모국어 (Muttersprache)'],
  },
  자녀: {
    hanja: '子女',
    roots: [
      { syllable: '자', char: '子', de: 'Kind, Sohn', kr: '아들 자' },
      { syllable: '녀', char: '女', de: 'Tochter, Frau', kr: '여자 녀' },
    ],
    family: ['남자 (Mann)', '여자 (Frau)', '자식 (Kinder)'],
  },
  친구: {
    hanja: '親舊',
    roots: [
      { syllable: '친', char: '親', de: 'vertraut, eng, Eltern', kr: '친할 친' },
      { syllable: '구', char: '舊', de: 'alt, langjährig, ehemalig', kr: '예 구' },
    ],
    family: ['친절 (Freundlichkeit)', '친척 (Verwandte)'],
  },
  결혼: {
    hanja: '結婚',
    roots: [
      { syllable: '결', char: '結', de: 'knüpfen, verbinden', kr: '맺을 결' },
      { syllable: '혼', char: '婚', de: 'Heirat, Ehe', kr: '혼인할 혼' },
    ],
    family: ['약혼 (Verlobung)', '이혼 (Scheidung)', '신혼 (Flitterwochen)'],
  },
  청춘: {
    hanja: '靑春',
    roots: [
      { syllable: '청', char: '靑', de: 'blau, grün, jugendlich', kr: '푸를 청' },
      { syllable: '춘', char: '春', de: 'Frühling, Jugendzeit', kr: '봄 춘' },
    ],
    family: ['청소년 (Jugendliche)', '청년 (junger Mensch)'],
  },
};

/**
 * High-frequency TOPIK Hanja Syllable Lexicon (~165 roots) for automatic root recognition
 * on newly added custom Sino-Korean vocabulary.
 */
const HANJA_SYLLABLE_FALLBACK: Record<string, HanjaRootSyllable> = {
  // Bestehende Kernwurzeln
  학: { syllable: '학', char: '學', de: 'lernen, Wissenschaft', kr: '배울 학' },
  생: { syllable: '생', char: '生', de: 'Leben, geboren werden, Schüler', kr: '날 생' },
  교: { syllable: '교', char: '校', de: 'Schule, Unterricht, prüfen', kr: '학교 교' },
  원: { syllable: '원', char: '院', de: 'Institut, Einrichtung, Hof', kr: '집 원' },
  문: { syllable: '문', char: '文', de: 'Schrift, Kultur, Text', kr: '글월 문' },
  화: { syllable: '화', char: '化', de: 'werden, Wandel, verändern', kr: '될 화' },
  사: { syllable: '사', char: '社', de: 'Gesellschaft, Firma, Gemeinschaft', kr: '모일 사' },
  회: { syllable: '회', char: '會', de: 'Versammlung, treffen, Verein', kr: '모일 회' },
  인: { syllable: '인', char: '人', de: 'Mensch, Person', kr: '사람 인' },
  국: { syllable: '국', char: '國', de: 'Land, Staat, Nation', kr: '나라 국' },
  어: { syllable: '어', char: '語', de: 'Sprache, Wort', kr: '말씀 어' },
  식: { syllable: '식', char: '食', de: 'Essen, Speise, Nahrung', kr: '밥 식' },
  실: { syllable: '실', char: '室', de: 'Raum, Zimmer', kr: '집 실' },
  도: { syllable: '도', char: '道', de: 'Weg, Provinz, Prinzip', kr: '길 도' },
  서: { syllable: '서', char: '書', de: 'Buch, Schrift, Dokument', kr: '글 서' },
  관: { syllable: '관', char: '館', de: 'Gebäude, Halle, Beziehung', kr: '집 관' },
  자: { syllable: '자', char: '自', de: 'selbst, von Natur aus, Person', kr: '스스로 자' },
  동: { syllable: '동', char: '動', de: 'bewegen, handeln', kr: '움직일 동' },
  력: { syllable: '력', char: '力', de: 'Kraft, Fähigkeit, Energie', kr: '힘 력' },
  심: { syllable: '심', char: '心', de: 'Herz, Geist, Zentrum', kr: '마음 심' },
  발: { syllable: '발', char: '發', de: 'entfalten, aufbrechen, auslösen', kr: '필 발' },
  전: { syllable: '전', char: '展', de: 'entwickeln, Strom (電), vor (前)', kr: '펼 전' },
  해: { syllable: '해', char: '解', de: 'lösen, verstehen, Meer (海)', kr: '풀 해' },
  결: { syllable: '결', char: '決', de: 'entscheiden, klären, binden (結)', kr: '결단할 결' },
  정: { syllable: '정', char: '定', de: 'festlegen, Gefühl (情), Politik (政)', kr: '정할 정' },
  한: { syllable: '한', char: '韓', de: 'Korea, Grenze (限)', kr: '한국 한' },
  시: { syllable: '시', char: '時', de: 'Zeit, Stunde, Stadt (市)', kr: '때 시' },
  간: { syllable: '간', char: '間', de: 'Zwischenraum, Zeitraum, Raum', kr: '사이 간' },
  병: { syllable: '병', char: '病', de: 'Krankheit, Leiden', kr: '병 병' },
  은: { syllable: '은', char: '銀', de: 'Silber, Geld, Bank', kr: '은 은' },
  행: { syllable: '행', char: '行', de: 'gehen, handeln, durchführen', kr: '다닐 행' },
  진: { syllable: '진', char: '眞', de: 'wahr, echt, vorrücken (進)', kr: '참 진' },
  선: { syllable: '선', char: '先', de: 'zuerst, Linie (線), wählen (選)', kr: '먼저 선' },
  수: { syllable: '수', char: '手', de: 'Hand, Wasser (水), Zahl (數)', kr: '손 수' },
  공: { syllable: '공', char: '工', de: 'Arbeit, öffentlich (公), Luft (空)', kr: '장인 공' },
  부: { syllable: '부', char: '部', de: 'Abteilung, Teil, Vater (父)', kr: '떼 부' },
  음: { syllable: '음', char: '音', de: 'Klang, Ton, trinken (飮)', kr: '소리 음' },
  악: { syllable: '악', char: '樂', de: 'Musik, Freude', kr: '풍류 악' },
  신: { syllable: '신', char: '新', de: 'neu, Körper (身), glauben (信)', kr: '새 신' },
  가: { syllable: '가', char: '家', de: 'Haus, Familie, Preis (價), Lied (歌)', kr: '집 가' },
  통: { syllable: '통', char: '通', de: 'durchgehen, verkehren, Schmerz (痛)', kr: '통할 통' },
  출: { syllable: '출', char: '出', de: 'hinausgehen, erscheinen', kr: '날 출' },
  입: { syllable: '입', char: '入', de: 'eintreten, hineingehen', kr: '들 입' },
  구: { syllable: '구', char: '口', de: 'Öffnung, Ausgang, Bezirk (區)', kr: '입 구' },
  직: { syllable: '직', char: '職', de: 'Beruf, Amt, direkt (直)', kr: '직분 직' },
  업: { syllable: '업', char: '業', de: 'Gewerbe, Tätigkeit, Arbeit', kr: '업 업' },
  필: { syllable: '필', char: '必', de: 'unbedingt, notwendig', kr: '반드시 필' },
  요: { syllable: '요', char: '要', de: 'wichtig, erfordern, brauchen', kr: '요긴할 요' },
  중: { syllable: '중', char: '中', de: 'Mitte, während, schwer/wichtig (重)', kr: '가운데 중' },
  유: { syllable: '유', char: '有', de: 'haben, vorhanden sein, Grund (由)', kr: '있을 유' },
  무: { syllable: '무', char: '無', de: 'ohne, nichts, Handel (貿)', kr: '없을 무' },
  명: { syllable: '명', char: '名', de: 'Name, berühmt, hell/klar (明)', kr: '이름 명' },
  안: { syllable: '안', char: '安', de: 'friedlich, sicher, Vorschlag (案)', kr: '편안 안' },
  내: { syllable: '내', char: '內', de: 'innen, innerhalb', kr: '안 내' },
  외: { syllable: '외', char: '外', de: 'außen, fremd, Ausland', kr: '바깥 외' },
  소: { syllable: '소', char: '所', de: 'Ort, Stelle, klein (小)', kr: '바 소' },
  개: { syllable: '개', char: '開', de: 'öffnen, beginnen, einzeln (個)', kr: '열 개' },
  연: { syllable: '연', char: '然', de: 'so beschaffen, Natur, üben (練)', kr: '그러할 연' },
  습: { syllable: '습', char: '習', de: 'lernen, einüben, Gewohnheit', kr: '익힐 습' },
  복: { syllable: '복', char: '復', de: 'wiederholen, zurückkehren, Glück (福)', kr: '회복할 복' },
  대: { syllable: '대', char: '大', de: 'groß, gegenüber (對), Ära (代)', kr: '큰 대' },
  당: { syllable: '당', char: '堂', de: 'Halle, gerecht/passend (當)', kr: '집 당' },
  차: { syllable: '차', char: '車', de: 'Fahrzeug, Unterschied (差)', kr: '수레 차' },
  점: { syllable: '점', char: '店', de: 'Geschäft, Punkt/Aspekt (點)', kr: '가게 점' },

  // === ~95 NEUE HOCHFREQUENTE TOPIK-WURZELN (ZUM 300+ SWEET SPOT) ===
  일: { syllable: '일', char: '日', de: 'Tag, Sonne, Alltag', kr: '날 일' },
  월: { syllable: '월', char: '月', de: 'Monat, Mond', kr: '달 월' },
  년: { syllable: '년', char: '年', de: 'Jahr, Lebensalter', kr: '해 년' },
  목: { syllable: '목', char: '木', de: 'Baum, Holz, Auge/Ziel (目)', kr: '나무 목' },
  금: { syllable: '금', char: '金', de: 'Gold, Metall, Geld', kr: '쇠 금' },
  토: { syllable: '토', char: '土', de: 'Erde, Boden, Land', kr: '흙 토' },
  산: { syllable: '산', char: '山', de: 'Berg, produzieren/Geburt (産)', kr: '메 산' },
  천: { syllable: '천', char: '川', de: 'Fluss, Himmel (天), Tausend (千)', kr: '내 천' },
  방: { syllable: '방', char: '房', de: 'Zimmer, Richtung/Methode (方)', kr: '방 방' },
  창: { syllable: '창', char: '窓', de: 'Fenster, erschaffen (創)', kr: '창문 창' },
  층: { syllable: '층', char: '層', de: 'Stockwerk, Ebene, Schicht', kr: '층 층' },
  계: { syllable: '계', char: '界', de: 'Welt, Bereich, Plan (計), Treppe (階)', kr: '지경 계' },
  세: { syllable: '세', char: '世', de: 'Welt, Generation, Steuer (稅)', kr: '인간 세' },
  민: { syllable: '민', char: '民', de: 'Volk, Bürger', kr: '백성 민' },
  치: { syllable: '치', char: '治', de: 'regieren, heilen, Zahn (齒)', kr: '다스릴 치' },
  경: { syllable: '경', char: '經', de: 'durchlaufen, Wirtschaft, Umgebung (境)', kr: '지날 경' },
  제: { syllable: '제', char: '濟', de: 'Wirtschaft, herstellen (製), Ordnung (第)', kr: '건널 제' },
  농: { syllable: '농', char: '農', de: 'Landwirtschaft, Bauer', kr: '농사 농' },
  상: { syllable: '상', char: '商', de: 'Handel, einander (相), Zustand (狀)', kr: '장사 상' },
  역: { syllable: '역', char: '驛', de: 'Bahnhof, Gebiet (域), Austausch (易)', kr: '역 역' },
  송: { syllable: '송', char: '送', de: 'senden, schicken, übertragen', kr: '보낼 송' },
  운: { syllable: '운', char: '運', de: 'bewegen, Transport, Glück', kr: '옮길 운' },
  주: { syllable: '주', char: '主', de: 'Hauptsache, Woche (週), parken/wohnen (駐/住)', kr: '주인 주' },
  지: { syllable: '지', char: '地', de: 'Erde, Ort, Papier (紙), wissen (知)', kr: '땅 지' },
  군: { syllable: '군', char: '郡', de: 'Landkreis, Armee (軍)', kr: '고을 군' },
  촌: { syllable: '촌', char: '村', de: 'Dorf, ländlich', kr: '마을 촌' },
  섬: { syllable: '도', char: '島', de: 'Insel', kr: '섬 도' },
  로: { syllable: '로', char: '路', de: 'Straße, Route, alt (老)', kr: '길 로' },
  항: { syllable: '항', char: '港', de: 'Hafen, Luftfahrt (航)', kr: '항구 항' },
  객: { syllable: '객', char: '客', de: 'Gast, Kunde, Passagier', kr: '손 객' },
  숙: { syllable: '숙', char: '宿', de: 'übernachten, Unterkunft', kr: '잘 숙' },
  박: { syllable: '박', char: '泊', de: 'übernachten, verweilen', kr: '머무를 박' },
  건: { syllable: '건', char: '建', de: 'bauen, errichten, gesund (健)', kr: '세울 건' },
  축: { syllable: '축', char: '築', de: 'bauen, feiern (祝)', kr: '쌓을 축' },
  설: { syllable: '설', char: '設', de: 'einrichten, erklären (說)', kr: '베풀 설' },
  비: { syllable: '비', char: '費', de: 'Kosten, vorbereiten (備), vergleichen (比)', kr: '쓸 비' },
  기: { syllable: '기', char: '機', de: 'Maschine, Gelegenheit, Energie (氣), Gerät (器)', kr: '틀 기' },
  재: { syllable: '재', char: '材', de: 'Material, Talent, existieren (在)', kr: '재목 재' },
  영: { syllable: '영', char: '映', de: 'projizieren/Film, betreiben (營)', kr: '비칠 영' },
  극: { syllable: '극', char: '劇', de: 'Drama, Theater, überwinden (克)', kr: '심할 극' },
  예: { syllable: '예', char: '藝', de: 'Kunst, im Voraus (豫), Beispiel (例)', kr: '재주 예' },
  술: { syllable: '술', char: '術', de: 'Technik, Kunst, Methode', kr: '재주 술' },
  독: { syllable: '독', char: '讀', de: 'lesen, allein/unabhängig (獨)', kr: '읽을 독' },
  청: { syllable: '청', char: '聽', de: 'zuhören, bitten (請), blau/Jugend (靑)', kr: '들을 청' },
  매: { syllable: '매', char: '買', de: 'kaufen, verkaufen (賣), jeden (每)', kr: '살 매' },
  품: { syllable: '품', char: '品', de: 'Ware, Produkt, Qualität', kr: '물건 품' },
  질: { syllable: '질', char: '質', de: 'Qualität, Wesen, Frage', kr: '바탕 질' },
  량: { syllable: '량', char: '量', de: 'Menge, Quantität, gut (良)', kr: '헤아릴 량' },
  양: { syllable: '양', char: '量', de: 'Menge, Art und Weise (樣)', kr: '헤아릴 량' },
  번: { syllable: '번', char: '番', de: 'Nummer, Reihe, Mal', kr: '차례 번' },
  호: { syllable: '호', char: '號', de: 'Nummer, Name, gut/mögen (好)', kr: '이름 호' },
  의: { syllable: '의', char: '醫', de: 'Medizin, Bedeutung/Sinn (意), Kleidung (衣)', kr: '의원 의' },
  약: { syllable: '약', char: '藥', de: 'Medizin, versprechen (約), schwach (弱)', kr: '약 약' },
  료: { syllable: '료', char: '療', de: 'behandeln/heilen, Gebühr/Material (料)', kr: '고칠 료' },
  증: { syllable: '증', char: '症', de: 'Symptom, Beweis/Schein (證), zunehmen (增)', kr: '증세 증' },
  체: { syllable: '체', char: '體', de: 'Körper, Gestalt, System', kr: '몸 체' },
  두: { syllable: '두', char: '頭', de: 'Kopf, Spitze, Anfang', kr: '머리 두' },
  이: { syllable: '이', char: '理', de: 'Prinzip/Grund, Nutzen (利), Ohr (耳)', kr: '다스릴 리' },
  리: { syllable: '리', char: '理', de: 'Logik, ordnen, Vorteil (利)', kr: '다스릴 리' },
  족: { syllable: '족', char: '族', de: 'Familie/Volk, Fuß/genügen (足)', kr: '겨레 족' },
  남: { syllable: '남', char: '男', de: 'Mann, männlich, Süden (南)', kr: '사내 남' },
  녀: { syllable: '녀', char: '女', de: 'Frau, weiblich, Tochter', kr: '여자 녀' },
  여: { syllable: '여', char: '女', de: 'Frau, reisen (旅), übrig (餘)', kr: '여자 녀' },
  모: { syllable: '모', char: '母', de: 'Mutter, sammeln (募), Aussehen (貌)', kr: '어머니 모' },
  친: { syllable: '친', char: '親', de: 'Eltern, vertraut, eng', kr: '친할 친' },
  우: { syllable: '우', char: '友', de: 'Freund, rechts (右), Regen (雨)', kr: '벗 우' },
  애: { syllable: '애', char: '愛', de: 'Liebe, lieben, schätzen', kr: '사랑 애' },
  혼: { syllable: '혼', char: '婚', de: 'Heirat, Ehe', kr: '혼인할 혼' },
  노: { syllable: '노', char: '老', de: 'alt, sich bemühen (努), Zorn (怒)', kr: '늙을 로' },
  춘: { syllable: '춘', char: '春', de: 'Frühling, Jugend', kr: '봄 춘' },
  하: { syllable: '하', char: '夏', de: 'Sommer, unten (下), gratulieren (賀)', kr: '여름 하' },
  추: { syllable: '추', char: '秋', de: 'Herbst, empfehlen/drängen (推)', kr: '가을 추' },
  표: { syllable: '표', char: '表', de: 'ausdrücken, Oberfläche, Ticket (票)', kr: '겉 표' },
  감: { syllable: '감', char: '感', de: 'Gefühl, empfinden, verringern (減)', kr: '느낄 감' },
  성: { syllable: '성', char: '成', de: 'vollenden, gelingen, Charakter (性)', kr: '이룰 성' },
  태: { syllable: '태', char: '態', de: 'Haltung, Zustand', kr: '모양 태' },
  변: { syllable: '변', char: '變', de: 'verändern, Wandel', kr: '변할 변' },
  유2: { syllable: '유', char: '維', de: 'bewahren, zusammenhalten', kr: '바 유' },
  선2: { syllable: '선', char: '船', de: 'Schiff, Boot', kr: '배 선' },
  교2: { syllable: '교', char: '橋', de: 'Brücke', kr: '다리 교' },
  문2: { syllable: '문', char: '門', de: 'Tor, Tür, Pforte', kr: '문 문' },
  화2: { syllable: '화', char: '火', de: 'Feuer, Brand, Dienstag', kr: '불 화' },
  수2: { syllable: '수', char: '水', de: 'Wasser, Flüssigkeit, Mittwoch', kr: '물 수' },
  공2: { syllable: '공', char: '空', de: 'Himmel, Luft, leer', kr: '빌 공' },
  전2: { syllable: '전', char: '電', de: 'Elektrizität, Blitz', kr: '번개 전' },
  해2: { syllable: '해', char: '海', de: 'Meer, Ozean', kr: '바다 해' },
  매2: { syllable: '매', char: '賣', de: 'verkaufen, veräußern', kr: '팔 매' },
  제2: { syllable: '제', char: '第', de: 'Ordnungszahl-Präfix, Stufe', kr: '차례 제' },
  도2: { syllable: '도', char: '度', de: 'Grad, Maß, Mal', kr: '법도 도' },
  수3: { syllable: '수', char: '輸', de: 'transportieren, befördern', kr: '실어낼 수' },
  구2: { syllable: '구', char: '區', de: 'Bezirk, Zone, unterscheiden', kr: '구분할 구' },
  경2: { syllable: '경', char: '京', de: 'Hauptstadt', kr: '서울 경' },
  주2: { syllable: '주', char: '州', de: 'Provinz, Bundesstaat', kr: '고을 주' },
  선3: { syllable: '선', char: '線', de: 'Linie, Gleis, Kabel', kr: '줄 선' },
  계2: { syllable: '계', char: '階', de: 'Treppe, Stufe, Etage', kr: '섬돌 계' },
  기2: { syllable: '기', char: '器', de: 'Gefäß, Gerät, Instrument', kr: '그릇 기' },
  지2: { syllable: '지', char: '紙', de: 'Papier, Blatt', kr: '종이 지' },
  통2: { syllable: '통', char: '痛', de: 'Schmerz, schmerzen', kr: '아플 통' },
  안2: { syllable: '안', char: '顔', de: 'Gesicht, Miene', kr: '얼굴 안' },
  이2: { syllable: '이', char: '耳', de: 'Ohr, Gehör', kr: '귀 이' },
  치2: { syllable: '치', char: '齒', de: 'Zahn, Gebiss', kr: '이 치' },
  족2: { syllable: '족', char: '足', de: 'Fuß, genügen, ausreichen', kr: '발 족' },
  유3: { syllable: '유', char: '幼', de: 'jung, Kleinkind', kr: '어릴 유' },
  동2: { syllable: '동', char: '冬', de: 'Winter', kr: '겨울 동' },
  소2: { syllable: '소', char: '小', de: 'klein, gering', kr: '작을 소' },
};

/**
 * Character-indexed map over all 305+ Hanja roots in the lexicon.
 * Used when CSV uploads provide explicit Hanja in parentheses, e.g. "학교(學校)" or "경제(經濟)",
 * and to find related word families dynamically.
 */
const HANJA_CHAR_MAP: Record<string, HanjaRootSyllable> = (() => {
  const map: Record<string, HanjaRootSyllable> = {};
  for (const root of Object.values(HANJA_SYLLABLE_FALLBACK)) {
    if (!map[root.char]) {
      map[root.char] = root;
    }
  }
  for (const entry of Object.values(HANJA_WORD_DICT)) {
    for (const root of entry.roots) {
      if (!map[root.char]) {
        map[root.char] = root;
      }
    }
  }
  return map;
})();

/**
 * Finds up to 3 related compound words from HANJA_WORD_DICT that share at least one Hanja character.
 */
function findRelatedFamily(hanjaChars: string[], excludeWord: string): string[] {
  const charSet = new Set(hanjaChars);
  const related: string[] = [];
  for (const [word, entry] of Object.entries(HANJA_WORD_DICT)) {
    if (word === excludeWord || word.includes('(')) continue;
    if (entry.roots.some((r) => charSet.has(r.char))) {
      related.push(`${word} (${entry.hanja})`);
      if (related.length >= 3) break;
    }
  }
  return related;
}

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
        const ch = hanjaList[i];
        const knownChar = HANJA_CHAR_MAP[ch];
        const fallback = HANJA_SYLLABLE_FALLBACK[syl];
        if (knownChar) {
          return {
            syllable: syl,
            char: ch,
            de: knownChar.de,
            kr: knownChar.kr,
          };
        }
        return {
          syllable: syl,
          char: ch,
          de: fallback?.char === ch ? fallback.de : `Bedeutung von ${ch}`,
          kr: fallback?.char === ch ? fallback.kr : `${ch}`,
        };
      });
      const family = findRelatedFamily(hanjaList, hangul);
      return {
        hanja: hanjaChars,
        roots,
        ...(family.length > 0 ? { family } : {}),
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
      const hanjaChars = matchedRoots.map((r) => r.char);
      const family = findRelatedFamily(hanjaChars, baseRoot);
      return {
        hanja: hanjaChars.join(''),
        roots: matchedRoots,
        ...(family.length > 0 ? { family } : {}),
      };
    }
  }

  return null;
}
