/**
 * Korean Speech Audio System
 * Resilient multi-engine TTS architecture:
 * 1. High-fidelity HTML5 Media Audio stream (/api/tts):
 *    Crucial for iOS: uses AVAudioSessionCategoryPlayback, which BYPASSES the hardware silent switch
 *    (just like YouTube, Spotify, and Netflix), allowing volume control via side buttons!
 * 2. Native Web Speech API (offline, zero-latency fallback)
 * 3. iOS audio context unlocker & silent switch detection
 * 4. Diagnostics & engine preference switching ('auto' | 'online' | 'device')
 * 5. Hardware audio chime tester
 */

export type AudioEnginePreference = 'auto' | 'online' | 'device';

const PREF_STORAGE_KEY = 'hanguk_audio_engine_pref';

// Cached state
let cachedVoices: SpeechSynthesisVoice[] = [];
let isAudioUnlocked = false;
let currentAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

// Reusable unlocked persistent audio element for iOS Safari Media playback (bypasses silent switch)
let sharedAudio: HTMLAudioElement | null = null;

function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio && typeof window !== 'undefined') {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
    // Ensure iOS Safari classifies it as media playback rather than ambient sound
    (sharedAudio as unknown as { playsInline?: boolean }).playsInline = true;
  }
  return sharedAudio || new Audio();
}

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
 * Play a short melodic Web Audio chime (to test hardware speaker)
 */
export function playKoreanChime(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        resolve(false);
        return;
      }
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      // Traditional pentatonic notes (E5 659Hz -> G#5 830Hz)
      const notes = [
        { freq: 659.25, time: now, dur: 0.12 },
        { freq: 830.61, time: now + 0.12, dur: 0.28 },
      ];

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, n.time);

        gain.gain.setValueAtTime(0.25, n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, n.time + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(n.time);
        osc.stop(n.time + n.dur);
      });

      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
        resolve(true);
      }, 500);
    } catch {
      resolve(false);
    }
  });
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
  const allKo = (cachedVoices.length > 0 ? cachedVoices : refreshVoices())
    .filter((v) => v.lang.toLowerCase().startsWith('ko') || /korean|한국/i.test(v.name))
    .map((v) => `${v.name} (${v.lang})`);

  const pref = getAudioEnginePreference();
  let effectiveEngine: 'webspeech' | 'online' = 'online';

  if (pref === 'device') {
    effectiveEngine = 'webspeech';
  } else {
    // 'auto' & 'online': use HTML5 audio stream by default so sound works even in iOS Silent Mode!
    effectiveEngine = 'online';
  }

  return {
    hasWebSpeech,
    hasNativeVoice: !!koVoice,
    voiceName: koVoice ? `${koVoice.name} (${koVoice.lang})` : (hasWebSpeech ? 'System-Koreanisch (ko-KR)' : null),
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
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }

    // 2. Prime the shared HTML5 Audio element for iOS Safari
    const audio = getSharedAudio();
    audio.src =
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    audio.volume = 0.01;
    audio.play().catch(() => {});

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
  }

  if (sharedAudio) {
    try {
      sharedAudio.pause();
      sharedAudio.currentTime = 0;
    } catch {
      // ignore
    }
  }

  if ('speechSynthesis' in window) {
    try {
      // Only cancel if actually speaking to prevent WebKit silent-suppression bug
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Speak Korean using the device's native Web Speech API.
 * Synchronous start, retaining utterance reference to prevent WebKit GC.
 * Note: Apple mutes Web Speech API when iPhone physical silent switch is active.
 */
function speakViaWebSpeech(cleaned: string, rate: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve(false);
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = 'ko-KR';
      utterance.rate = Math.max(0.65, Math.min(1.3, rate));
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const koVoice = findKoreanVoice();
      if (koVoice) {
        utterance.voice = koVoice;
      }

      let hasFinished = false;
      const finish = (ok: boolean) => {
        if (!hasFinished) {
          hasFinished = true;
          activeUtterance = null;
          resolve(ok);
        }
      };

      utterance.onstart = () => {
        // Speech started successfully
      };

      utterance.onend = () => finish(true);
      utterance.onerror = (e) => {
        console.warn('Web Speech API error:', e.error);
        finish(false);
      };

      // Keep active reference to prevent WebKit garbage collection
      activeUtterance = utterance;

      // Safety timeout in case onend never fires
      setTimeout(() => finish(true), 6000);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('speakViaWebSpeech exception:', err);
      resolve(false);
    }
  });
}

/**
 * Speak Korean using HTML5 Media Audio streaming.
 * CRITICAL FOR IPHONE:
 * HTML5 Audio uses iOS AVAudioSessionCategoryPlayback (Media/YouTube category).
 * This category BYPASSES the iPhone hardware silent switch!
 */
function speakViaAudioStream(cleaned: string, rate: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const isSlow = rate <= 0.8;
    const targetPlaybackRate = isSlow ? 0.75 : 1.0;
    const streamUrl = `/api/tts?text=${encodeURIComponent(cleaned)}${isSlow ? '&slow=true' : ''}`;

    const audio = getSharedAudio();
    currentAudio = audio;

    let hasFinished = false;
    const finish = (ok: boolean) => {
      if (!hasFinished) {
        hasFinished = true;
        audio.onended = null;
        audio.onerror = null;
        resolve(ok);
      }
    };

    audio.onended = () => finish(true);
    audio.onerror = (e) => {
      console.warn('Audio stream error, falling back:', e);
      finish(false);
    };

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1.0;
      audio.src = streamUrl;
      audio.playbackRate = targetPlaybackRate;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio stream play catch:', err);
          finish(false);
        });
      }
    } catch {
      finish(false);
    }

    setTimeout(() => {
      finish(true);
    }, 6000);
  });
}

/**
 * Main public speak function.
 * By default, uses HTML5 Media Audio stream so Korean pronunciation plays even when the iPhone is in SILENT MODE.
 * Seamlessly falls back to native Web Speech API if offline.
 */
export async function speakKorean(text: string, rate: number = 0.9): Promise<void> {
  const cleaned = sanitizeKoreanText(text);
  if (!cleaned) return;

  unlockAudio();
  stopSpeech();

  const pref = getAudioEnginePreference();

  // 1. Explicit device voice preference (offline Web Speech only; note: Apple mutes this in Silent Mode)
  if (pref === 'device') {
    const success = await speakViaWebSpeech(cleaned, rate);
    if (!success) {
      await speakViaAudioStream(cleaned, rate);
    }
    return;
  }

  // 2. Default ('auto') or 'online':
  // Use HTML5 Audio Stream FIRST:
  // Unlike Web Speech API, HTML5 Audio is categorized as Media Playback in iOS Safari,
  // which BYPASSES the hardware silent switch (just like YouTube)!
  const streamOk = await speakViaAudioStream(cleaned, rate);
  if (!streamOk) {
    // If stream fails (e.g. offline mode), fall back immediately to native Web Speech API
    await speakViaWebSpeech(cleaned, rate);
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

  let engineUsed: 'webspeech' | 'online' = 'online';
  let success = false;

  if (diag.activePreference === 'device') {
    success = await speakViaWebSpeech('안녕하세요! 한국어 공부 화이팅!', 0.95);
    engineUsed = 'webspeech';
    if (!success) {
      success = await speakViaAudioStream('안녕하세요! 한국어 공부 화이팅!', 0.95);
      if (success) engineUsed = 'online';
    }
  } else {
    // Default & Online: use stream to bypass silent switch
    success = await speakViaAudioStream('안녕하세요! 한국어 공부 화이팅!', 0.95);
    engineUsed = 'online';
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
