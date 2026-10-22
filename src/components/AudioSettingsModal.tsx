import React, { useState, useEffect } from 'react';
import {
  Volume2,
  X,
  Smartphone,
  Play,
  Check,
  AlertTriangle,
  Info,
  Laptop,
} from 'lucide-react';
import {
  getAudioDiagnostics,
  testKoreanSpeech,
  setAudioEnginePreference,
  getAudioEnginePreference,
  AudioEnginePreference,
  stopSpeech,
  playKoreanChime,
} from '../utils/speech';
import { AppLanguage } from '../utils/translations';
import { hapticTap } from '../utils/haptics';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: AppLanguage;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  lang = 'de',
}) => {
  const isKr = lang === 'kr';
  const [pref, setPref] = useState<AudioEnginePreference>('auto');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    engine?: string;
  } | null>(null);
  const [diag, setDiag] = useState(() => getAudioDiagnostics());

  useEffect(() => {
    if (isOpen) {
      setPref(getAudioEnginePreference());
      setDiag(getAudioDiagnostics());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPref = (newPref: AudioEnginePreference) => {
    hapticTap();
    setPref(newPref);
    setAudioEnginePreference(newPref);
    setDiag(getAudioDiagnostics());
  };

  const [isChimeTesting, setIsChimeTesting] = useState(false);

  const handleTestChime = async () => {
    hapticTap();
    setIsChimeTesting(true);
    try {
      await playKoreanChime();
    } finally {
      setTimeout(() => setIsChimeTesting(false), 350);
    }
  };

  const handleRunTest = async () => {
    hapticTap();
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testKoreanSpeech();
      setTestResult({
        tested: true,
        success: res.success,
        engine: res.engineUsed === 'webspeech' ? 'Geräte-Stimme' : 'Online-TTS',
      });
      setDiag(getAudioDiagnostics());
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
      onClick={() => {
        stopSpeech();
        onClose();
      }}
    >
      <div
        className="w-full max-w-lg hanji-card-elevated rounded-3xl p-6 sm:p-7 space-y-5 animate-pop relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent */}
        <div
          className="absolute top-0 inset-x-0 h-1.5 rounded-t-3xl"
          style={{
            background:
              'linear-gradient(90deg, #3B5978 0%, #5E856E 35%, #D49B54 65%, #C85A53 100%)',
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-obangBlue/15 text-obangBlue flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-kr text-ink">
                {isKr ? '음성 및 오디오 설정' : 'Audio & Aussprache-Hilfe'}
              </h2>
              <p className="text-xs text-muted">
                {isKr ? '한국어 발음 진단 및 재생 설정' : 'Diagnose & Problembehebung bei fehlendem Ton'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="w-8 h-8 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700/60 text-muted hover:text-ink flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Audio Test Card */}
        <div className="p-4 rounded-2xl bg-surface border border-border-card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-muted block">
                {isKr ? '현재 활성 엔진' : 'Aktuelle Audio-Quelle'}
              </span>
              <div className="text-sm font-bold text-ink mt-0.5 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-celadon animate-pulse"></span>
                <span>
                  {diag.effectiveEngine === 'webspeech'
                    ? diag.voiceName || (isKr ? '기기 음성 합성' : 'Geräte-Stimme')
                    : isKr
                      ? '온라인 스트리밍 (TTS)'
                      : 'Online-Aussprache (Google TTS Stream)'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isChimeTesting}
                onClick={handleTestChime}
                title={isKr ? '하드웨어 스피커 작동 확인' : 'Prüft, ob der Lautsprecher an ist und Töne ausgeben kann'}
                className="px-3 py-2 rounded-xl bg-card hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-ink font-semibold text-xs shadow-2xs transition flex items-center gap-1.5 active:scale-95"
              >
                <Volume2 className="w-3.5 h-3.5 text-celadon" />
                <span>{isChimeTesting ? (isKr ? '신호음...' : 'Signal...') : isKr ? '스피커 확인' : 'Gong-Check'}</span>
              </button>

              <button
                type="button"
                disabled={isTesting}
                onClick={handleRunTest}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${
                  isTesting
                    ? 'bg-obangBlue/70 text-white cursor-wait'
                    : 'bg-obangBlue hover:bg-obangBlue/90 text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isTesting ? (isKr ? '재생 중...' : 'Wird abgespielt...') : isKr ? '한국어 음성 듣기' : 'Stimme testen'}</span>
              </button>
            </div>
          </div>

          {testResult && (
            <div className="p-2.5 rounded-xl bg-celadon/15 border border-celadon/30 text-xs text-ink flex items-center gap-2">
              <Check className="w-4 h-4 text-celadon shrink-0" />
              <span>
                {isKr
                  ? `„안녕하세요!“ 음성이 ${testResult.engine}으로 전송되었습니다.`
                  : `Test-Satz „안녕하세요!“ wurde erfolgreich über ${testResult.engine} abgespielt.`}
              </span>
            </div>
          )}
        </div>

        {/* Engine Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted tracking-wide block">
            {isKr ? '재생 방식 선택' : 'Aussprache-Modus wählen'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Auto */}
            <button
              type="button"
              onClick={() => handleSelectPref('auto')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                pref === 'auto'
                  ? 'bg-obangBlue/10 border-obangBlue text-ink ring-2 ring-obangBlue/25'
                  : 'bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border-border-card text-muted'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-xs text-ink">
                  {isKr ? '자동 (권장)' : 'Automatisch'}
                </span>
                {pref === 'auto' && <Check className="w-3.5 h-3.5 text-obangBlue" />}
              </div>
              <span className="text-[11px] text-muted mt-1 leading-tight">
                {isKr ? '기기 음성 우선, 없을 시 온라인' : 'Beste Kombination aus Offline- & Online-Stimme'}
              </span>
            </button>

            {/* Online */}
            <button
              type="button"
              onClick={() => handleSelectPref('online')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                pref === 'online'
                  ? 'bg-obangBlue/10 border-obangBlue text-ink ring-2 ring-obangBlue/25'
                  : 'bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border-border-card text-muted'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-xs text-ink">
                  {isKr ? '온라인 전용' : 'Online-Audio'}
                </span>
                {pref === 'online' && <Check className="w-3.5 h-3.5 text-obangBlue" />}
              </div>
              <span className="text-[11px] text-muted mt-1 leading-tight">
                {isKr ? '항상 고음질 온라인 스트림' : 'Immer natürlicher Online-Audio-Stream'}
              </span>
            </button>

            {/* Device */}
            <button
              type="button"
              onClick={() => handleSelectPref('device')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                pref === 'device'
                  ? 'bg-obangBlue/10 border-obangBlue text-ink ring-2 ring-obangBlue/25'
                  : 'bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border-border-card text-muted'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-xs text-ink">
                  {isKr ? '기기 음성' : 'Geräte-Stimme'}
                </span>
                {pref === 'device' && <Check className="w-3.5 h-3.5 text-obangBlue" />}
              </div>
              <span className="text-[11px] text-muted mt-1 leading-tight">
                {isKr ? '오프라인 Web Speech API' : 'Web Speech API (ohne Internet)'}
              </span>
            </button>
          </div>
        </div>

        {/* iPhone & iPad Troubleshooting Box (Crucial for iOS silent switch!) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-ink space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm">
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>{isKr ? 'iPhone / iPad에서 소리가 안 날 때' : 'Wichtig für iPhone & iPad (Kein Ton?)'}</span>
          </div>
          <div className="text-xs text-ink/90 space-y-1.5 leading-relaxed pl-6">
            <p>
              <strong>1. Physischer Stummschalter:</strong> An der linken Geräteseite des iPhones befindet sich der Kippschalter. Wenn der <strong>orangefarbene Streifen</strong> sichtbar ist (oder der Action Button auf Stumm steht), <strong>blockiert Apple alle Web-Stimmen im Browser</strong> vollständig. Schalte den Stummschalter auf laut!
            </p>
            <p>
              <strong>2. Medienlautstärke:</strong> Bitte drücke die Lauter-Taste an deinem iPhone, während die App geöffnet ist.
            </p>
            <p>
              <strong>3. Bluetooth:</strong> Prüfe im iOS-Kontrollzentrum, ob der Ton eventuell an verbundene Kopfhörer im Nebenzimmer gesendet wird.
            </p>
          </div>
        </div>

        {/* Windows / Mac Troubleshooting Box */}
        <div className="p-3.5 rounded-2xl bg-surface border border-border-card text-xs text-muted space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <Laptop className="w-3.5 h-3.5 text-obangBlue" />
            <span>{isKr ? 'PC / Mac 진단' : 'PC / Mac / Android Hinweis'}</span>
          </div>
          <p className="leading-relaxed">
            {isKr
              ? 'Windows에 한국어 음성 팩이 설치되지 않은 경우, 상단의 [온라인 전용] 모드를 선택하면 고음질 한국어 발음을 들을 수 있습니다.'
              : 'Wenn auf deinem Windows-PC kein koreanisches Sprachpaket installiert ist, wähle oben einfach „Online-Audio“, um stets natürliche Aussprache zu hören.'}
          </p>
          {diag.allKoreanVoices.length > 0 && (
            <div className="pt-1 text-[11px] text-ink/80">
              <span className="font-semibold">{isKr ? '설치된 한국어 음성:' : 'Gefundene Stimmen:'}</span>{' '}
              {diag.allKoreanVoices.join(', ')}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-xs font-bold text-ink transition"
          >
            {isKr ? '닫기' : 'Verstanden & Schließen'}
          </button>
        </div>
      </div>
    </div>
  );
};
