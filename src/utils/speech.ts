/**
 * Korean Speech Audio System
 * Resilient multi-engine TTS architecture:
 * 1. Native Web Speech API (offline, zero-latency, works on GitHub Pages & mobile)
 * 2. High-fidelity Online Neural TTS stream (via dev server /api/tts or direct online fallback)
 * 3. iOS audio context unlocker & silent switch detection advice
 * 4. Diagnostics & engine preference switching ('auto' | 'online' | 'device')
 */

export type AudioEnginePreference = 'auto' | 'online' | 'device';

const PREF_STORAGE_KEY = 'hanguk_audio_engine_pref';

// Cached state
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;
let isAudioUnlocked = false;
let currentAudio: HTMLAudioElement | null = null;
let proxyAvailable: boolean | null = null;

// Reusable unlocked audio element for iOS Safari
let primedAudio: HTMLAudioElement | null = null;

/**
 * Check if the current client is iOS / iPadOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Get stored engine preference
 */
export function getAudioEnginePreference(): AudioEnginePreference {
  if (typeof window === 'undefined') return 'auto';
  try {
    const saved = localStorage.getItem(PREF_STORAGE_KEY);
    if (saved === 'online' || saved === 'device' || saved === 'auto') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'auto';
}

/**
 * Set and store engine preference
 */
export function setAudioEnginePreference(pref: AudioEnginePreference): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREF_STORAGE_KEY, pref);
  } catch {
    // ignore
  }
}

/**
 * Load and cache available speech synthesis voices
 */
function refreshVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  try {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      cachedVoices = voices;
      voicesLoaded = true;
    }
    return cachedVoices;
  } catch {
    return [];
  }
}

// Initialize voices listener early
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      refreshVoices();
    };
  }
}

/**
 * Find the best Korean voice available on this device
 */
export function findKoreanVoice(): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length > 0 ? cachedVoices : refreshVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Exact match for ko-KR or ko_KR
  const exact = voices.find(
    (v) => v.lang === 'ko-KR' || v.lang === 'ko_KR' || v.lang.toLowerCase() === 'ko-kr'
  );
  if (exact) return exact;

  // 2. Starts with ko
  const startsWithKo = voices.find((v) => v.lang.toLowerCase().startsWith('ko'));
  if (startsWithKo) return startsWithKo;

  // 3. Name contains Korean or Korean hangul
  const nameMatch = voices.find(
    (v) =>
      /korean/i.test(v.name) ||
      /한국/i.test(v.name) ||
      /yuna/i.test(v.name) ||
      /sora/i.test(v.name) ||
      /seoyeon/i.test(v.name)
  );
  if (nameMatch) return nameMatch;

  return null;
}

/**
 * Get diagnostic info about the speech environment
 */
export function getAudioDiagnostics(): {
  hasWebSpeech: boolean;
  hasNativeVoice: boolean;
  voiceName: string | null;
  allKoreanVoices: string[];
  isIosDevice: boolean;
  activePreference: AudioEnginePreference;
  effectiveEngine: 'webspeech' | 'online';
} {
  const hasWebSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const koVoice = findKoreanVoice();
  const allKo = cachedVoices
    .filter((v) => v.lang.toLowerCase().startsWith('ko') || /korean|한국/i.test(v.name))
    .map((v) => `${v.name} (${v.lang})`);

  const pref = getAudioEnginePreference();
  let effectiveEngine: 'webspeech' | 'online' = 'online';

  if (pref === 'device') {
    effectiveEngine = 'webspeech';
  } else if (pref === 'online') {
    effectiveEngine = 'online';
  } else {
    // 'auto': use webspeech if a real Korean voice is found, else fallback to online audio
    effectiveEngine = koVoice ? 'webspeech' : 'online';
  }

  return {
    hasWebSpeech,
    hasNativeVoice: !!koVoice,
    voiceName: koVoice ? `${koVoice.name} (${koVoice.lang})` : null,
    allKoreanVoices: allKo,
    isIosDevice: isIOS(),
    activePreference: pref,
    effectiveEngine,
  };
}

/**
 * Unlock iOS audio permissions on user touch/gesture
 */
export function unlockAudio(): void {
  if (isAudioUnlocked || typeof window === 'undefined') return;

  try {
    // 1. Unlock Web Audio Context if available
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      // Play a short silent buffer
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }

    // 2. Prime a silent HTML5 Audio element for iOS Safari
    if (!primedAudio) {
      primedAudio = new Audio();
      // 0.05s silent WAV base64
      primedAudio.src =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      primedAudio.volume = 0.01;
      primedAudio.play().catch(() => {});
    }

    // 3. Resume SpeechSynthesis
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      refreshVoices();
    }

    isAudioUnlocked = true;
  } catch {
    // ignore
  }
}

// Attach auto-unlock to first user touch/click
if (typeof window !== 'undefined') {
  const handleFirstInteraction = () => {
    unlockAudio();
    window.removeEventListener('touchstart', handleFirstInteraction);
    window.removeEventListener('pointerdown', handleFirstInteraction);
    window.removeEventListener('keydown', handleFirstInteraction);
  };
  window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
  window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
  window.addEventListener('keydown', handleFirstInteraction, { passive: true });
}

/**
 * Clean text for Korean TTS
 */
function sanitizeKoreanText(text: string): string {
  return text
    .replace(/\(.*?\)/g, '') // remove parenthesized glosses
    .replace(/\[.*?\]/g, '')
    .replace(/\//g, ', ')
    .replace(/^-(?=[가-힣])/, '') // remove leading dash from grammatical particles
    .replace(/~(?=[가-힣])/, '')
    .trim();
}

/**
 * Stop any current speech or audio immediately
 */
export function stopSpeech(): void {
  if (typeof window === 'undefined') return;

  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudio = null;
  }

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * Speak Korean using the device's native Web Speech API
 */
function speakViaWebSpeech(cleaned: string, rate: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve(false);
      return;
    }

    try {
      // Clear any stuck queue (crucial for Chrome and Safari!)
      window.speechSynthesis.cancel();

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = 'ko-KR';
      utterance.rate = Math.max(0.6, Math.min(1.4, rate));
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const koVoice = findKoreanVoice();
      if (koVoice) {
        utterance.voice = koVoice;
      }

      let hasFinished = false;

      utterance.onstart = () => {
        // Speech started successfully
      };

      utterance.onend = () => {
        if (!hasFinished) {
          hasFinished = true;
          resolve(true);
        }
      };

      utterance.onerror = (e) => {
        console.warn('Web Speech API error:', e.error);
        if (!hasFinished) {
          hasFinished = true;
          // If language was unavailable or not-allowed, signal failure so fallback can run
          resolve(false);
        }
      };

      // Safety timeout in case onend never fires (rare browser bug)
      setTimeout(() => {
        if (!hasFinished) {
          hasFinished = true;
          resolve(true);
        }
      }, 7000);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('speakViaWebSpeech exception:', err);
      resolve(false);
    }
  });
}

/**
 * Check if the backend /api/tts proxy is accessible
 */
async function checkProxy(): Promise<boolean> {
  if (proxyAvailable !== null) return proxyAvailable;
  if (typeof window === 'undefined') return false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch('/api/tts?text=%ED%95%9C', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timer);
    proxyAvailable = res.ok;
  } catch {
    proxyAvailable = false;
  }
  return proxyAvailable;
}

/**
 * Speak Korean using HTML5 Audio streaming
 */
async function speakViaAudioStream(cleaned: string, rate: number): Promise<boolean> {
  return new Promise(async (resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const isSlow = rate <= 0.8;
    const targetPlaybackRate = isSlow ? 0.75 : 1.0;

    // Check if proxy works (Vite dev server)
    const hasProxy = await checkProxy();

    const proxyUrl = `/api/tts?text=${encodeURIComponent(cleaned)}${isSlow ? '&slow=true' : ''}`;
    const directFallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&ttsspeed=${
      isSlow ? '0.24' : '1'
    }&q=${encodeURIComponent(cleaned)}`;

    const chosenUrl = hasProxy ? proxyUrl : directFallbackUrl;

    const audio = primedAudio || new Audio();
    primedAudio = null; // consume primed instance
    currentAudio = audio;
    audio.defaultPlaybackRate = targetPlaybackRate;

    let resolved = false;
    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
    };

    const finish = (ok: boolean) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(ok);
      }
    };

    audio.onended = () => finish(true);

    audio.onerror = () => {
      // If proxy failed, try direct URL once
      if (audio.src.includes('/api/tts')) {
        proxyAvailable = false;
        audio.src = directFallbackUrl;
        audio.playbackRate = targetPlaybackRate;
        audio.play().catch(() => finish(false));
      } else {
        finish(false);
      }
    };

    // Load and play
    try {
      audio.src = chosenUrl;
      audio.playbackRate = targetPlaybackRate;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audio.playbackRate = targetPlaybackRate;
          })
          .catch((err) => {
            console.warn('Audio play rejection:', err);
            // If proxy failed, try direct URL
            if (chosenUrl === proxyUrl) {
              proxyAvailable = false;
              audio.src = directFallbackUrl;
              audio.playbackRate = targetPlaybackRate;
              audio.play().catch(() => finish(false));
            } else {
              finish(false);
            }
          });
      }
    } catch {
      finish(false);
    }

    // Safety timeout
    setTimeout(() => {
      finish(true);
    }, 8000);
  });
}

/**
 * Main public speak function.
 * Intelligently coordinates Web Speech API and Audio Streaming based on device capabilities.
 */
export async function speakKorean(text: string, rate: number = 0.9): Promise<void> {
  const cleaned = sanitizeKoreanText(text);
  if (!cleaned) return;

  // Make sure previous speech is stopped cleanly
  stopSpeech();

  const pref = getAudioEnginePreference();
  const koVoice = findKoreanVoice();

  // Route based on preference & device capability:
  if (pref === 'device') {
    const success = await speakViaWebSpeech(cleaned, rate);
    if (!success) {
      await speakViaAudioStream(cleaned, rate);
    }
    return;
  }

  if (pref === 'online') {
    const success = await speakViaAudioStream(cleaned, rate);
    if (!success) {
      await speakViaWebSpeech(cleaned, rate);
    }
    return;
  }

  // 'auto' mode:
  // If device has a high-quality native Korean voice (like Apple iOS/macOS Yuna or Android Google TTS),
  // use Web Speech first for instant, offline, zero-latency playback.
  if (koVoice) {
    const ok = await speakViaWebSpeech(cleaned, rate);
    if (!ok) {
      await speakViaAudioStream(cleaned, rate);
    }
  } else {
    // If no native voice installed on device (e.g. Windows without Korean speech pack),
    // use high-fidelity neural audio stream first.
    const ok = await speakViaAudioStream(cleaned, rate);
    if (!ok) {
      await speakViaWebSpeech(cleaned, rate);
    }
  }
}

/**
 * Test Korean speech output with a friendly greeting
 */
export async function testKoreanSpeech(): Promise<{
  success: boolean;
  engineUsed: 'webspeech' | 'online';
  voiceName?: string;
  isIos: boolean;
}> {
  const diag = getAudioDiagnostics();
  unlockAudio();

  let engineUsed: 'webspeech' | 'online' = diag.effectiveEngine;
  let success = false;

  if (diag.effectiveEngine === 'webspeech') {
    success = await speakViaWebSpeech('안녕하세요! 한국어 공부 화이팅!', 0.95);
    if (!success) {
      success = await speakViaAudioStream('안녕하세요! 한국어 공부 화이팅!', 0.95);
      if (success) engineUsed = 'online';
    }
  } else {
    success = await speakViaAudioStream('안녕하세요! 한국어 공부 화이팅!', 0.95);
    if (!success && diag.hasWebSpeech) {
      success = await speakViaWebSpeech('안녕하세요! 한국어 공부 화이팅!', 0.95);
      if (success) engineUsed = 'webspeech';
    }
  }

  return {
    success,
    engineUsed,
    voiceName: diag.voiceName || undefined,
    isIos: diag.isIosDevice,
  };
}
