import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VocabItem } from '../data/vocabData';
import { highlightKoreanVocab } from '../utils/highlightVocab';
import { hapticRepeat, hapticSuccess, hapticTap } from '../utils/haptics';
import { HanjaBreakdownBox } from './HanjaBreakdownBox';
import { buildStrictCategoryOptions } from '../utils/quizDistractors';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';

import { AppLanguage, translations } from '../utils/translations';

interface QuizViewProps {
  deck: VocabItem[];
  allLevelItems: VocabItem[];
  krToDe: boolean;
  lang?: AppLanguage;
  onMarkSrs?: (id: string, success: boolean) => void;
  onOpenUpload?: () => void;
}

interface QuizQuestion {
  item: VocabItem;
  questionText: string;
  correctAnswer: string;
  options: string[];
}

export const QuizView: React.FC<QuizViewProps> = ({
  deck,
  allLevelItems,
  krToDe,
  lang = 'de',
  onMarkSrs,
  onOpenUpload,
}) => {
  const t = translations[lang];

  // Atomic state for the active quiz round
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Track the deck signature (list of IDs) and direction so we only regenerate
  // when the user actually changes filters or direction, NOT on SRS rating updates!
  const lastDeckSignatureRef = useRef<string>('');
  const lastKrToDeRef = useRef<boolean>(krToDe);

  const initQuizRound = useCallback(
    (sourceDeck: VocabItem[]) => {
      if (sourceDeck.length === 0) {
        setQuestions([]);
        setQuestionIndex(0);
        setSelectedOption(null);
        setScore(0);
        setStreak(0);
        setBestStreak(0);
        setQuizFinished(false);
        return;
      }

      // Max 20 questions per quiz round
      const shuffledDeck = [...sourceDeck].sort(() => Math.random() - 0.5);
      const roundPool = shuffledDeck.slice(0, Math.min(20, shuffledDeck.length));

      const generated: QuizQuestion[] = roundPool.map((item) => {
        const questionText = krToDe ? item.kr : item.de;
        const correctAnswer = (krToDe ? item.de : item.kr).trim();
        // Strictly match distractors from the EXACT SAME grammatical category!
        const options = buildStrictCategoryOptions(
          item,
          krToDe,
          sourceDeck,
          allLevelItems
        );

        return {
          item,
          questionText,
          correctAnswer,
          options,
        };
      });

      setQuestions(generated);
      setQuestionIndex(0);
      setSelectedOption(null);
      setScore(0);
      setStreak(0);
      setQuizFinished(false);
    },
    [krToDe, allLevelItems]
  );

  // Initialize or re-init only when the active deck content or direction changes
  useEffect(() => {
    const signature = deck.map((i) => i.id).join(',');
    const directionChanged = lastKrToDeRef.current !== krToDe;

    if (signature !== lastDeckSignatureRef.current || directionChanged) {
      lastDeckSignatureRef.current = signature;
      lastKrToDeRef.current = krToDe;
      initQuizRound(deck);
    }
  }, [deck, krToDe, initQuizRound]);

  const currentQuestion = questions[questionIndex] || null;

  const handleSelectOption = (option: string) => {
    if (selectedOption !== null || !currentQuestion) return;

    setSelectedOption(option);
    const isCorrect = option === currentQuestion.correctAnswer;

    // Haptic feedback
    if (isCorrect) {
      hapticSuccess();
    } else {
      hapticRepeat();
    }


    if (isCorrect) {
      setScore((s) => s + 1);
      setStreak((st) => {
        const next = st + 1;
        if (next > bestStreak) setBestStreak(next);
        return next;
      });
      if (onMarkSrs) {
        onMarkSrs(currentQuestion.item.id, true);
      }
    } else {
      setStreak(0);
      if (onMarkSrs) {
        onMarkSrs(currentQuestion.item.id, false);
      }
    }
  };

  const handleNext = useCallback(() => {
    hapticTap();
    if (questionIndex + 1 >= questions.length) {
      setQuizFinished(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      setQuestionIndex((i) => i + 1);
      setSelectedOption(null);
    }
  }, [questionIndex, questions.length]);

  const handleRestart = () => {
    hapticTap();
    initQuizRound(deck);
  };

  // Auto-advance keyboard Enter / Space / ArrowRight ONLY AFTER answering
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        selectedOption !== null &&
        (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight')
      ) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedOption, handleNext]);

  if (deck.length < 4) {
    return (
      <div className="my-8 py-14 px-6 text-center hanji-card-elevated rounded-3xl flex flex-col items-center justify-center space-y-3">
        <Sparkles className="w-10 h-10 text-ochre" />
        <h3 className="text-lg font-bold text-ink">
          {lang === 'kr' ? '퀴즈를 시작하기에 단어가 부족합니다' : 'Zu wenige Karten für ein Quiz'}
        </h3>
        <p className="text-xs text-muted max-w-sm">
          {lang === 'kr'
            ? '퀴즈에는 최소 4개의 단어가 필요합니다. CSV 또는 .md 단어장을 업로드해 주세요.'
            : 'Für das Quiz werden mindestens 4 Vokabeln benötigt. Bitte lade eine CSV- oder .md-Liste hoch oder hebe Filter auf.'}
        </p>
        {onOpenUpload && (
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onOpenUpload();
            }}
            className="mt-2 px-5 py-2.5 rounded-xl bg-celadon hover:bg-celadon/90 text-white text-xs font-semibold shadow-sm transition"
          >
            {lang === 'kr' ? '+ CSV / .md 업로드 및 단어 추가' : '+ CSV / .md Liste hochladen'}
          </button>
        )}
      </div>
    );
  }

  if (quizFinished) {
    const percentage =
      questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="my-8 p-8 md:p-12 text-center hanji-card-elevated rounded-3xl flex flex-col items-center justify-center space-y-5 animate-pop">
        <div className="w-16 h-16 rounded-2xl bg-celadon/15 flex items-center justify-center text-celadon shadow-sm">
          <Trophy className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold font-kr text-ink">
            {percentage >= 80
              ? t.quiz.resultTitleExcellent
              : percentage >= 50
              ? t.quiz.resultTitleGood
              : t.quiz.resultTitleKeepGoing}
          </h2>
          <p className="text-sm text-muted">
            {lang === 'kr'
              ? `${questions.length}문제 중 ${score}문제를 맞혔습니다 (${percentage}%).`
              : `Du hast ${score} von ${questions.length} Fragen richtig beantwortet (${percentage}%).`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-xs tabular-nums">
          <div className="bg-surface p-4 rounded-2xl text-center border border-border-card">
            <span className="text-xs text-muted block">{t.quiz.resultScoreLabel}</span>
            <span className="text-2xl font-bold text-celadon">
              {score} / {questions.length}
            </span>
          </div>
          <div className="bg-surface p-4 rounded-2xl text-center border border-border-card">
            <span className="text-xs text-muted block">{t.quiz.resultStreakLabel}</span>
            <span className="text-2xl font-bold text-ochre flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 fill-ochre" />
              <span>{bestStreak}</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="min-h-[48px] px-6 py-3 rounded-2xl bg-celadon hover:bg-celadon/90 text-white font-bold text-sm shadow-sm transition flex items-center gap-2 active:scale-[0.98]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t.quiz.newQuizBtn}</span>
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const isAnswered = selectedOption !== null;

  // Category label formatter supporting all categories: noun, verb, adjective, adverb, phrase, grammar
  const renderCategoryBadge = (cat?: string) => {
    if (cat === 'noun') return t.quiz.catNoun;
    if (cat === 'verb') return t.quiz.catVerb;
    if (cat === 'adjective') return t.quiz.catAdjective;
    if (cat === 'adverb') return t.quiz.catAdverb;
    if (cat === 'phrase') return t.quiz.catPhrase;
    if (cat === 'grammar') return t.quiz.catGrammar;
    return cat || '';
  };

  return (
    <div className="mt-1.5 flex flex-col max-w-2xl mx-auto w-full">
      {/* Quiz Progress & Stats */}
      <div className="flex items-center justify-between text-xs text-muted mb-1.5 px-1 tabular-nums">
        <span className="font-semibold text-ink">
          {t.quiz.questionOf(questionIndex + 1, questions.length)}
        </span>
        <div className="flex items-center gap-3">
          {streak > 1 && (
            <span className="flex items-center gap-1 text-ochre font-bold">
              <Flame className="w-3.5 h-3.5 fill-ochre" />
              <span>{t.quiz.streak(streak)}</span>
            </span>
          )}
          <span className="font-bold text-celadon">{t.quiz.score(score)}</span>
        </div>
      </div>

      <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden mb-2.5 border border-border-card/80">
        <div
          className="bg-celadon h-full transition-all duration-300 ease-out"
          style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card with Hanji Paper Depth */}
      <div className="hanji-card-elevated rounded-3xl p-6 sm:p-8 md:p-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted font-medium">
            <span className="font-semibold text-ink/80">{currentQuestion.item.level}</span>
            <span aria-hidden="true">·</span>
            <span>{currentQuestion.item.sub}</span>
            <span aria-hidden="true">·</span>
            <span className="text-celadon font-semibold">
              {renderCategoryBadge(currentQuestion.item.cat)}
            </span>
          </div>
        </div>

        <div className="text-center py-4 sm:py-6">
          <span className="text-xs font-medium text-muted block mb-3">
            {krToDe ? t.quiz.askKrToDe : t.quiz.askDeToKr}
          </span>
          <h2
            className={`text-ink text-balance ${
              krToDe
                ? 'hangul-display text-4xl sm:text-5xl md:text-6xl font-bold'
                : 'text-2xl sm:text-4xl font-bold tracking-tight leading-snug'
            }`}
          >
            {currentQuestion.questionText}
          </h2>
        </div>

        {/* 4 Choices Strictly Matched to the Question's Grammatical Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQuestion.options.map((opt, idx) => {
            let btnStyle =
              'bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 text-ink border-border-card';
            let icon = null;

            if (isAnswered) {
              if (opt === currentQuestion.correctAnswer) {
                btnStyle =
                  'bg-celadon/15 border-celadon text-celadon font-bold ring-2 ring-celadon/30';
                icon = <CheckCircle2 className="w-4 h-4 text-celadon shrink-0" />;
              } else if (opt === selectedOption) {
                btnStyle =
                  'bg-dancheong/15 border-dancheong text-dancheong font-semibold';
                icon = <XCircle className="w-4 h-4 text-dancheong shrink-0" />;
              } else {
                btnStyle = 'opacity-35 bg-surface border-border-card text-muted';
              }
            }

            return (
              <button
                type="button"
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(opt)}
                className={`min-h-[54px] w-full p-4 rounded-2xl border text-left text-sm sm:text-base transition flex items-center justify-between gap-3 active:scale-[0.98] ${btnStyle}`}
              >
                <span
                  className={
                    !krToDe
                      ? 'font-kr text-base sm:text-lg font-semibold tracking-wide'
                      : 'font-medium'
                  }
                >
                  {opt}
                </span>
                {icon}
              </button>
            );
          })}
        </div>

        {/* Feedback box when answered - Stays comfortably until user explicitly advances */}
        {isAnswered && (
          <div className="pt-4 border-t border-border-card space-y-3.5 animate-pop">
            <HanjaBreakdownBox
              krWord={currentQuestion.item.kr}
              cat={currentQuestion.item.cat}
              lang={lang}
              variant="card"
            />

            {currentQuestion.item.exKr && (
              <div className="bg-hanji/90 p-4 rounded-2xl border border-border-card/70 text-left space-y-1.5">
                <span className="text-[11px] font-semibold text-celadon block">
                  {t.quiz.exampleLabel}
                </span>
                <p className="font-kr text-base font-medium text-ink leading-relaxed tracking-wide">
                  {highlightKoreanVocab(
                    currentQuestion.item.exKr,
                    currentQuestion.item.kr,
                    'celadon'
                  )}
                </p>
                <p className="text-xs sm:text-sm text-muted">
                  {currentQuestion.item.exDe}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted">
                {t.quiz.nextQuestionHint}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-celadon hover:bg-celadon/90 text-white font-bold text-sm shadow-sm transition flex items-center gap-1.5 active:scale-[0.98]"
              >
                <span>{t.quiz.nextQuestionBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
