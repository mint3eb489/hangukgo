import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { HangukGoWordmark } from './HangukGoWordmark';
import { TaegeukThemeToggle } from './TaegeukThemeToggle';
import { LanguageToggleButton } from './LanguageToggleButton';
import { GatHatIcon } from './GatHatIcon';
import { signInWithEmail } from '../services/firebase';
import { AppLanguage } from '../utils/translations';
import { hapticTap } from '../utils/haptics';

interface LoginScreenProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: AppLanguage;
  onToggleLanguage: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
}) => {
  const isKr = language === 'kr';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(
        isKr
          ? '이메일과 비밀번호를 모두 입력해주세요.'
          : 'Bitte gib deine E-Mail-Adresse und dein Passwort ein.'
      );
      return;
    }

    hapticTap();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmail(email, password);
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      const code = errorObj?.code || '';

      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setError(
          isKr
            ? '이메일 또는 비밀번호가 일치하지 않습니다.'
            : 'E-Mail-Adresse oder Passwort ist nicht korrekt.'
        );
      } else if (code === 'auth/invalid-email') {
        setError(
          isKr
            ? '올바른 이메일 형식을 입력해주세요.'
            : 'Bitte gib eine gültige E-Mail-Adresse ein.'
        );
      } else if (code === 'auth/too-many-requests') {
        setError(
          isKr
            ? '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'
            : 'Zu viele Anmeldeversuche. Bitte warte einen kurzen Moment.'
        );
      } else if (code === 'auth/operation-not-allowed') {
        setError(
          isKr
            ? 'Firebase 콘솔에서 이메일/비밀번호 로그인이 비활성화되어 있습니다.'
            : 'E-Mail/Passwort-Anmeldung ist in der Firebase Console noch nicht aktiviert.'
        );
      } else {
        setError(
          isKr
            ? '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'
            : 'Anmeldung fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hanji text-ink transition-colors duration-200 flex flex-col justify-between px-4 md:px-8 select-none relative overflow-hidden font-sans pt-[max(2.35rem,calc(env(safe-area-inset-top,0px)+0.15rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))]">
      {/* iPhone Status Bar Shield */}
      <div className="mobile-status-shield md:hidden" aria-hidden="true" />

      {/* Top Bar: Theme & Language Controls */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-end gap-2 z-10">
        <LanguageToggleButton
          language={language}
          onToggle={() => {
            hapticTap();
            onToggleLanguage();
          }}
        />

        <TaegeukThemeToggle
          theme={theme}
          lang={language}
          onToggle={() => {
            hapticTap();
            onToggleTheme();
          }}
        />
      </header>

      {/* Center Login Card */}
      <main className="flex-1 flex items-center justify-center py-6 z-10">
        <div className="w-full max-w-md hanji-card-elevated rounded-3xl p-7 sm:p-9 space-y-6 animate-pop relative overflow-hidden">
          {/* Top Traditional Dancheong Accent Line */}
          <div
            className="absolute top-0 inset-x-0 h-1.5"
            style={{
              background:
                'linear-gradient(90deg, #3B5978 0%, #5E856E 35%, #D49B54 65%, #C85A53 100%)',
            }}
          />

          {/* Brand Emblem & Calligraphic Wordmark */}
          <div className="text-center space-y-3 pt-1">
            <div className="inline-flex items-center justify-center relative">
              <AppLogo className="w-14 h-14 shadow-md" />
              <div
                className="absolute -bottom-1.5 -right-2 w-7 h-7 rounded-lg bg-ink text-hanji border border-border-card flex items-center justify-center shadow-xs"
                title="Joseon Seonbi (선비)"
              >
                <GatHatIcon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex justify-center pt-1">
              <div className="scale-110 transform origin-center">
                <HangukGoWordmark />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted font-medium">
              {isKr
                ? 'TOPIK I & II 한국어 단어 · 청해 트레이너'
                : 'Interaktiver TOPIK I & II Vokabel- und Hörtrainer'}
            </p>
          </div>

          {/* Traditional Joseon Divider */}
          <div className="flex items-center gap-3 text-border-card">
            <div className="h-px flex-1 bg-border-card" />
            <span className="text-[10px] text-ochre select-none">◆</span>
            <div className="h-px flex-1 bg-border-card" />
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="hangukgo-email"
                className="block text-xs font-semibold text-ink tracking-wide"
              >
                {isKr ? '이메일 주소' : 'E-Mail-Adresse'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="hangukgo-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={isKr ? 'name@example.com' : 'name@beispiel.de'}
                  required
                  className="w-full min-h-[44px] bg-surface border border-border-card rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-celadon focus:bg-card transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="hangukgo-password"
                className="block text-xs font-semibold text-ink tracking-wide"
              >
                {isKr ? '비밀번호' : 'Passwort'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="hangukgo-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  required
                  className="w-full min-h-[44px] bg-surface border border-border-card rounded-xl pl-10 pr-11 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-celadon focus:bg-card transition"
                />
                <button
                  type="button"
                  onClick={() => {
                    hapticTap();
                    setShowPassword((prev) => !prev);
                  }}
                  aria-label={
                    showPassword
                      ? isKr
                        ? '비밀번호 숨기기'
                        : 'Passwort verbergen'
                      : isKr
                      ? '비밀번호 표시'
                      : 'Passwort anzeigen'
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-dancheong/10 border border-dancheong/30 text-dancheong text-xs font-medium flex items-start gap-2 leading-relaxed animate-pop">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[46px] py-3 px-5 rounded-xl bg-celadon hover:bg-celadon/90 active:scale-[0.99] text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {loading
                    ? isKr
                      ? '로그인 중...'
                      : 'Anmeldung läuft...'
                    : isKr
                    ? '한국GO 시작하기'
                    : 'Anmelden'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="text-center text-xs text-muted py-2">
        <span>한국GO</span>
        <span className="mx-1.5" aria-hidden="true">·</span>
        <span>{isKr ? '일월오봉도 & 단청 에디션' : 'Joseon Hanji Edition'}</span>
      </footer>
    </div>
  );
};
