export type AppLanguage = 'de' | 'kr';

export interface Translations {
  // Navigation / Header
  modes: {
    card: string;
    match: string;
    listening?: string;
    quiz: string;
    list: string;
  };
  categories: {
    all: string;
    noun: string;
    verb: string;
    adjective: string;
    adverb: string;
    phrase: string;
    grammar: string;
    custom: string;
  };
  subcategories: {
    allOption: (count: number) => string;
  };
  actions: {
    themeToggle: string;
    ramyeonRunning: (timeLeft: string) => string;
    ramyeonIdle: string;
    sojuRoulette: string;
    langToggleDe: string;
    langToggleKr: string;
    addVocab: string;
    exportSync: string;
    dueOnly: string;
    dueOnlyTitle: string;
    directionKrDe: string;
    directionDeKr: string;
    directionTitle: string;
    shuffle: string;
    shuffleTitle: string;
    resetProgress: string;
    resetProgressTitle: string;
  };
  stats: {
    due: string;
    mastered: string;
    learning: string;
    progress: string;
  };
  srsStages: {
    level0: string;
    level1: string;
    level2: string;
    level3: string;
    level4: string;
    level5: string;
    intervalImmediate: string;
    intervalDay: (d: number) => string;
    dueToday: string;
    dueTomorrow: string;
    dueInDays: (d: number) => string;
  };
  flashcard: {
    cardOf: (current: number, total: number) => string;
    speedSlow: string;
    tapToFlip: string;
    listenSentence: string;
    readAloud: string;
    exampleLabel: string;
    nextReviewIn: (interval: string) => string;
    ratingHint: string;
    prev: string;
    repeat: string;
    learned: string;
    next: string;
    allCompletedTitle: string;
    allCompletedDesc: string;
  };
  listening: {
    badge: string;
    allCompletedTitle: string;
    allCompletedDesc: string;
    visualizerTitle: string;
    visualizerDesc: string;
    listenWord: (slow: boolean) => string;
    listenSentence: string;
    tapToReveal: string;
    listenAgain: string;
    koreanLabel: string;
    germanLabel: string;
    exampleLabel: string;
    srsStageLabel: string;
    speedSlowTitle: string;
  };
  speedMatch: {
    badge: string;
    pairs: string;
    matchedCount: (current: number, total: number) => string;
    time: string;
    streak: (count: number) => string;
    mistakes: (count: number) => string;
    nextRound: string;
    playAgain: string;
    roundCompleteTitle: string;
    roundCompleteDesc: (time: string, mistakes: number) => string;
    pairSize: (size: number) => string;
    rounds: string;
    roundOf: (current: number, total: number) => string;
    nextRoundBtn: (next: number) => string;
    newGame: string;
    emptyTitle: string;
    emptyDesc: string;
    instruction: string;
  };
  quiz: {
    questionOf: (current: number, total: number) => string;
    streak: (count: number) => string;
    score: (score: number) => string;
    askKrToDe: string;
    askDeToKr: string;
    exampleLabel: string;
    nextQuestionHint: string;
    nextQuestionBtn: string;
    resultFinished: string;
    resultTitleExcellent: string;
    resultTitleGood: string;
    resultTitleKeepGoing: string;
    resultScoreLabel: string;
    resultStreakLabel: string;
    newQuizBtn: string;
    catNoun: string;
    catVerb: string;
    catAdjective: string;
    catAdverb: string;
    catPhrase: string;
    catGrammar: string;
  };
  list: {
    searchPlaceholder: string;
    noResults: (q: string) => string;
    listenTitle: string;
    customBadge: string;
    markRepeatTitle: string;
    markLearnedTitle: string;
    deleteCustomTitle: string;
  };
  ramyeonModal: {
    title: string;
    subtitle: string;
    soundOn: string;
    soundOff: string;
    cooking: string;
    ready: string;
    fourMin: string;
    threeMin: string;
    plus30s: string;
    plus1m: string;
    reset: string;
    minimize: string;
    pause: string;
    resume: string;
    start: string;
    doneTitle: string;
    newTimer: string;
    doneClose: string;
    widgetTooltip: (time: string) => string;
  };
  sojuModal: {
    title: string;
    subtitle: string;
    tapToSpin: string;
    spinning: string;
    chosen: string;
    modeLabel: string;
    categoryLabel: string;
    subCategoryLabel: string;
    spinAgain: string;
    spinBottle: string;
    startNow: string;
  };
  vocabModal: {
    modalTitle: string;
    tabBulk: string;
    tabSingle: string;
    targetLevel: string;
    category: string;
    subcategoryName: string;
    inputData: string;
    inputPlaceholder: string;
    importNotice: string;
    addVocabBtn: (count: number) => string;
    cancel: string;
    clearCustomBtn: string;
    koreanWord: string;
    germanWord: string;
    exampleKorean: string;
    exampleGerman: string;
    addSingleBtn: string;
    savedCount: (count: number) => string;
  };
  syncModal: {
    title: string;
    textareaPlaceholder: string;
    copyCode: string;
    loadProgress: string;
    copiedSuccess: string;
    copyError: string;
    loadSuccess: string;
    loadError: string;
  };
  resetModal: {
    title: string;
    desc: string;
    cancel: string;
    confirm: string;
  };
}

export const translations: Record<AppLanguage, Translations> = {
  de: {
    modes: {
      card: 'Karten',
      match: 'Match',
      listening: 'Hören',
      quiz: 'Quiz',
      list: 'Liste',
    },
    categories: {
      all: 'Alle',
      noun: 'Nomen',
      verb: 'Verben',
      adjective: 'Adjektive',
      adverb: 'Adverbien',
      phrase: 'Ausdrücke',
      grammar: 'Grammatik',
      custom: '★ Eigene',
    },
    subcategories: {
      allOption: (count) => `Alle Unterkategorien (${count})`,
    },
    actions: {
      themeToggle: 'Hell-/Dunkelmodus wechseln (Taegeuk)',
      ramyeonRunning: (timeLeft) => `신라면 타이머 läuft: noch ${timeLeft} (Klicken für Steuerung)`,
      ramyeonIdle: '신라면 타이머 (4-Minuten Ramyeon Timer)',
      sojuRoulette: '소주 룰렛 (Zufallsgenerator für Spielmodus, Kategorie & Unterkategorie)',
      langToggleDe: 'Sprache auf Koreanisch wechseln (한국어로 전환)',
      langToggleKr: 'Auf Deutsch wechseln (독일어로 전환)',
      addVocab: 'Vokabeln hinzufügen',
      exportSync: 'Vokabel- & Cloud-Zentrale',
      dueOnly: 'Heute fällig',
      dueOnlyTitle: 'Zeigt nur Karten, die heute zur Wiederholung anstehen',
      directionKrDe: 'KR ➔ DE',
      directionDeKr: 'DE ➔ KR',
      directionTitle: 'Richtung wechseln: Koreanisch ➔ Deutsch oder Deutsch ➔ Koreanisch',
      shuffle: 'Mischen',
      shuffleTitle: 'Karten zufällig mischen',
      resetProgress: 'Zurücksetzen',
      resetProgressTitle: 'Lernfortschritt zurücksetzen',
    },
    stats: {
      due: 'fällig',
      mastered: 'gemeistert',
      learning: 'im Zyklus',
      progress: 'Fortschritt',
    },
    srsStages: {
      level0: 'Neu / Ungelernt',
      level1: 'Stufe 1',
      level2: 'Stufe 2',
      level3: 'Stufe 3',
      level4: 'Stufe 4',
      level5: 'Stufe 5 (Gemeistert)',
      intervalImmediate: 'Sofort',
      intervalDay: (d) => `${d} Tag${d > 1 ? 'e' : ''}`,
      dueToday: 'Heute fällig',
      dueTomorrow: 'Morgen fällig',
      dueInDays: (d) => `in ${d} Tagen`,
    },
    flashcard: {
      cardOf: (current, total) => `Karte ${current} von ${total}`,
      speedSlow: 'Langsame Aussprache (0.75x)',
      tapToFlip: 'Tippen oder Leertaste zum Umdrehen',
      listenSentence: 'Beispielsatz / Wort auf Koreanisch anhören',
      readAloud: 'Vorlesen',
      exampleLabel: 'Beispielsatz (예문)',
      nextReviewIn: (interval) => `(nächste Wiederholung in ${interval})`,
      ratingHint: 'Unten bewerten: 1 = Wiederholen (Reset) · 2 = Gelernt (Stufe +1)',
      prev: 'Zurück',
      repeat: 'Wiederholen',
      learned: 'Gelernt',
      next: 'Weiter',
      allCompletedTitle: '모든 카드를 완료했어요! 🎉',
      allCompletedDesc: 'Alle Karten in dieser Kategorie bzw. mit dem aktuellen Filter wurden gelernt oder sind heute nicht fällig.',
    },
    listening: {
      badge: '듣기',
      allCompletedTitle: '모든 듣기 카드를 완료했어요! 🎧',
      allCompletedDesc: 'Keine offenen Hörverstehens-Karten in diesem Filter. Wähle eine andere Kategorie oder deaktiviere „Heute fällig“.',
      visualizerTitle: 'Koreanisches Hörverstehen',
      visualizerDesc: 'Klicke auf „Wort anhören“ und versuche die Bedeutung zu verstehen.',
      listenWord: (slow) => `Wort anhören ${slow ? '(0.75x)' : ''}`,
      listenSentence: 'Beispielsatz anhören',
      tapToReveal: 'Tippen oder Leertaste zum Aufdecken des Schriftbilds',
      listenAgain: 'Nochmal anhören',
      koreanLabel: 'Koreanisch (한글)',
      germanLabel: 'Bedeutung (Deutsch)',
      exampleLabel: 'Beispielsatz (예문)',
      srsStageLabel: 'SRS Stufe:',
      speedSlowTitle: 'Langsamere Aussprache (0.75x)',
    },
    speedMatch: {
      badge: '짝맞추기',
      pairs: 'Paare',
      matchedCount: (current, total) => `${current} / ${total} Paare gefunden`,
      time: 'Zeit',
      streak: (count) => `${count}er Serie!`,
      mistakes: (count) => `${count} ${count === 1 ? 'Fehler' : 'Fehler'}`,
      nextRound: 'Nächste Runde',
      playAgain: 'Nochmal spielen',
      roundCompleteTitle: 'Feld aufgeräumt! 대단해요! 🎉',
      roundCompleteDesc: (time, mistakes) =>
        `Zeit: ${time} · ${mistakes === 0 ? 'Fehlerfrei! Perfektes Gedächtnis ⭐' : `${mistakes} Fehlversuch(e)`}`,
      pairSize: (size) => `${size} Paare`,
      rounds: 'Runden',
      roundOf: (current, total) => `Runde ${current} von ${total}`,
      nextRoundBtn: (next) => `Runde ${next} starten`,
      newGame: 'Neues Spiel starten',
      emptyTitle: 'Keine Vokabeln zum Matchen',
      emptyDesc: 'In dieser Kategorie gibt es gerade keine passenden Vokabeln. Ändere die Filtereinstellungen oder füge neue Vokabeln hinzu.',
      instruction: 'Tippe auf ein koreanisches Wort und die passende deutsche Bedeutung!',
    },
    quiz: {
      questionOf: (current, total) => `Frage ${current} von ${total}`,
      streak: (count) => `${count}er Serie!`,
      score: (s) => `Score: ${s}`,
      askKrToDe: 'Was bedeutet dieses Wort auf Deutsch?',
      askDeToKr: 'Wie heißt das auf Koreanisch?',
      exampleLabel: 'Beispielsatz (예문)',
      nextQuestionHint: 'Tippe auf Weiter oder drücke Leertaste',
      nextQuestionBtn: 'Nächste Frage',
      resultFinished: 'Quiz abgeschlossen! 🎉',
      resultTitleExcellent: 'Hervorragend! 대단해요!',
      resultTitleGood: 'Gute Leistung! 잘했어요!',
      resultTitleKeepGoing: 'Weiter so! 화이팅!',
      resultScoreLabel: 'Punkte',
      resultStreakLabel: 'Beste Serie',
      newQuizBtn: 'Neues Quiz starten',
      catNoun: '명사 Nomen',
      catVerb: '동사 Verb',
      catAdjective: '형용사 Adjektiv',
      catAdverb: '부사 Adverb',
      catPhrase: '표현 Ausdruck',
      catGrammar: '문법 Grammatik',
    },
    list: {
      searchPlaceholder: 'Suche nach Koreanisch, Deutsch, Thema oder Grammatik...',
      noResults: (q) => `Keine Einträge für „${q}“ gefunden.`,
      listenTitle: 'Koreanische Aussprache anhören',
      customBadge: '★ Eigene',
      markRepeatTitle: 'Als Wiederholen / Zurückstufen',
      markLearnedTitle: 'Als Gelernt / SRS Stufe +1',
      deleteCustomTitle: 'Eigenen Eintrag löschen',
    },
    ramyeonModal: {
      title: '신라면 타이머',
      subtitle: '(Ramyeon)',
      soundOn: 'Signalton aktiv',
      soundOff: 'Signalton stummgeschaltet',
      cooking: 'Kocht gerade... 🔥',
      ready: 'Bereit',
      fourMin: "4' 신라면",
      threeMin: "3' 컵라면",
      plus30s: '30s',
      plus1m: '1m',
      reset: 'Reset',
      minimize: 'Minimieren',
      pause: 'Pause',
      resume: 'Fortsetzen',
      start: 'Start (시작)',
      doneTitle: '라면 완성! 맛있게 드세요!',
      newTimer: "Neuer Timer (4')",
      doneClose: 'Fertig (닫기)',
      widgetTooltip: (time) => `신라면 타이머: ${time} (Klicken für Steuerung)`,
    },
    sojuModal: {
      title: 'Soju Roulette',
      subtitle: '(Zufallsauswahl)',
      tapToSpin: 'Tippe auf die Flasche zum Drehen',
      spinning: 'Flasche dreht sich...',
      chosen: 'Soju hat gewählt:',
      modeLabel: 'Modus',
      categoryLabel: 'Kategorie',
      subCategoryLabel: 'Unterkategorie',
      spinAgain: 'Nochmal drehen',
      spinBottle: 'Flasche drehen',
      startNow: 'Jetzt starten',
    },
    vocabModal: {
      modalTitle: 'Vokabeln hinzufügen & importieren',
      tabBulk: 'Massenimport (JSON / Text)',
      tabSingle: 'Einzelne Vokabel',
      targetLevel: 'Ziel-Level:',
      category: 'Kategorie:',
      subcategoryName: 'Thema / Unterkategorie:',
      inputData: 'Vokabeldaten (JSON oder Zeilenbasiert):',
      inputPlaceholder: 'Beispiel: \n[{"kr": "학교", "de": "Schule", "cat": "noun", "sub": "Orte"}] \n\nOder Zeile für Zeile:\n학교 = Schule\n가다 = gehen',
      importNotice: 'Unterstützt JSON-Arrays, Tabellendaten oder einfaches "Wort = Übersetzung".',
      addVocabBtn: (count) => `Vokabeln importieren (${count})`,
      cancel: 'Schließen',
      clearCustomBtn: 'Alle eigenen löschen',
      koreanWord: 'Koreanisches Wort (한글):',
      germanWord: 'Deutsche Bedeutung:',
      exampleKorean: 'Koreanischer Beispielsatz (optional):',
      exampleGerman: 'Deutsche Übersetzung des Satzes (optional):',
      addSingleBtn: 'Vokabel speichern',
      savedCount: (c) => `Gespeicherte eigene Vokabeln: ${c}`,
    },
    syncModal: {
      title: 'Lernstand & SRS sichern / übertragen',
      textareaPlaceholder: 'JSON-Code hier einfügen...',
      copyCode: 'Code kopieren',
      loadProgress: 'Lernstand laden',
      copiedSuccess: '✓ Code in die Zwischenablage kopiert!',
      copyError: 'Konnte nicht kopieren. Bitte Text manuell auswählen.',
      loadSuccess: '✓ SRS-Lernstand & eigene Vokabeln erfolgreich geladen!',
      loadError: '✗ Ungültiger Code. Bitte prüfe deine Eingabe.',
    },
    resetModal: {
      title: 'SRS-Fortschritt zurücksetzen?',
      desc: 'Möchtest du wirklich alle SRS-Stufen und gelernten Daten auf Stufe 0 zurücksetzen? Deine eigenen Vokabeln bleiben dabei erhalten.',
      cancel: 'Abbrechen',
      confirm: 'Ja, zurücksetzen',
    },
  },
  kr: {
    modes: {
      card: '플래시카드',
      match: '짝맞추기',
      listening: '듣기',
      quiz: '퀴즈',
      list: '단어장',
    },
    categories: {
      all: '전체',
      noun: '명사',
      verb: '동사',
      adjective: '형용사',
      adverb: '부사',
      phrase: '표현',
      grammar: '문법',
      custom: '★ 내 단어',
    },
    subcategories: {
      allOption: (count) => `전체 하위 카테고리 (${count})`,
    },
    actions: {
      themeToggle: '다크/라이트 모드 전환 (태극)',
      ramyeonRunning: (timeLeft) => `신라면 타이머 동작 중: ${timeLeft} 남음 (클릭하여 열기)`,
      ramyeonIdle: '신라면 타이머 (4분 라면 타이머)',
      sojuRoulette: '소주 룰렛 (학습 모드 & 카테고리 무작위 추천)',
      langToggleDe: '한국어로 전환',
      langToggleKr: '독일어로 전환 (Auf Deutsch wechseln)',
      addVocab: '단어 추가',
      exportSync: '단어 관리 & Cloud',
      dueOnly: '오늘 복습',
      dueOnlyTitle: '오늘 복습할 단어만 필터링하여 표시합니다',
      directionKrDe: '한 ➔ 독',
      directionDeKr: '독 ➔ 한',
      directionTitle: '학습 방향 전환: 한국어 ➔ 독일어 또는 독일어 ➔ 한국어',
      shuffle: '단어 섞기',
      shuffleTitle: '카드 순서를 무작위로 섞습니다',
      resetProgress: '초기화',
      resetProgressTitle: '학습 진행도 초기화',
    },
    stats: {
      due: '복습 대기',
      mastered: '마스터',
      learning: '학습 중',
      progress: '진도율',
    },
    srsStages: {
      level0: '미학습 (신규)',
      level1: '1단계',
      level2: '2단계',
      level3: '3단계',
      level4: '4단계',
      level5: '5단계 (마스터)',
      intervalImmediate: '즉시',
      intervalDay: (d) => `${d}일`,
      dueToday: '오늘 복습',
      dueTomorrow: '내일 복습',
      dueInDays: (d) => `${d}일 후`,
    },
    flashcard: {
      cardOf: (current, total) => `카드 ${current} / ${total}`,
      speedSlow: '느린 발음 (0.75x)',
      tapToFlip: '탭하거나 스페이스바로 카드 뒤집기',
      listenSentence: '예문 및 발음 듣기',
      readAloud: '읽기',
      exampleLabel: '예문',
      nextReviewIn: (interval) => `(다음 복습 주기: ${interval})`,
      ratingHint: '하단 평가: 1 = 다시 복습 (초기화) · 2 = 알고 있음 (단계 +1)',
      prev: '이전',
      repeat: '다시 복습',
      learned: '알고 있음',
      next: '다음',
      allCompletedTitle: '모든 카드를 완료했어요! 🎉',
      allCompletedDesc: '이 카테고리의 모든 카드를 학습했거나 오늘 복습할 카드가 없습니다.',
    },
    listening: {
      badge: '듣기',
      allCompletedTitle: '모든 듣기 카드를 완료했어요! 🎧',
      allCompletedDesc: '현재 필터에 열려 있는 듣기 카드가 없습니다. 다른 카테고리를 선택하거나 ‘오늘 복습’을 해제해 보세요.',
      visualizerTitle: '한국어 듣기 연습',
      visualizerDesc: '‘단어 듣기’를 누르고 뜻을 머릿속으로 생각해 보세요.',
      listenWord: (slow) => `단어 듣기 ${slow ? '(0.75x)' : ''}`,
      listenSentence: '예문 듣기',
      tapToReveal: '탭하거나 스페이스바로 단어 확인',
      listenAgain: '다시 듣기',
      koreanLabel: '한국어 (한글)',
      germanLabel: '독일어 뜻',
      exampleLabel: '예문',
      srsStageLabel: 'SRS 단계:',
      speedSlowTitle: '느린 발음 듣기 (0.75x)',
    },
    speedMatch: {
      badge: '짝맞추기',
      pairs: '단어 쌍',
      matchedCount: (current, total) => `${current} / ${total} 쌍 완료`,
      time: '시간',
      streak: (count) => `${count}연속 정답!`,
      mistakes: (count) => `${count}회 오답`,
      nextRound: '다음 라운드',
      playAgain: '다시 플레이',
      roundCompleteTitle: '필드 정리 완료! 대단해요! 🎉',
      roundCompleteDesc: (time, mistakes) =>
        `소요 시간: ${time} · ${mistakes === 0 ? '무결점 완벽 매칭! ⭐' : `${mistakes}회 실수`}`,
      pairSize: (size) => `${size}쌍 모드`,
      rounds: '라운드',
      roundOf: (current, total) => `${current} / ${total} 라운드`,
      nextRoundBtn: (next) => `다음 라운드 (${next}) 시작`,
      newGame: '새 게임 시작',
      emptyTitle: '매칭할 단어가 없습니다',
      emptyDesc: '현재 선택한 카테고리에 단어가 없습니다. 필터를 변경하거나 단어를 추가해 보세요.',
      instruction: '한국어 단어와 일치하는 독일어 뜻 카드를 빠르게 터치하세요!',
    },
    quiz: {
      questionOf: (current, total) => `문제 ${current} / ${total}`,
      streak: (count) => `${count}연속 정답!`,
      score: (s) => `점수: ${s}`,
      askKrToDe: '이 단어의 독일어 뜻은 무엇일까요?',
      askDeToKr: '이 표현은 한국어로 무엇일까요?',
      exampleLabel: '예문',
      nextQuestionHint: '다음 문제를 누르거나 스페이스바를 누르세요',
      nextQuestionBtn: '다음 문제',
      resultFinished: '퀴즈를 완료했어요! 🎉',
      resultTitleExcellent: '대단해요! 완벽한 실력입니다!',
      resultTitleGood: '잘했어요! 훌륭합니다!',
      resultTitleKeepGoing: '화이팅! 계속 연습해 보세요!',
      resultScoreLabel: '점수',
      resultStreakLabel: '최고 연속 정답',
      newQuizBtn: '새 퀴즈 시작하기',
      catNoun: '명사',
      catVerb: '동사',
      catAdjective: '형용사',
      catAdverb: '부사',
      catPhrase: '표현',
      catGrammar: '문법',
    },
    list: {
      searchPlaceholder: '한국어, 독일어, 주제 또는 문법 검색...',
      noResults: (q) => `„${q}“에 대한 검색 결과가 없습니다.`,
      listenTitle: '한국어 발음 듣기',
      customBadge: '★ 내 단어',
      markRepeatTitle: '다시 복습으로 표시',
      markLearnedTitle: '학습 완료로 표시 (SRS +1)',
      deleteCustomTitle: '사용자 단어 삭제',
    },
    ramyeonModal: {
      title: '신라면 타이머',
      subtitle: '(라면 타이머)',
      soundOn: '알림음 켜짐',
      soundOff: '알림음 음소거',
      cooking: '보글보글 끓는 중... 🔥',
      ready: '준비 완료',
      fourMin: '4분 신라면',
      threeMin: '3분 컵라면',
      plus30s: '30초',
      plus1m: '1분',
      reset: '초기화',
      minimize: '최소화',
      pause: '일시정지',
      resume: '이어하기',
      start: '시작하기',
      doneTitle: '라면 완성! 맛있게 드세요! 🍜',
      newTimer: '새 타이머 (4분)',
      doneClose: '닫기',
      widgetTooltip: (time) => `신라면 타이머: ${time} (클릭하여 제어)`,
    },
    sojuModal: {
      title: '소주 룰렛',
      subtitle: '(무작위 추천)',
      tapToSpin: '소주병을 눌러 돌려보세요',
      spinning: '소주병이 돌아가는 중...',
      chosen: '소주 룰렛 추천 결과:',
      modeLabel: '학습 모드',
      categoryLabel: '카테고리',
      subCategoryLabel: '하위 카테고리',
      spinAgain: '다시 돌리기',
      spinBottle: '소주병 돌리기',
      startNow: '지금 시작하기',
    },
    vocabModal: {
      modalTitle: '단어 추가 및 대량 가져오기',
      tabBulk: '대량 가져오기 (JSON / 텍스트)',
      tabSingle: '단어 직접 추가',
      targetLevel: '목표 레벨:',
      category: '카테고리:',
      subcategoryName: '주제 / 하위 카테고리:',
      inputData: '단어 데이터 (JSON 또는 줄바꿈 텍스트):',
      inputPlaceholder: '예시:\n[{"kr": "학교", "de": "Schule", "cat": "noun", "sub": "장소"}]\n\n또는 한 줄씩:\n학교 = Schule\n가다 = gehen',
      importNotice: 'JSON 배열 또는 "단어 = 뜻" 형식의 텍스트 입력을 지원합니다.',
      addVocabBtn: (count) => `단어 가져오기 (${count}개)`,
      cancel: '닫기',
      clearCustomBtn: '내 단어 전체 삭제',
      koreanWord: '한국어 단어 (한글):',
      germanWord: '독일어 번역:',
      exampleKorean: '한국어 예문 (선택 사항):',
      exampleGerman: '예문 독일어 번역 (선택 사항):',
      addSingleBtn: '단어 저장하기',
      savedCount: (c) => `저장된 내 단어 수: ${c}개`,
    },
    syncModal: {
      title: '학습 진행도 & SRS 백업 / 복원',
      textareaPlaceholder: 'JSON 백업 코드를 여기에 붙여넣으세요...',
      copyCode: '코드 복사',
      loadProgress: '진행도 불러오기',
      copiedSuccess: '✓ 백업 코드가 클립보드에 복사되었습니다!',
      copyError: '복사에 실패했습니다. 텍스트를 직접 복사해 주세요.',
      loadSuccess: '✓ SRS 진행도 및 내 단어가 성공적으로 복원되었습니다!',
      loadError: '✗ 유효하지 않은 코드입니다. 형식을 확인해 주세요.',
    },
    resetModal: {
      title: 'SRS 학습 진행도를 초기화할까요?',
      desc: '모든 SRS 단계와 학습 기록을 초기화하시겠습니까? 직접 추가한 사용자 단어는 그대로 유지됩니다.',
      cancel: '취소',
      confirm: '초기화하기',
    },
  },
};
