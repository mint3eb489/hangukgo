import React, { useEffect } from 'react';
import { X, Plus, RotateCcw, ChevronRight, LogOut } from 'lucide-react';
import { AppLanguage, translations } from '../utils/translations';
import { RamyeonPacketIcon } from './RamyeonPacketIcon';
import { SojuBottleIcon } from './SojuBottleIcon';
import { RetroTvIcon } from './RetroTvIcon';
import { BunnyEarsIcon } from './BunnyEarsIcon';
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
  onOpenDrama: () => void;
  onOpenBunny: () => void;
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
  onOpenDrama,
  onOpenBunny,
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
        className="w-full max-w-sm bg-hanji border-l border-border-card h-full shadow-2xl flex flex-col justify-between overflow-y-auto overscroll-contain safe-drawer-panel animate-slide-left"
        onClick={(e) => e.stopPropagation()}
        aria-label={isKr ? '설정 및 문화 도구' : 'Extras & Einstellungen'}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border-card">
            <div className="flex items-center gap-3">
              <DancheongSettingsIcon className="w-8 h-8 shrink-0" />
              <h2 className="text-lg font-bold text-ink tracking-tight">
                {isKr ? '도구 및 설정' : 'Extras & Einstellungen'}
              </h2>
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

          {/* Section 1: Korean Cultural Extras (Ramyeon, Soju, Drama & Bunny) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted tracking-wide">
              {isKr ? '한국 문화 스페셜' : 'Koreanische Kultur-Extras'}
            </h3>

            <div className="grid grid-cols-4 gap-2">
              {/* 1. Ramyeon */}
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  onClose();
                  onOpenRamyeon();
                }}
                className="p-2.5 rounded-2xl hanji-card hover:bg-surface/70 transition flex flex-col items-center justify-center gap-1.5 text-center group relative"
              >
                <div className="w-10 h-10 rounded-xl bg-dancheong/10 border border-dancheong/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <RamyeonPacketIcon className="w-6 h-6" idPrefix="drawer-ramyeon" />
                </div>
                <span className="font-bold text-xs text-ink truncate w-full">
                  {isKr ? '라면' : 'Ramyeon'}
                </span>
                {isRamyeonRunning && (
                  <span className="text-[10px] font-mono tabular-nums font-bold text-dancheong leading-none">
                    {formatTime(ramyeonTimeLeft)}
                  </span>
                )}
              </button>

              {/* 2. Soju */}
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  onClose();
                  onOpenSoju();
                }}
                className="p-2.5 rounded-2xl hanji-card hover:bg-surface/70 transition flex flex-col items-center justify-center gap-1.5 text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-celadon/12 border border-celadon/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <SojuBottleIcon className="w-6 h-6" idPrefix="drawer-soju" />
                </div>
                <span className="font-bold text-xs text-ink truncate w-full">
                  {isKr ? '소주' : 'Soju'}
                </span>
              </button>

              {/* 3. Drama */}
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  onClose();
                  onOpenDrama();
                }}
                className="p-2.5 rounded-2xl hanji-card hover:bg-surface/70 transition flex flex-col items-center justify-center gap-1.5 text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-obangBlue/12 border border-obangBlue/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <RetroTvIcon className="w-6 h-6" idPrefix="drawer-drama" />
                </div>
                <span className="font-bold text-xs text-ink truncate w-full">
                  {isKr ? '드라마' : 'Drama'}
                </span>
              </button>

              {/* 4. Bunny / 토끼 */}
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  onClose();
                  onOpenBunny();
                }}
                className="p-2.5 rounded-2xl hanji-card hover:bg-surface/70 transition flex flex-col items-center justify-center gap-1.5 text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-ochre/12 border border-ochre/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BunnyEarsIcon className="w-6 h-6" idPrefix="drawer-bunny" />
                </div>
                <span className="font-bold text-xs text-ink truncate w-full">
                  {isKr ? '토끼' : 'Bunny'}
                </span>
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
                <div className="text-sm font-semibold text-ink">
                  {isKr ? '앱 인터페이스 언어' : 'App-Sprache'}
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
                  <div className="text-sm font-semibold text-ink">
                    {t.actions.addVocab}
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
                  <div className="text-sm font-semibold text-dancheong">
                    {t.actions.resetProgress}
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
