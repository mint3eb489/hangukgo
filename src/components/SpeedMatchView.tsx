import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VocabItem } from '../data/vocabData';
import { SrsMap } from '../utils/srs';
import { AppLanguage, translations } from '../utils/translations';
import { hapticTap, hapticSuccess, hapticRepeat } from '../utils/haptics';
import confetti from 'canvas-confetti';
import { RamyeonPacketIcon } from './RamyeonPacketIcon';
import {
  Zap,
  RotateCw,
  Clock,
  Flame,
  Trophy,
  ChevronUp,
  ArrowRight,
  FolderOpen,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';

interface SpeedMatchViewProps {
  deck: VocabItem[];
  categoryKey?: string;
  srsMap: SrsMap;
  lang?: AppLanguage;
  onMarkSrs: (id: string, success: boolean) => void;
  onOpenUpload?: () => void;
  // Optional Ramyeon integration in match bar
  isRamyeonRunning?: boolean;
  ramyeonTimeLeft?: number;
  onOpenRamyeon?: () => void;
}

interface MatchCard {
  cardId: string;
  itemId: string;
  type: 'kr' | 'de';
  text: string;
  hanja?: string;
  category: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const SpeedMatchView: React.FC<SpeedMatchViewProps> = ({
  deck,
  categoryKey = '',
  lang = 'de',
  onMarkSrs,
  onOpenUpload,
  isRamyeonRunning = false,
  ramyeonTimeLeft = 0,
  onOpenRamyeon,
}) => {
  const t = translations[lang];

  // Configurable pair size: Strictly 4 or 6 pairs
  const [pairSize, setPairSize] = useState<number>(6);

  // Configurable total rounds: 2, 4, or 6 rounds
  const [totalRounds, setTotalRounds] = useState<number>(4);
  const [currentRound, setCurrentRound] = useState<number>(1);

  // Dropup picker popovers for compact selection on mobile/desktop
  const [isPairPickerOpen, setIsPairPickerOpen] = useState<boolean>(false);
  const [isRoundPickerOpen, setIsRoundPickerOpen] = useState<boolean>(false);

  // Offset in deck to pull distinct batches across rounds
  const [activeDeckOffset, setActiveDeckOffset] = useState<number>(0);
  const [gameSessionId, setGameSessionId] = useState<number>(1);

  // Keep a stable ref to the latest deck so round actions draw fresh items without mid-round rerenders
  const deckRef = useRef<VocabItem[]>(deck);
  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  // Gameplay state
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [matchedCardIds, setMatchedCardIds] = useState<Set<string>>(new Set());
  const [justMatchedCardIds, setJustMatchedCardIds] = useState<Set<string>>(new Set());
  const [mismatchedCardIds, setMismatchedCardIds] = useState<string[]>([]);
  const [isProcessingMismatch, setIsProcessingMismatch] = useState<boolean>(false);

  // Stats across the whole multi-round game
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Round transition state (between individual cleared boards)
  const [isRoundTransition, setIsRoundTransition] = useState<boolean>(false);
  // Entire multi-round game completed
  const [isGameFinished, setIsGameFinished] = useState<boolean>(false);

  // Timer interval ref & transition timeout ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize a board for a specific round
  const loadBoardForRound = useCallback(
    (offset: number, size: number, sourceDeckOverride?: VocabItem[]) => {
      const sourceDeck = sourceDeckOverride || deckRef.current;
      if (!sourceDeck || sourceDeck.length === 0) {
        setCards([]);
        setIsTimerRunning(false);
        setIsRoundTransition(false);
        setIsGameFinished(false);
        return;
      }

      const effectiveSize = Math.min(size, sourceDeck.length);
      const startIndex = (offset * effectiveSize) % sourceDeck.length;
      let selectedItems: VocabItem[] = [];

      if (sourceDeck.length <= effectiveSize) {
        selectedItems = shuffleArray(sourceDeck);
      } else {
        const slice = sourceDeck.slice(startIndex, startIndex + effectiveSize);
        if (slice.length < effectiveSize) {
          selectedItems = [...slice, ...sourceDeck.slice(0, effectiveSize - slice.length)];
        } else {
          selectedItems = slice;
        }
        selectedItems = shuffleArray(selectedItems);
      }

      // Build 2 cards per item: 1 Korean and 1 German
      const newCards: MatchCard[] = [];
      selectedItems.forEach((item) => {
        newCards.push({
          cardId: `${item.id}-kr`,
          itemId: item.id,
          type: 'kr',
          text: item.kr,
          hanja: item.hanja,
          category: item.cat,
        });
        newCards.push({
          cardId: `${item.id}-de`,
          itemId: item.id,
          type: 'de',
          text: item.de,
          category: item.cat,
        });
      });

      setCards(shuffleArray(newCards));
      setSelectedCardId(null);
      setMatchedCardIds(new Set());
      setJustMatchedCardIds(new Set());
      setMismatchedCardIds([]);
      setIsProcessingMismatch(false);
      setIsRoundTransition(false);
      // NOTE: Timer does NOT start automatically! Waits for user's first tap.
      setIsTimerRunning(false);
    },
    []
  );

  // Reset entire game session (Round 1, reset timer & stats)
  const startNewGameSession = useCallback(
    (newPairSize?: number, newTotalRounds?: number, newOffset?: number) => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      const targetSize = newPairSize ?? pairSize;
      const targetRounds = newTotalRounds ?? totalRounds;
      const targetOffset = newOffset ?? 0;

      setCurrentRound(1);
      setActiveDeckOffset(targetOffset);
      setStreak(0);
      setBestStreak(0);
      setMistakes(0);
      setTimerSeconds(0);
      setIsTimerRunning(false);
      setIsGameFinished(false);
      setIsRoundTransition(false);
      setIsPairPickerOpen(false);
      setIsRoundPickerOpen(false);
      loadBoardForRound(targetOffset, targetSize, deckRef.current);
    },
    [pairSize, totalRounds, loadBoardForRound]
  );

  // When category changes, reset session
  useEffect(() => {
    startNewGameSession(pairSize, totalRounds, 0);
  }, [categoryKey, startNewGameSession, pairSize, totalRounds, gameSessionId]);

  // If cards are empty but deck is loaded (e.g. on initial mount if deck loaded asynchronously)
  useEffect(() => {
    if (cards.length === 0 && deck.length > 0 && !isGameFinished) {
      loadBoardForRound(activeDeckOffset, pairSize, deck);
    }
  }, [deck, cards.length, isGameFinished, activeDeckOffset, pairSize, loadBoardForRound]);

  // Timer runner (only ticks when running and game not finished)
  useEffect(() => {
    if (isTimerRunning && !isGameFinished && !isRoundTransition) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, isGameFinished, isRoundTransition]);

  // Clean up any pending transition timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  // Format time as MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  // Card click handler
  const handleCardClick = useCallback(
    (card: MatchCard) => {
      if (isProcessingMismatch || isGameFinished || isRoundTransition) return;
      if (matchedCardIds.has(card.cardId)) return;

      // START TIMER ON FIRST CARD TAP!
      if (!isTimerRunning) {
        setIsTimerRunning(true);
      }

      // Deselect if tapping the already selected card
      if (selectedCardId === card.cardId) {
        hapticTap();
        setSelectedCardId(null);
        return;
      }

      // No card currently selected -> select this one
      if (!selectedCardId) {
        hapticTap();
        setSelectedCardId(card.cardId);
        return;
      }

      // Second card tapped!
      const firstCard = cards.find((c) => c.cardId === selectedCardId);
      if (!firstCard) {
        setSelectedCardId(card.cardId);
        return;
      }

      // Check match: Must have matching itemId and opposite type (one 'kr' and one 'de')
      const isMatch = firstCard.itemId === card.itemId && firstCard.type !== card.type;

      if (isMatch) {
        // MATCH SUCCESS!
        hapticSuccess();
        const nextMatched = new Set(matchedCardIds);
        nextMatched.add(firstCard.cardId);
        nextMatched.add(card.cardId);

        // Flash immediate success state
        setJustMatchedCardIds(new Set([firstCard.cardId, card.cardId]));
        setMatchedCardIds(nextMatched);
        setSelectedCardId(null);

        // Transition from flash glow to cleared slot after 320ms
        setTimeout(() => {
          setJustMatchedCardIds((prev) => {
            const next = new Set(prev);
            next.delete(firstCard.cardId);
            next.delete(card.cardId);
            return next;
          });
        }, 320);

        // Mark SRS progress in state/storage
        onMarkSrs(card.itemId, true);

        // Streak updates
        setStreak((prev) => {
          const next = prev + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });

        // Check if all cards in current round are matched
        if (nextMatched.size === cards.length && cards.length > 0) {
          // Pause timer while transitioning or completing
          setIsTimerRunning(false);

          if (currentRound < totalRounds) {
            // BOARD CLEARED, MORE ROUNDS REMAINING!
            setTimeout(() => {
              setIsRoundTransition(true);
              try {
                confetti({
                  particleCount: 35,
                  spread: 60,
                  origin: { y: 0.6 },
                  colors: ['#0f766e', '#10b981', '#f59e0b', '#ffffff'],
                });
              } catch {
                // ignore
              }

              // Auto-advance to the next round after 1.4s if user doesn't manually click
              transitionTimeoutRef.current = setTimeout(() => {
                advanceToNextRound();
              }, 1400);
            }, 400);
          } else {
            // ENTIRE MULTI-ROUND GAME COMPLETED!
            setTimeout(() => {
              setIsGameFinished(true);
              try {
                confetti({
                  particleCount: 75,
                  spread: 85,
                  origin: { y: 0.5 },
                  colors: ['#0f766e', '#10b981', '#f59e0b', '#dc2626', '#ffffff'],
                });
              } catch {
                // ignore
              }
            }, 450);
          }
        }
      } else {
        // MISMATCH!
        hapticRepeat();
        setStreak(0);
        setMistakes((prev) => prev + 1);
        setIsProcessingMismatch(true);
        setMismatchedCardIds([firstCard.cardId, card.cardId]);

        setTimeout(() => {
          setMismatchedCardIds([]);
          setSelectedCardId(null);
          setIsProcessingMismatch(false);
        }, 450);
      }
    },
    [
      cards,
      selectedCardId,
      matchedCardIds,
      isProcessingMismatch,
      isGameFinished,
      isRoundTransition,
      isTimerRunning,
      currentRound,
      totalRounds,
      onMarkSrs,
    ]
  );

  // Advance to next round within current game session
  const advanceToNextRound = useCallback(() => {
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    hapticTap();
    const nextRoundNum = currentRound + 1;
    const nextOffset = activeDeckOffset + 1;
    setCurrentRound(nextRoundNum);
    setActiveDeckOffset(nextOffset);
    setIsRoundTransition(false);
    // Load fresh board of new words; timer pauses until first tap!
    loadBoardForRound(nextOffset, pairSize, deckRef.current);
  }, [currentRound, activeDeckOffset, pairSize, loadBoardForRound]);

  // Handle changing pair size (4 or 6)
  const handleSelectPairSize = (size: number) => {
    if (size === pairSize) return;
    hapticTap();
    setPairSize(size);
    startNewGameSession(size, totalRounds, 0);
  };

  // Handle changing total rounds (2, 4, or 6)
  const handleSelectTotalRounds = (rounds: number) => {
    if (rounds === totalRounds) return;
    hapticTap();
    setTotalRounds(rounds);
    startNewGameSession(pairSize, rounds, 0);
  };

  // Quick reset current game session
  const handleResetGame = () => {
    hapticTap();
    setGameSessionId((prev) => prev + 1);
    startNewGameSession(pairSize, totalRounds, 0);
  };

  // Empty state if no vocab is available
  if (!deck || deck.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-card border border-border-card rounded-3xl shadow-sm my-auto min-h-[340px]">
        <div className="w-14 h-14 rounded-2xl bg-celadon/10 border border-celadon/20 flex items-center justify-center text-celadon mb-3">
          <Zap className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-ink mb-1">{t.speedMatch.emptyTitle}</h3>
        <p className="text-xs text-muted max-w-sm mb-4 leading-relaxed">
          {t.speedMatch.emptyDesc}
        </p>
        {onOpenUpload && (
          <button
            type="button"
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-celadon hover:bg-celadon-dark text-white rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>{t.actions.addVocab}</span>
          </button>
        )}
      </div>
    );
  }

  const totalPairsInRound = Math.floor(cards.length / 2);
  const matchedPairsInRound = Math.floor(matchedCardIds.size / 2);
  const progressPercent =
    totalPairsInRound > 0 ? (matchedPairsInRound / totalPairsInRound) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col justify-between max-w-3xl mx-auto w-full px-1.5 sm:px-3 py-1 select-none min-h-0">
      {/* GAME BOARD: Centered in main area */}
      <div className="flex-1 relative flex flex-col justify-center min-h-[280px] sm:min-h-[350px] my-auto">
        {/* INTERMEDIATE ROUND CLEAR TRANSITION BANNER */}
        {isRoundTransition && !isGameFinished && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 rounded-3xl animate-fadeIn">
            <div className="bg-card border-2 border-celadon/50 rounded-3xl p-5 sm:p-6 text-center shadow-xl max-w-sm w-full animate-pop flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-celadon/15 text-celadon border border-celadon/30 flex items-center justify-center mb-2.5">
                <CheckCircle2 className="w-6 h-6 text-celadon" />
              </div>

              <div className="text-xs font-bold text-celadon uppercase tracking-wider mb-1">
                {lang === 'kr' ? '필드 정리 완료!' : 'Feld aufgeräumt!'}
              </div>

              <h4 className="text-lg font-bold text-ink mb-1">
                {lang === 'kr'
                  ? `${currentRound} / ${totalRounds} 라운드 클리어!`
                  : `Runde ${currentRound} von ${totalRounds} geschafft!`}
              </h4>

              <p className="text-xs text-muted mb-4">
                {lang === 'kr'
                  ? '다음 새로운 단어 필드가 준비되었습니다.'
                  : 'Nächstes Wortfeld ist bereit. Der Timer startet bei deinem ersten Tipp!'}
              </p>

              <button
                type="button"
                onClick={advanceToNextRound}
                className="w-full py-2.5 px-4 rounded-xl bg-celadon hover:bg-celadon-dark text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <span>
                  {lang === 'kr'
                    ? `${currentRound + 1}라운드 시작`
                    : `Runde ${currentRound + 1} starten`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* FINAL VICTORY CELEBRATION (all rounds finished) */}
        {isGameFinished ? (
          <div className="bg-card border-2 border-celadon/40 rounded-3xl p-5 sm:p-7 text-center shadow-lg animate-pop my-auto flex flex-col items-center max-w-md mx-auto w-full">
            <div className="w-14 h-14 rounded-full bg-celadon/15 text-celadon border border-celadon/30 flex items-center justify-center mb-2.5">
              <Trophy className="w-7 h-7 fill-celadon text-celadon" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-celadon/10 text-celadon text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {lang === 'kr'
                  ? `총 ${totalRounds}라운드 완료!`
                  : `Alle ${totalRounds} Runden aufgeräumt!`}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-ink mb-1">
              {t.speedMatch.roundCompleteTitle}
            </h3>

            <p className="text-xs sm:text-sm text-muted mb-4 leading-relaxed">
              {lang === 'kr'
                ? `총 ${totalRounds * pairSize}쌍의 단어를 ${formatTime(timerSeconds)}만에 정리했습니다!`
                : `${totalRounds * pairSize} Paare in ${totalRounds} Runden in ${formatTime(timerSeconds)} gefunden! ${
                    mistakes === 0 ? 'Fehlerfrei! ⭐' : `${mistakes} Fehlversuch(e)`
                  }`}
            </p>

            {/* Stats badges */}
            <div className="grid grid-cols-3 gap-2 w-full mb-5">
              <div className="p-2 rounded-2xl bg-surface border border-border-card text-center">
                <div className="text-[10px] text-muted uppercase font-bold tracking-wider mb-0.5">
                  {t.speedMatch.time}
                </div>
                <div className="text-sm sm:text-base font-bold text-ink font-mono">
                  {formatTime(timerSeconds)}
                </div>
              </div>

              <div className="p-2 rounded-2xl bg-surface border border-border-card text-center">
                <div className="text-[10px] text-muted uppercase font-bold tracking-wider mb-0.5">
                  Streak
                </div>
                <div className="text-sm sm:text-base font-bold text-dancheong">
                  {bestStreak}x
                </div>
              </div>

              <div className="p-2 rounded-2xl bg-surface border border-border-card text-center">
                <div className="text-[10px] text-muted uppercase font-bold tracking-wider mb-0.5">
                  Fehler
                </div>
                <div className="text-sm sm:text-base font-bold text-ink">
                  {mistakes}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => startNewGameSession(pairSize, totalRounds, activeDeckOffset + 1)}
                className="w-full py-2.5 px-4 rounded-xl bg-celadon hover:bg-celadon-dark text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>{t.speedMatch.newGame}</span>
              </button>

              <button
                type="button"
                onClick={() => startNewGameSession(pairSize, totalRounds, 0)}
                className="w-full py-2 px-4 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-800 text-ink font-semibold text-xs border border-border-card transition flex items-center justify-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{t.speedMatch.playAgain}</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`grid gap-1.5 sm:gap-2.5 ${
              totalPairsInRound <= 4
                ? 'grid-cols-2 sm:grid-cols-4'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
            }`}
          >
            {cards.map((card) => {
              const isSelected = selectedCardId === card.cardId;
              const isMatched = matchedCardIds.has(card.cardId);
              const isJustMatched = justMatchedCardIds.has(card.cardId);
              const isMismatched = mismatchedCardIds.includes(card.cardId);

              // If matched and finished flash glow -> Render as an empty cleared slot!
              // This physically clears the board so the user tidies up the field!
              if (isMatched && !isJustMatched) {
                return (
                  <div
                    key={card.cardId}
                    className="relative flex items-center justify-center rounded-2xl border border-dashed border-border-card/30 bg-surface/20 min-h-[58px] sm:min-h-[72px] transition-all duration-300 pointer-events-none select-none opacity-30"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-muted/30" />
                  </div>
                );
              }

              // Card styling depending on active match state
              let cardClasses =
                'relative flex flex-col items-center justify-center text-center p-2 sm:p-3 rounded-2xl border transition-all duration-200 select-none min-h-[58px] sm:min-h-[72px] cursor-pointer touch-manipulation shadow-2xs ';

              if (isJustMatched) {
                // Just matched: Energetic emerald celebration flash
                cardClasses +=
                  'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200 scale-105 shadow-sm ring-2 ring-emerald-500/30 z-10';
              } else if (isMismatched) {
                // Wrong mismatch: Dancheong red shake
                cardClasses +=
                  'bg-dancheong/20 border-dancheong text-dancheong animate-shake scale-102 ring-2 ring-dancheong/30 z-10';
              } else if (isSelected) {
                // Active selected card: Celadon focus ring
                cardClasses +=
                  'bg-celadon/15 border-2 border-celadon text-ink ring-2 ring-celadon/40 scale-[1.02] shadow-sm z-10';
              } else {
                // Idle card: Clean Hanji paper card
                cardClasses +=
                  'bg-card hover:bg-surface border-border-card hover:border-celadon/40 text-ink active:scale-98';
              }

              return (
                <button
                  key={card.cardId}
                  type="button"
                  disabled={isMatched || isProcessingMismatch || isRoundTransition}
                  onClick={() => handleCardClick(card)}
                  className={cardClasses}
                >
                  {/* Subtle category / card type indicator */}
                  <span className="absolute top-1.5 left-2 text-[9px] uppercase font-bold tracking-wider text-muted opacity-60">
                    {card.type === 'kr' ? 'KR' : 'DE'}
                  </span>

                  {/* Main text: Korean words styled with prominent font, German wrapped nicely */}
                  {card.type === 'kr' ? (
                    <div className="flex flex-col items-center gap-0.5 mt-1">
                      <span className="text-sm sm:text-base font-bold tracking-tight text-ink">
                        {card.text}
                      </span>
                      {card.hanja && (
                        <span className="text-[10px] text-muted opacity-80 font-serif">
                          {card.hanja}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs sm:text-sm font-semibold text-ink leading-snug px-1 line-clamp-2 mt-1">
                      {card.text}
                    </span>
                  )}

                  {/* Flash checkmark when just matched */}
                  {isJustMatched && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute top-1.5 right-1.5 animate-bounce" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* BOTTOM ACTION BAR: Compact Pairs & Rounds buttons with dropup popovers, central Timer and Restart */}
      <div className="shrink-0 mt-auto pt-1 sm:pt-2 pb-0.5">
        <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-4 max-w-xl mx-auto w-full px-1">
          {/* Left: Compact Pairs Button with Dropup Popover */}
          <div className="relative">
            {isPairPickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsPairPickerOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute bottom-full mb-2.5 left-0 z-40 bg-surface/95 dark:bg-card/95 backdrop-blur-md border-2 border-border-card rounded-2xl p-1.5 shadow-xl flex items-center gap-1.5 animate-pop select-none">
                  {[4, 6].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        handleSelectPairSize(size);
                        setIsPairPickerOpen(false);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                        pairSize === size
                          ? 'bg-obangBlue text-white shadow-2xs font-extrabold'
                          : 'bg-card text-muted hover:text-ink hover:bg-surface border border-border-card'
                      }`}
                    >
                      <span className="text-sm font-extrabold font-mono">{size}</span>
                      <span className="text-[11px] font-medium opacity-85">
                        {lang === 'kr' ? '쌍' : 'Paare'}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                hapticTap();
                setIsPairPickerOpen((prev) => !prev);
                setIsRoundPickerOpen(false);
              }}
              className={`min-h-[48px] sm:min-h-[50px] px-2.5 sm:px-3 rounded-2xl border-2 transition shadow-sm flex items-center justify-center gap-1.5 active:scale-95 select-none ${
                isPairPickerOpen
                  ? 'border-obangBlue bg-obangBlue/10 text-obangBlue ring-2 ring-obangBlue/30'
                  : 'border-border-card bg-surface hover:bg-surface/90 text-ink'
              }`}
              title={lang === 'kr' ? '카드 쌍 개수 선택 (4 또는 6)' : 'Paar-Anzahl auswählen (4 oder 6)'}
              aria-label={lang === 'kr' ? '카드 쌍 개수 선택' : 'Paar-Anzahl auswählen'}
            >
              <Zap className="w-4 h-4 text-obangBlue shrink-0 fill-obangBlue/20" />
              <span className="text-sm sm:text-base font-extrabold font-mono text-ink tracking-tight whitespace-nowrap">
                {matchedPairsInRound}/{totalPairsInRound}
              </span>
              <ChevronUp
                className={`w-3.5 h-3.5 text-muted transition-transform duration-200 shrink-0 ${
                  isPairPickerOpen ? 'rotate-180 text-obangBlue' : ''
                }`}
              />
            </button>
          </div>

          {/* Center Group: Restart Button + Timer (+ Ramyeon / Streak) - Centrally focused */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Spiel neu starten Button */}
            <button
              type="button"
              onClick={handleResetGame}
              title={lang === 'kr' ? '게임 새로 시작' : 'Spiel neu starten'}
              aria-label={lang === 'kr' ? '게임 새로 시작' : 'Spiel neu starten'}
              className="w-[42px] sm:w-[46px] h-[48px] sm:h-[50px] rounded-2xl border-2 border-border-card bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 text-muted hover:text-ink flex items-center justify-center transition active:scale-95 shadow-sm shrink-0"
            >
              <RotateCw className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* SpeedMatch Timer: Sitting centered */}
            <div
              className={`min-w-[80px] sm:min-w-[88px] h-[48px] sm:h-[50px] px-3 rounded-2xl border-2 flex flex-col items-center justify-center py-1 transition shadow-sm font-semibold shrink-0 select-none ${
                isTimerRunning
                  ? 'border-celadon/60 bg-celadon/10 text-ink'
                  : timerSeconds === 0
                  ? 'border-border-card bg-surface/80 text-muted'
                  : 'border-border-card bg-surface text-ink'
              }`}
              title={
                !isTimerRunning && timerSeconds === 0
                  ? lang === 'kr'
                    ? '첫 카드를 탭하면 시작'
                    : 'Startet bei erstem Tipp'
                  : lang === 'kr'
                  ? '소요 시간'
                  : 'Laufzeit'
              }
            >
              <Clock
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                  isTimerRunning ? 'text-celadon animate-pulse' : 'text-muted'
                }`}
              />
              <span className="text-[11px] sm:text-[12px] font-mono font-extrabold tabular-nums tracking-tight">
                {formatTime(timerSeconds)}
              </span>
            </div>

            {/* Ramyeon Timer if running */}
            {isRamyeonRunning && onOpenRamyeon && (
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  onOpenRamyeon();
                }}
                className="w-[38px] sm:w-[42px] h-[48px] sm:h-[50px] rounded-2xl border-2 border-dancheong/60 bg-dancheong/10 hover:bg-dancheong/20 text-dancheong flex flex-col items-center justify-center py-1 active:scale-95 transition shadow-sm font-bold shrink-0"
                title="신라면 타이머"
              >
                <RamyeonPacketIcon className="w-3.5 h-3.5 shrink-0" idPrefix="match-bar-ramyeon" />
                <span className="text-[9px] font-mono tabular-nums leading-none font-bold">
                  {Math.floor(ramyeonTimeLeft / 60)}:{(ramyeonTimeLeft % 60).toString().padStart(2, '0')}
                </span>
              </button>
            )}
          </div>

          {/* Right: Compact Rounds Button with Dropup Popover */}
          <div className="relative">
            {isRoundPickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsRoundPickerOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute bottom-full mb-2.5 right-0 z-40 bg-surface/95 dark:bg-card/95 backdrop-blur-md border-2 border-border-card rounded-2xl p-1.5 shadow-xl flex items-center gap-1.5 animate-pop select-none">
                  {[2, 4, 6].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        handleSelectTotalRounds(r);
                        setIsRoundPickerOpen(false);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                        totalRounds === r
                          ? 'bg-celadon text-white shadow-2xs font-extrabold'
                          : 'bg-card text-muted hover:text-ink hover:bg-surface border border-border-card'
                      }`}
                    >
                      <span className="text-sm font-extrabold font-mono">{r}</span>
                      <span className="text-[11px] font-medium opacity-85">
                        {lang === 'kr' ? '라운드' : 'Runden'}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                hapticTap();
                setIsRoundPickerOpen((prev) => !prev);
                setIsPairPickerOpen(false);
              }}
              className={`min-h-[48px] sm:min-h-[50px] px-2.5 sm:px-3 rounded-2xl border-2 transition shadow-sm flex items-center justify-center gap-1.5 active:scale-95 select-none ${
                isRoundPickerOpen
                  ? 'border-celadon bg-celadon/10 text-celadon ring-2 ring-celadon/30'
                  : 'border-border-card bg-surface hover:bg-surface/90 text-ink'
              }`}
              title={lang === 'kr' ? '총 라운드 수 선택 (2, 4 또는 6)' : 'Rundenzahl auswählen (2, 4 oder 6)'}
              aria-label={lang === 'kr' ? '총 라운드 수 선택' : 'Rundenzahl auswählen'}
            >
              <Trophy className="w-4 h-4 text-celadon shrink-0 fill-celadon/20" />
              <span className="text-xs sm:text-sm font-extrabold font-mono text-ink tracking-tight whitespace-nowrap">
                R {currentRound}/{totalRounds}
              </span>
              <ChevronUp
                className={`w-3.5 h-3.5 text-muted transition-transform duration-200 shrink-0 ${
                  isRoundPickerOpen ? 'rotate-180 text-celadon' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
