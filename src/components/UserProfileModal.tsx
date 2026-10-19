import React, { useEffect, useMemo } from 'react';
import { X, RotateCcw, Award, BookOpen, Sparkles, CheckCircle2, Clock, Cloud, LogOut } from 'lucide-react';
import { TopikLevel, VocabItem } from '../data/vocabData';
import { SrsMap, getSrsRecord, isCardDue, getSrsStageLabel } from '../utils/srs';
import { AppLanguage, translations } from '../utils/translations';
import { GatHatIcon } from './GatHatIcon';
import { auth, signOutUser } from '../services/firebase';
import { hapticTap } from '../utils/haptics';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: TopikLevel;
  topik1Items: VocabItem[];
  topik2Items: VocabItem[];
  srsMap: SrsMap;
  lang: AppLanguage;
  onOpenSync: () => void;
  onOpenReset: () => void;
}

interface ScholarRank {
  krTitle: string;
  hanja: string;
  deTitle: string;
  descDe: string;
  descKr: string;
  minPoints: number;
  nextPoints: number | null;
}

const SCHOLAR_RANKS: ScholarRank[] = [
  {
    krTitle: '초학',
    hanja: '初學',
    deTitle: 'Novize der Akademie',
    descDe: 'Die Reise durch Hangul und Joseon-Weisheit beginnt.',
    descKr: '한글과 어휘의 길을 막 걷기 시작한 입문자입니다.',
    minPoints: 0,
    nextPoints: 25,
  },
  {
    krTitle: '유생',
    hanja: '儒生',
    deTitle: 'Konfuzianischer Student',
    descDe: 'Fleißiges Studium in der Seonggyungwan-Gelehrtenschule.',
    descKr: '성균관에서 꾸준히 단어를 익히는 성실한 유생입니다.',
    minPoints: 25,
    nextPoints: 80,
  },
  {
    krTitle: '생원',
    hanja: '生員',
    deTitle: 'Klassik-Gelehrter',
    descDe: 'Erste Staatsprüfung bestanden – solides Fundament im Wortschatz.',
    descKr: '소과에 합격하여 탄탄한 어휘 실력을 갖춘 선비입니다.',
    minPoints: 80,
    nextPoints: 180,
  },
  {
    krTitle: '진사',
    hanja: '進士',
    deTitle: 'Literatur-Meister',
    descDe: 'Hohe Sprachgewandtheit in koreanischer Grammatik und Nuancen.',
    descKr: '문장과 어휘의 깊은 뜻을 통달한 뛰어난 인재입니다.',
    minPoints: 180,
    nextPoints: 350,
  },
  {
    krTitle: '대제학',
    hanja: '大提學',
    deTitle: 'Großgelehrter von Joseon',
    descDe: 'Oberhaupt der Königlichen Akademie (Hongmungwan).',
    descKr: '홍문관의 최고 경지에 오른 한국어 마스터입니다.',
    minPoints: 350,
    nextPoints: null,
  },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
  topik1Items,
  topik2Items,
  srsMap,
  lang,
  onOpenSync,
  onOpenReset,
}) => {
  const t = translations[lang];
  const isKr = lang === 'kr';

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const profileStats = useMemo(() => {
    const allItems = [...topik1Items, ...topik2Items];
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
    const categories = (['noun', 'verb', 'grammar', 'custom'] as const)
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
    let rank = SCHOLAR_RANKS[0];
    for (const r of SCHOLAR_RANKS) {
      if (totalPoints >= r.minPoints) {
        rank = r;
      }
    }

    const rankProgressPct = rank.nextPoints
      ? Math.min(
          100,
          Math.round(((totalPoints - rank.minPoints) / (rank.nextPoints - rank.minPoints)) * 100)
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
      rankProgressPct,
    };
  }, [topik1Items, topik2Items, currentLevel, srsMap, t.categories]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg hanji-card-elevated rounded-3xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto animate-pop"
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
                    <span className="font-medium text-ink">{auth.currentUser.email}</span>
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
            className="min-w-[40px] min-h-[40px] rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card flex items-center justify-center text-ink transition"
            aria-label={isKr ? '닫기' : 'Schließen'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Joseon Scholar Rank Card (갓 / Gat Badge) */}
        <div className="p-4 rounded-2xl bg-surface/80 border border-border-card space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-celadon uppercase tracking-wider">
                {isKr ? '현재 선비 품계' : 'Aktueller Gelehrten-Rang'}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="hangul-display text-2xl font-bold text-ink">
                  {profileStats.rank.krTitle}
                </span>
                <span className="text-xs font-serif text-muted">
                  ({profileStats.rank.hanja})
                </span>
                <span className="text-sm font-bold text-ink">
                  · {profileStats.rank.deTitle}
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                {isKr ? profileStats.rank.descKr : profileStats.rank.descDe}
              </p>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-card border border-border-card text-right shrink-0">
              <span className="text-[10px] text-muted block">
                {isKr ? '수련 점수' : 'SRS-Punkte'}
              </span>
              <span className="font-mono tabular-nums text-sm font-bold text-ochre">
                {profileStats.totalPoints} XP
              </span>
            </div>
          </div>

          {/* Progress to next Scholar Rank */}
          {profileStats.rank.nextPoints && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-muted tabular-nums">
                <span>
                  {isKr ? '다음 품계까지 진행도' : 'Fortschritt zum nächsten Rang'}
                </span>
                <span className="font-semibold text-ink">
                  {profileStats.totalPoints} / {profileStats.rank.nextPoints} XP
                </span>
              </div>
              <div className="w-full bg-card h-2 rounded-full overflow-hidden border border-border-card">
                <div
                  className="bg-celadon h-full transition-all duration-500"
                  style={{ width: `${profileStats.rankProgressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 3 Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5">
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

        {/* Footer Quick Actions (Cloud Sync / Reset / Logout) */}
        <div className="pt-3 border-t border-border-card flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onClose();
              onOpenSync();
            }}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-ink text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Cloud className="w-3.5 h-3.5 text-celadon" />
            <span>{t.actions.exportSync}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                hapticTap();
                onClose();
                onOpenReset();
              }}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-dancheong/10 hover:bg-dancheong/20 border border-dancheong/30 text-dancheong text-xs font-semibold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.actions.resetProgress}</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                hapticTap();
                onClose();
                await signOutUser();
              }}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-muted hover:text-ink text-xs font-semibold transition flex items-center gap-1.5"
              title={isKr ? '로그아웃' : 'Abmelden'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isKr ? '로그아웃' : 'Abmelden'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
