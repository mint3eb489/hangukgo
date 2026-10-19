import React, { useEffect } from 'react';
import { X, Plus, RotateCcw, ChevronRight, LogOut } from 'lucide-react';
import { AppLanguage, translations } from '../utils/translations';
import { RamyeonPacketIcon } from './RamyeonPacketIcon';
import { SojuBottleIcon } from './SojuBottleIcon';
import { DancheongSettingsIcon } from './DancheongSettingsIcon';
import { LanguageToggleButton } from './LanguageToggleButton';
import { auth, signOutUser } from '../services/firebase';
import { hapticTap } from '../utils/haptics';

interface ExtrasDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: AppLanguage;
  onToggleLanguage: () => void;
  isRamyeonRunning: boolean;
  ramyeonTimeLeft: number;
  onOpenRamyeon: () => void;
  onOpenSoju: () => void;
  onOpenAddVocab: () => void;
  onOpenSync?: () => void;
  onOpenReset: () => void;
  customCount: number;
}

export const ExtrasDrawer: React.FC<ExtrasDrawerProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
  isRamyeonRunning,
  ramyeonTimeLeft,
  onOpenRamyeon,
  onOpenSoju,
  onOpenAddVocab,
  onOpenSync,
  onOpenReset,
  customCount,
}) => {
  const t = translations[language];
  const isKr = language === 'kr';

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-sm bg-hanji border-l border-border-card h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-6 animate-slide-left"
        onClick={(e) => e.stopPropagation()}
        aria-label={isKr ? '설정 및 문화 도구' : 'Extras & Einstellungen'}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border-card">
            <div className="flex items-center gap-3">
              <DancheongSettingsIcon className="w-8 h-8 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-ink tracking-tight">
                  {isKr ? '도구 및 설정' : 'Extras & Einstellungen'}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {isKr
                    ? '한국 문화 미니게임, 언어 및 데이터 관리'
                    : 'Kultur-Extras, Sprache & Datensicherung'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                hapticTap();
                onClose();
              }}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card flex items-center justify-center text-ink transition"
              aria-label={isKr ? '닫기' : 'Schließen'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section 1: Korean Cultural Extras (Ramyeon & Soju) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted tracking-wide">
              {isKr ? '한국 문화 스페셜' : 'Koreanische Kultur-Extras'}
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Ramyeon Timer Card */}
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  onClose();
                  onOpenRamyeon();
                }}
                className="w-full p-3.5 rounded-2xl hanji-card hover:bg-surface/70 transition flex items-center justify-between gap-3 text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-dancheong/10 border border-dancheong/25 flex items-center justify-center shrink-0">
                    <RamyeonPacketIcon className="w-7 h-7" idPrefix="drawer-ramyeon" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-ink flex items-center gap-2">
                      <span>{isKr ? '신라면 타이머' : 'Ramyeon-Timer'}</span>
                      {isRamyeonRunning && (
                        <span className="text-xs font-mono tabular-nums font-bold text-dancheong">
                          {formatTime(ramyeonTimeLeft)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted truncate">
                      {isKr
                        ? '완벽한 면발을 위한 4분 알람'
                        : '4-Minuten-Timer für koreanische Nudeln'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-ink group-hover:translate-x-0.5 transition shrink-0" />
              </button>

              {/* Soju Roulette Card */}
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  onClose();
                  onOpenSoju();
                }}
                className="w-full p-3.5 rounded-2xl hanji-card hover:bg-surface/70 transition flex items-center justify-between gap-3 text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-celadon/12 border border-celadon/25 flex items-center justify-center shrink-0">
                    <SojuBottleIcon className="w-7 h-7" idPrefix="drawer-soju" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-ink">
                      {isKr ? '소주 룰렛 (랜덤 학습)' : 'Soju-Roulette'}
                    </div>
                    <p className="text-xs text-muted truncate">
                      {isKr
                        ? '모드와 카테고리를 무작위로 추첨'
                        : 'Zufallsgenerator für Modus & Thema'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-ink group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            </div>
          </div>

          {/* Section 2: App Language */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted tracking-wide">
              {isKr ? '언어 설정' : 'Sprache'}
            </h3>

            <div className="rounded-2xl hanji-card">
              {/* Language Row */}
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-ink">
                    {isKr ? '앱 인터페이스 언어' : 'App-Sprache'}
                  </div>
                  <p className="text-xs text-muted">
                    {isKr ? '한국어 (한글 UI)' : 'Deutsch (Standard)'}
                  </p>
                </div>
                <LanguageToggleButton
                  language={language}
                  onToggle={() => {
                    hapticTap();
                    onToggleLanguage();
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Data, Vocab & Backup */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted tracking-wide">
              {isKr ? '단어장 및 학습 데이터' : 'Vokabeln & Lernfortschritt'}
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  onClose();
                  onOpenAddVocab();
                }}
                className="w-full p-3.5 rounded-2xl hanji-card hover:bg-surface/70 transition flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-celadon/15 text-celadon flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">
                      {t.actions.addVocab}
                    </div>
                    <p className="text-xs text-muted">
                      {isKr
                        ? `단어 직접 추가, CSV 가져오기 & Firebase 클라우드 (${customCount}개)`
                        : `Vokabeln, CSV & Firebase Cloud-Datenbank (${customCount} eigene)`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  onClose();
                  onOpenReset();
                }}
                className="w-full p-3.5 rounded-2xl hanji-card hover:bg-dancheong/10 transition flex items-center justify-between gap-3 text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-dancheong/12 text-dancheong flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-dancheong">
                      {t.actions.resetProgress}
                    </div>
                    <p className="text-xs text-muted">
                      {isKr
                        ? '모든 SRS 복습 기록 초기화'
                        : 'Alle SRS-Wiederholungsstufen zurücksetzen'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-dancheong/60 group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Account & Logout */}
        <div className="pt-5 mt-6 border-t border-border-card space-y-3">
          {auth.currentUser?.email && (
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="min-w-0">
                <div className="text-[11px] text-muted">
                  {isKr ? '로그인 계정' : 'Angemeldet als'}
                </div>
                <div className="text-xs font-semibold text-ink truncate">
                  {auth.currentUser.email}
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  hapticTap();
                  onClose();
                  await signOutUser();
                }}
                className="px-3 py-1.5 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-xs font-semibold text-ink transition flex items-center gap-1.5 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-muted" />
                <span>{isKr ? '로그아웃' : 'Abmelden'}</span>
              </button>
            </div>
          )}
          <div className="text-center text-[11px] text-muted">
            한국GO · Hanji Edition
          </div>
        </div>
      </aside>
    </div>
  );
};
