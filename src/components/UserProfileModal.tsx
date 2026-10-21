import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  X,
  Award,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  Info,
} from 'lucide-react';
import { TopikLevel, VocabItem } from '../data/vocabData';
import { SrsMap, getSrsRecord, isCardDue, getSrsStageLabel } from '../utils/srs';
import { AppLanguage, translations } from '../utils/translations';
import { GatHatIcon } from './GatHatIcon';
import { auth } from '../services/firebase';
import { hapticTap } from '../utils/haptics';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: TopikLevel;
  topik1Items: VocabItem[];
  topik2Items: VocabItem[];
  dramaItems?: VocabItem[];
  srsMap: SrsMap;
  lang: AppLanguage;
  onOpenSync?: () => void;
  onOpenReset?: () => void;
}

export interface ScholarRank {
  levelNumber: number;
  krTitle: string;
  hanja: string;
  deTitle: string;
  descDe: string;
  descKr: string;
  minPoints: number;
  maxPoints: number | null;
  xpLabelDe: string;
  xpLabelKr: string;
}

export const SCHOLAR_RANKS: ScholarRank[] = [
  {
    levelNumber: 1,
    krTitle: '초학',
    hanja: '初學',
    deTitle: 'Novize der Akademie',
    descDe: 'Die Reise durch Hangul und Joseon-Weisheit beginnt.',
    descKr: '한글과 어휘의 길을 막 걷기 시작한 입문자입니다.',
    minPoints: 0,
    maxPoints: 24,
    xpLabelDe: '0 – 24 XP',
    xpLabelKr: '0 ~ 24 XP',
  },
  {
    levelNumber: 2,
    krTitle: '유생',
    hanja: '儒生',
    deTitle: 'Konfuzianischer Student',
    descDe: 'Fleißiges Studium in der Seonggyungwan-Gelehrtenschule.',
    descKr: '성균관에서 꾸준히 단어를 익히는 성실한 유생입니다.',
    minPoints: 25,
    maxPoints: 79,
    xpLabelDe: '25 – 79 XP',
    xpLabelKr: '25 ~ 79 XP',
  },
  {
    levelNumber: 3,
    krTitle: '생원',
    hanja: '生員',
    deTitle: 'Klassik-Gelehrter',
    descDe: 'Erste Staatsprüfung bestanden – solides Fundament im Wortschatz.',
    descKr: '소과에 합격하여 탄탄한 어휘 실력을 갖춘 선비입니다.',
    minPoints: 80,
    maxPoints: 179,
    xpLabelDe: '80 – 179 XP',
    xpLabelKr: '80 ~ 179 XP',
  },
  {
    levelNumber: 4,
    krTitle: '진사',
    hanja: '進士',
    deTitle: 'Literatur-Meister',
    descDe: 'Hohe Sprachgewandtheit in koreanischer Grammatik und Nuancen.',
    descKr: '문장과 어휘의 깊은 뜻을 통달한 뛰어난 인재입니다.',
    minPoints: 180,
    maxPoints: 349,
    xpLabelDe: '180 – 349 XP',
    xpLabelKr: '180 ~ 349 XP',
  },
  {
    levelNumber: 5,
    krTitle: '대제학',
    hanja: '大提學',
    deTitle: 'Großgelehrter von Joseon',
    descDe: 'Oberhaupt der Königlichen Akademie (Hongmungwan).',
    descKr: '홍문관의 최고 경지에 오른 한국어 마스터입니다.',
    minPoints: 350,
    maxPoints: null,
    xpLabelDe: 'ab 350 XP',
    xpLabelKr: '350 XP 이상',
  },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
  topik1Items,
  topik2Items,
  dramaItems = [],
  srsMap,
  lang,
}) => {
  const t = translations[lang];
  const isKr = lang === 'kr';
  const [showRanksTooltip, setShowRanksTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showRanksTooltip) {
          setShowRanksTooltip(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, showRanksTooltip]);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!showRanksTooltip) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setShowRanksTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRanksTooltip]);

  const profileStats = useMemo(() => {
    const allItems = [...topik1Items, ...topik2Items, ...dramaItems];
    let totalPoints = 0;
    let totalMastered = 0;
    let totalLearning = 0;
    let totalDue = 0;

    allItems.forEach((item) => {
      const r = getSrsRecord(item.id, srsMap);
      totalPoints += r.level;
      if (r.level === 5) {
        totalMastered++;
        if (isCardDue(r)) totalDue++;
      } else if (r.level > 0) {
        totalLearning++;
        if (isCardDue(r)) totalDue++;
      } else {
        totalDue++;
      }
    });

    const calcLevelStats = (items: VocabItem[]) => {
      let mastered = 0;
      let learning = 0;
      const stages = [0, 0, 0, 0, 0, 0];

      items.forEach((item) => {
        const r = getSrsRecord(item.id, srsMap);
        stages[r.level] = (stages[r.level] || 0) + 1;
        if (r.level === 5) mastered++;
        else if (r.level > 0) learning++;
      });

      const studied = mastered + learning;
      const total = items.length || 1;
      const progressPct = Math.round((studied / total) * 100);
      const masteredPct = Math.round((mastered / total) * 100);

      return {
        total: items.length,
        studied,
        mastered,
        learning,
        progressPct,
        masteredPct,
        stages,
      };
    };

    const t1 = calcLevelStats(topik1Items);
    const t2 = calcLevelStats(topik2Items);
    const activeItems = currentLevel === 'TOPIK I' ? topik1Items : topik2Items;
    const activeStats = currentLevel === 'TOPIK I' ? t1 : t2;

    // Category breakdown for active TOPIK level
    const categories = (['noun', 'verb', 'adjective', 'adverb', 'phrase', 'grammar'] as const)
      .map((cat) => {
        const catItems = activeItems.filter((i) => i.cat === cat);
        const studied = catItems.filter((i) => getSrsRecord(i.id, srsMap).level > 0).length;
        const mastered = catItems.filter((i) => getSrsRecord(i.id, srsMap).level === 5).length;
        return {
          cat,
          label: t.categories[cat],
          total: catItems.length,
          studied,
          mastered,
          pct: catItems.length > 0 ? Math.round((studied / catItems.length) * 100) : 0,
        };
      })
      .filter((c) => c.total > 0);

    // Determine Scholar Rank
    let rankIndex = 0;
    for (let i = 0; i < SCHOLAR_RANKS.length; i++) {
      if (totalPoints >= SCHOLAR_RANKS[i].minPoints) {
        rankIndex = i;
      }
    }

    const rank = SCHOLAR_RANKS[rankIndex];
    const nextRank = SCHOLAR_RANKS[rankIndex + 1] || null;
    const pointsNeededForNext = nextRank ? nextRank.minPoints - totalPoints : 0;

    const rankProgressPct = nextRank
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(((totalPoints - rank.minPoints) / (nextRank.minPoints - rank.minPoints)) * 100)
          )
        )
      : 100;

    return {
      totalPoints,
      totalMastered,
      totalLearning,
      totalDue,
      t1,
      t2,
      activeStats,
      categories,
      rank,
      rankIndex,
      nextRank,
      pointsNeededForNext,
      rankProgressPct,
    };
  }, [topik1Items, topik2Items, dramaItems, currentLevel, srsMap, t.categories]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 safe-modal-overlay overflow-y-auto p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg hanji-card-elevated rounded-3xl p-5 sm:p-7 space-y-5 safe-modal-panel overflow-y-auto overscroll-contain animate-pop my-auto relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isKr ? '선비 학습 프로필' : 'Benutzerprofil & Lernfortschritt'}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border-card">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-ink text-hanji flex items-center justify-center shadow-sm shrink-0">
              <GatHatIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink tracking-tight">
                {isKr ? '선비 학습 프로필' : 'Gelehrten-Profil & Fortschritt'}
              </h2>
              <p className="text-xs text-muted flex items-center gap-1.5">
                {auth.currentUser?.email ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-celadon inline-block" />
                    <span className="font-medium text-ink truncate max-w-[200px] sm:max-w-xs">
                      {auth.currentUser.email}
                    </span>
                  </>
                ) : isKr ? (
                  '나의 한국어 수련 단계 및 SRS 통계'
                ) : (
                  'Dein persönlicher Joseon-Rang & SRS-Lernstand'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card flex items-center justify-center text-ink transition"
            aria-label={isKr ? '닫기' : 'Schließen'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Joseon Scholar Rank Card (Clearly structured & mobile optimized) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface/90 border border-border-card space-y-3.5">
          {/* Header Row: Category Badge + Info Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-celadon tracking-wider uppercase">
                {isKr ? '현재 선비 품계' : 'Aktueller Gelehrten-Rang'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-celadon/15 text-celadon font-bold tabular-nums">
                {profileStats.rankIndex + 1} / 5
              </span>
            </div>

            {/* Info Tooltip Anchor */}
            <div className="relative" ref={tooltipRef}>
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  setShowRanksTooltip((prev) => !prev);
                }}
                title={isKr ? '모든 품계 및 필요 XP 확인' : 'Alle Gelehrten-Ränge und benötigte XP anzeigen'}
                aria-expanded={showRanksTooltip}
                className={`px-2.5 py-1 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs group active:scale-95 ${
                  showRanksTooltip
                    ? 'bg-obangBlue/15 border-obangBlue/40 text-obangBlue'
                    : 'bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border-border-card text-ink'
                }`}
              >
                <Info className="w-3.5 h-3.5 text-obangBlue group-hover:scale-110 transition-transform" />
                <span>{isKr ? '품계 안내' : 'Alle Ränge'}</span>
              </button>

              {/* Compact Tooltip: Korean, Hanja, German & XP Range */}
              {showRanksTooltip && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 p-3 rounded-2xl bg-surface dark:bg-stone-900 border border-border-card shadow-2xl z-30 animate-fade-in text-left select-none space-y-1.5"
                  role="tooltip"
                >
                  <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-border-card/60 text-[11px] font-bold text-muted uppercase tracking-wider">
                    <span>{isKr ? '선비 품계' : 'Gelehrten-Rang'}</span>
                    <span>{isKr ? '필요 XP' : 'Benötigte XP'}</span>
                  </div>

                  <div className="space-y-1">
                    {SCHOLAR_RANKS.map((r, idx) => {
                      const isCurrent = idx === profileStats.rankIndex;
                      return (
                        <div
                          key={r.levelNumber}
                          className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg transition ${
                            isCurrent
                              ? 'bg-celadon/15 font-bold text-ink ring-1 ring-celadon/40'
                              : 'text-ink/90'
                          }`}
                        >
                          <div className="flex items-baseline gap-1 truncate pr-2">
                            <span className="font-bold">{r.krTitle}</span>
                            <span className="text-[10px] font-serif text-muted">({r.hanja})</span>
                            <span className="text-muted text-[11px] truncate">· {r.deTitle}</span>
                          </div>
                          <span className="font-mono tabular-nums font-bold text-ochre text-[11px] shrink-0">
                            {isKr ? r.xpLabelKr : r.xpLabelDe}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Rank Details */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-0.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="hangul-display text-2xl sm:text-3xl font-black text-ink tracking-tight">
                  {profileStats.rank.krTitle}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-ink/10 text-xs font-serif font-bold text-ink/80 border border-border-card">
                  {profileStats.rank.hanja}
                </span>
                <span className="text-sm sm:text-base font-bold text-ink">
                  · {profileStats.rank.deTitle}
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {isKr ? profileStats.rank.descKr : profileStats.rank.descDe}
              </p>
            </div>

            {/* XP Box */}
            <div className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-card border border-border-card shrink-0 text-left sm:text-right shadow-2xs">
              <span className="text-[10px] text-muted block font-medium">
                {isKr ? '총 수련 점수' : 'Lern-Erfahrung'}
              </span>
              <span className="font-mono tabular-nums text-base sm:text-lg font-black text-ochre block">
                {profileStats.totalPoints} XP
              </span>
            </div>
          </div>

          {/* Progress Bar & Next Level Info */}
          {profileStats.nextRank ? (
            <div className="space-y-1.5 pt-1 border-t border-border-card/60">
              <div className="flex items-center justify-between text-xs text-muted tabular-nums">
                <span className="truncate pr-2">
                  {isKr
                    ? `다음: ${profileStats.nextRank.krTitle} (${profileStats.nextRank.hanja})`
                    : `Nächster: ${profileStats.nextRank.deTitle}`}
                </span>
                <span className="font-bold text-ink shrink-0">
                  {profileStats.totalPoints} / {profileStats.nextRank.minPoints} XP
                </span>
              </div>
              <div className="w-full bg-card h-2 rounded-full overflow-hidden border border-border-card">
                <div
                  className="bg-celadon h-full transition-all duration-500 rounded-full"
                  style={{ width: `${profileStats.rankProgressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>
                  {profileStats.rankProgressPct}% {isKr ? '달성' : 'erreicht'}
                </span>
                <span className="font-medium text-celadon">
                  {isKr
                    ? `승급까지 ${profileStats.pointsNeededForNext} XP 남음`
                    : `Noch ${profileStats.pointsNeededForNext} XP bis zur Beförderung`}
                </span>
              </div>
            </div>
          ) : (
            <div className="pt-1 border-t border-border-card/60 text-xs text-celadon font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {isKr
                  ? '최고 선비 품계(대제학)에 도달하셨습니다! 대단해요!'
                  : 'Höchster Joseon-Rang erreicht: Großgelehrter! 대단해요!'}
              </span>
            </div>
          )}
        </div>

        {/* 3 Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          <div className="p-3 rounded-2xl hanji-card text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-celadon text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.stats.mastered}</span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-ink">
              {profileStats.totalMastered}
            </div>
            <div className="text-[10px] text-muted">
              {isKr ? 'SRS 5단계 완료' : 'Stufe 5 (Meister)'}
            </div>
          </div>

          <div className="p-3 rounded-2xl hanji-card text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-obangBlue text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.stats.learning}</span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-ink">
              {profileStats.totalLearning}
            </div>
            <div className="text-[10px] text-muted">
              {isKr ? 'SRS 1~4단계' : 'Stufe 1–4 aktiv'}
            </div>
          </div>

          <div className="p-3 rounded-2xl hanji-card text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-ochre text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>{t.stats.due}</span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-ink">
              {profileStats.totalDue}
            </div>
            <div className="text-[10px] text-muted">
              {isKr ? '오늘 복습 대기' : 'Heute bereit'}
            </div>
          </div>
        </div>

        {/* TOPIK I & TOPIK II Progress Bars */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold text-muted flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-celadon" />
            <span>{isKr ? '급수별 학습 달성도' : 'Fortschritt nach TOPIK-Stufe'}</span>
          </h3>

          <div className="p-3.5 rounded-2xl hanji-card space-y-3">
            {/* TOPIK I */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-ink flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-obangBlue" />
                  TOPIK I (A1–A2)
                </span>
                <span className="text-muted font-mono tabular-nums">
                  {profileStats.t1.studied} / {profileStats.t1.total} ({profileStats.t1.progressPct}%)
                </span>
              </div>
              <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border-card/80">
                <div
                  className="bg-obangBlue h-full transition-all duration-500"
                  style={{ width: `${profileStats.t1.progressPct}%` }}
                />
              </div>
            </div>

            {/* TOPIK II */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-ink flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-celadon" />
                  TOPIK II (B1–B2)
                </span>
                <span className="text-muted font-mono tabular-nums">
                  {profileStats.t2.studied} / {profileStats.t2.total} ({profileStats.t2.progressPct}%)
                </span>
              </div>
              <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border-card/80">
                <div
                  className="bg-celadon h-full transition-all duration-500"
                  style={{ width: `${profileStats.t2.progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SRS Stage Breakdown for Current Level */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-ochre" />
              <span>
                {isKr
                  ? `${currentLevel} SRS 단계 분포`
                  : `SRS-Stufen in ${currentLevel}`}
              </span>
            </h3>
            <span className="text-[11px] text-muted tabular-nums">
              {profileStats.activeStats.total} {isKr ? '단어' : 'Karten'}
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {[0, 1, 2, 3, 4, 5].map((lvl) => {
              const count = profileStats.activeStats.stages[lvl] || 0;
              const stageInfo = getSrsStageLabel(lvl, lang);
              return (
                <div
                  key={lvl}
                  className="p-2 rounded-xl hanji-card text-center flex flex-col justify-between"
                >
                  <span className="text-[10px] font-semibold text-muted truncate">
                    {lvl === 0 ? (isKr ? '신규' : 'Neu') : `S${lvl}`}
                  </span>
                  <span className="text-sm font-bold font-mono tabular-nums text-ink my-0.5">
                    {count}
                  </span>
                  <span className="text-[9px] text-muted truncate" title={stageInfo.name}>
                    {stageInfo.interval}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Progress in Active Level */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted">
            {isKr
              ? `${currentLevel} 카테고리별 학습 현황`
              : `${currentLevel} nach Wortart`}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {profileStats.categories.map((c) => (
              <div
                key={c.cat}
                className="p-2.5 rounded-xl hanji-card flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-ink truncate">{c.label}</div>
                  <div className="text-[11px] text-muted tabular-nums">
                    {c.studied} / {c.total} {isKr ? '학습됨' : 'begonnen'}
                  </div>
                </div>
                <span className="font-mono tabular-nums font-bold text-celadon shrink-0">
                  {c.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Clean Modal Footer (Removed Vokabel- & Cloud Zentrale, Zurücksetzen, Abmelden) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-xs font-bold text-ink transition"
          >
            {isKr ? '닫기' : 'Schließen'}
          </button>
        </div>
      </div>
    </div>
  );
};
