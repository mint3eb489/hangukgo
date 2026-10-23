/**
 * Korean Speech Audio System
 * Engineered specifically for iPhone / iOS Safari Silent Mode (Stummmodus) compatibility:
 *
 * Why the Gong (`playKoreanChime`) works in iPhone Silent Mode:
 * - Once iOS WebKit's audio session is unlocked in Media Playback mode (`navigator.audioSession.type = 'playback'`
 *   + a dedicated silent WAV `<audio>` element), Web Audio API (`AudioContext` -> `ctx.destination`)
 *   routes directly through `AVAudioSessionCategoryPlayback` (bypassing the hardware Silent Switch).
 *
 * Our 3-Stage Architecture:
 * 1. Primary (`speakViaWebAudio`): Fetches the Korean TTS MP3, decodes it via `AudioContext.decodeAudioData()`,
 *    and plays it through `AudioContext.destination` — the EXACT SAME hardware audio path as the Gong!
 * 2. Secondary (`speakViaHtml5AudioElement`): Plays via a dedicated `<audio>` element (trying `/api/tts`,
 *    `dict.youdao.com`, and `translate.googleapis.com` with `no-referrer`) without the iOS `currentTime = 0`
 *    `InvalidStateError` bug and without touching the silent unlocker `<audio>` element.
 * 3. Tertiary (`speakViaWebSpeech`): Offline fallback using `window.speechSynthesis`.
 */

export type AudioEnginePreference = 'auto' | 'online' | 'device';

const PREF_STORAGE_KEY = 'hanguk_audio_engine_pref';

// Cached state
let cachedVoices: SpeechSynthesisVoice[] = [];
let isAudioUnlocked = false;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeBufferSource: AudioBufferSourceNode | null = null;

// Shared persistent AudioContext (used by BOTH the Gong and Korean TTS voice playback!)
let sharedAudioCtx: AudioContext | null = null;

// In-memory cache of decoded AudioBuffers for instant zero-latency replay
const decodedAudioBufferCache = new Map<string, AudioBuffer>();

// 1. Dedicated `<audio>` element ONLY for keeping iOS in AVAudioSessionCategoryPlayback (Silent Mode bypass).
// CRITICAL: Never reuse this element for external URLs and never overwrite its `.src`!
let silentUnlockerAudio: HTMLAudioElement | null = null;
let silentWavDataUri: string | null = null;

// 2. Separate `<audio>` element for HTML5 Media Stream fallback (e.g., on static hosts without /api/tts)
let mediaStreamAudio: HTMLAudioElement | null = null;

/**
 * Generate a valid 0.25-second 8kHz mono 16-bit PCM silent WAV data URI.
 * Unlike a 1-sample WAV stub, a 0.25s WAV reliably forces iOS Safari's media daemon
 * to switch the page into `AVAudioSessionCategoryPlayback` (ignoring the hardware silent switch).
 */
function getSilentWavDataUri(): string {
  if (silentWavDataUri) return silentWavDataUri;

  const sampleRate = 8000;
  const numSamples = 2000; // 0.25 seconds
  const byteRate = sampleRate * 2;
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // 1 channel (mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
  // Samples are already 0 (silence)

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  silentWavDataUri = `data:audio/wav;base64,${btoa(binary)}`;
  return silentWavDataUri;
}

/**
 * Get or create the shared persistent AudioContext
 */
function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  return sharedAudioCtx;
}

/**
 * Get or create the dedicated HTML5 media stream fallback element
 */
function getMediaStreamAudio(): HTMLAudioElement {
  if (!mediaStreamAudio && typeof window !== 'undefined') {
    mediaStreamAudio = new Audio();
    mediaStreamAudio.preload = 'auto';
    mediaStreamAudio.setAttribute('playsinline', 'true');
    mediaStreamAudio.setAttribute('webkit-playsinline', 'true');
    (mediaStreamAudio as unknown as { playsInline?: boolean }).playsInline = true;
    // Prevent 3P upstream TTS endpoints from rejecting the Referer header
    try {
      mediaStreamAudio.setAttribute('referrerpolicy', 'no-referrer');
    } catch {
      // ignore if unsupported
    }
  }
  return mediaStreamAudio || new Audio();
}

/**
 * Activate iOS Safari Media Playback session so audio plays even when the iPhone Silent Switch is ON.
 * Must be called synchronously inside a user tap/click handler.
 */
function activateIosPlaybackSession(): void {
  if (typeof window === 'undefined') return;

  // 1. iOS 16.4+ / iOS 17 / iOS 18 native AudioSession API:
  // Setting type = 'playback' explicitly instructs iOS WebKit to ignore the hardware Silent Switch!
  try {
    const nav = navigator as unknown as { audioSession?: { type: string } };
    if (nav.audioSession && nav.audioSession.type !== 'playback') {
      nav.audioSession.type = 'playback';
    }
  } catch {
    // ignore
  }

  // 2. Dedicated silent WAV `<audio>` element (kept strictly separate from TTS URLs)
  try {
    if (!silentUnlockerAudio) {
      silentUnlockerAudio = new Audio(getSilentWavDataUri());
      silentUnlockerAudio.setAttribute('playsinline', 'true');
      silentUnlockerAudio.setAttribute('webkit-playsinline', 'true');
      (silentUnlockerAudio as unknown as { playsInline?: boolean }).playsInline = true;
      silentUnlockerAudio.volume = 0.01;
    }
    if (silentUnlockerAudio.paused) {
      const p = silentUnlockerAudio.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    }
  } catch {
    // ignore
  }

  // 3. Resume and prime the shared Web Audio API context synchronously during user gesture
  try {
    const ctx = getSharedAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
        ctx.resume().catch(() => {});
      }
      // Play a 1-sample silent impulse to lock open the iOS Web Audio hardware thread
      const silentBuf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = silentBuf;
      src.connect(ctx.destination);
      src.start(0);
    }
  } catch {
    // ignore
  }
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

  const exact = voices.find(
    (v) => v.lang === 'ko-KR' || v.lang === 'ko_KR' || v.lang.toLowerCase() === 'ko-kr'
  );
  if (exact) return exact;

  const startsWithKo = voices.find((v) => v.lang.toLowerCase().startsWith('ko'));
  if (startsWithKo) return startsWithKo;

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
 * Play a short melodic Web Audio chime (to test hardware speaker).
 * Uses the exact same shared AudioContext as `speakViaWebAudio`.
 */
export function playKoreanChime(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    try {
      activateIosPlaybackSession();
      const ctx = getSharedAudioContext();
      if (!ctx) {
        resolve(false);
        return;
      }
      if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const notes = [
        { freq: 659.25, time: now, dur: 0.12 },
        { freq: 830.61, time: now + 0.12, dur: 0.28 },
      ];

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, n.time);

        gain.gain.setValueAtTime(0.3, n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, n.time + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(n.time);
        osc.stop(n.time + n.dur);
      });

      setTimeout(() => {
        resolve(true);
      }, 420);
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
  const effectiveEngine: 'webspeech' | 'online' = pref === 'device' ? 'webspeech' : 'online';

  return {
    hasWebSpeech,
    hasNativeVoice: !!koVoice,
    voiceName: koVoice
      ? `${koVoice.name} (${koVoice.lang})`
      : hasWebSpeech
        ? 'System-Koreanisch (ko-KR)'
        : null,
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
  if (typeof window === 'undefined') return;
  activateIosPlaybackSession();

  if (!isAudioUnlocked) {
    try {
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
}

// Attach auto-unlock to user touch/click gestures
if (typeof window !== 'undefined') {
  const handleUserGesture = () => {
    activateIosPlaybackSession();
  };
  window.addEventListener('touchstart', handleUserGesture, { passive: true });
  window.addEventListener('pointerdown', handleUserGesture, { passive: true });
  window.addEventListener('click', handleUserGesture, { passive: true });
}

/**
 * Clean text for Korean TTS
 */
function sanitizeKoreanText(text: string): string {
  return text
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\//g, ', ')
    .replace(/^-(?=[가-힣])/, '')
    .replace(/~(?=[가-힣])/, '')
    .trim();
}

/**
 * Stop any current speech or audio immediately.
 * IMPORTANT: Never stop `silentUnlockerAudio` so iOS stays in Media Playback mode!
 */
export function stopSpeech(): void {
  if (typeof window === 'undefined') return;

  if (activeBufferSource) {
    try {
      activeBufferSource.onended = null;
      activeBufferSource.stop();
      activeBufferSource.disconnect();
    } catch {
      // ignore
    }
    activeBufferSource = null;
  }

  if (mediaStreamAudio) {
    try {
      mediaStreamAudio.pause();
    } catch {
      // ignore
    }
  }

  if ('speechSynthesis' in window) {
    try {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Decode an ArrayBuffer into an AudioBuffer (compatible with all iOS Safari versions)
 */
function decodeMp3Buffer(ctx: AudioContext, arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    try {
      // Clone buffer so it isn't detached if retried
      const copy = arrayBuffer.slice(0);
      const promiseOrVoid = ctx.decodeAudioData(
        copy,
        (decoded) => resolve(decoded),
        (err) => reject(err)
      );
      if (promiseOrVoid && typeof promiseOrVoid.catch === 'function') {
        promiseOrVoid.catch(reject);
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * ENGINE 1 (PRIMARY): Web Audio API Buffer Playback (`AudioContext.destination`).
 * Uses the EXACT SAME hardware output pipeline as `playKoreanChime()` (the Gong)!
 * Once the AudioContext is unlocked during the user tap, it plays reliably even after
 * asynchronous network fetch AND bypasses the iPhone hardware Silent Switch!
 */
async function speakViaWebAudio(cleaned: string, rate: number): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const ctx = getSharedAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
      await ctx.resume().catch(() => {});
    }

    const isSlow = rate <= 0.8;
    const cacheKey = `${isSlow ? 'slow' : 'norm'}:${cleaned}`;
    let audioBuffer = decodedAudioBufferCache.get(cacheKey) || null;

    if (!audioBuffer) {
      const apiUrls = [
        `./api/tts?text=${encodeURIComponent(cleaned)}${isSlow ? '&slow=true' : ''}`,
        `/api/tts?text=${encodeURIComponent(cleaned)}${isSlow ? '&slow=true' : ''}`,
      ];

      let fetchedBytes: ArrayBuffer | null = null;
      for (const url of apiUrls) {
        try {
          const res = await fetch(url);
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && !contentType.includes('text/html')) {
            const buf = await res.arrayBuffer();
            if (buf.byteLength > 100) {
              fetchedBytes = buf;
              break;
            }
          }
        } catch {
          // Try next URL
        }
      }

      if (!fetchedBytes) {
        return false;
      }

      audioBuffer = await decodeMp3Buffer(ctx, fetchedBytes);
      if (decodedAudioBufferCache.size >= 200) {
        const oldest = decodedAudioBufferCache.keys().next().value;
        if (oldest) decodedAudioBufferCache.delete(oldest);
      }
      decodedAudioBufferCache.set(cacheKey, audioBuffer);
    }

    if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
      await ctx.resume().catch(() => {});
    }

    return await new Promise<boolean>((resolve) => {
      try {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer!;
        // Slight rate adjustment if user requested custom speed
        source.playbackRate.value = isSlow ? 0.92 : Math.max(0.75, Math.min(1.25, rate / 0.9));

        const gainNode = ctx.createGain();
        // Boost gain slightly so Korean pronunciation is crisp and loud on mobile speakers
        gainNode.gain.value = 1.35;

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        activeBufferSource = source;

        let finished = false;
        const done = (ok: boolean) => {
          if (!finished) {
            finished = true;
            if (activeBufferSource === source) {
              activeBufferSource = null;
            }
            resolve(ok);
          }
        };

        source.onended = () => done(true);
        source.start(0);

        // Safety timeout based on buffer duration
        const timeoutMs = Math.max(2500, Math.ceil((audioBuffer!.duration + 1.5) * 1000));
        setTimeout(() => done(true), timeoutMs);
      } catch {
        resolve(false);
      }
    });
  } catch {
    return false;
  }
}

/**
 * Try playing a single URL on the dedicated HTML5 `<audio>` element.
 * NOTE: Never set `audio.currentTime = 0` before setting `audio.src` — in iOS Safari WebKit,
 * setting `currentTime` when `readyState === 0` throws `DOMException: InvalidStateError`!
 */
function playSingleHtml5AudioUrl(url: string, playbackRate: number): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = getMediaStreamAudio();

    let finished = false;
    const finish = (ok: boolean) => {
      if (!finished) {
        finished = true;
        audio.onended = null;
        audio.onerror = null;
        audio.oncanplay = null;
        resolve(ok);
      }
    };

    const timer = setTimeout(() => finish(false), 4500);

    audio.onended = () => {
      clearTimeout(timer);
      finish(true);
    };

    audio.onerror = () => {
      clearTimeout(timer);
      finish(false);
    };

    try {
      audio.pause();
      audio.volume = 1.0;
      audio.src = url;
      audio.playbackRate = playbackRate;
      audio.defaultPlaybackRate = playbackRate;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Playback started! Ensure we resolve even if onended is delayed
            setTimeout(() => {
              clearTimeout(timer);
              finish(true);
            }, 4000);
          })
          .catch(() => {
            clearTimeout(timer);
            finish(false);
          });
      }
    } catch {
      clearTimeout(timer);
      finish(false);
    }
  });
}

/**
 * ENGINE 2 (SECONDARY): HTML5 `<audio>` Media Stream with multi-CDN fallback.
 * Works even on static hosts (like GitHub Pages) where `/api/tts` does not exist,
 * because `<audio>` elements do not require CORS headers!
 */
async function speakViaHtml5Audio(cleaned: string, rate: number): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const isSlow = rate <= 0.8;
  const targetPlaybackRate = isSlow ? 0.8 : 1.0;
  const encoded = encodeURIComponent(cleaned);

  const streamUrls = [
    `./api/tts?text=${encoded}${isSlow ? '&slow=true' : ''}`,
    `https://dict.youdao.com/dictvoice?audio=${encoded}&le=ko`,
    `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=ko&client=gtx&q=${encoded}`,
  ];

  for (const url of streamUrls) {
    const ok = await playSingleHtml5AudioUrl(url, targetPlaybackRate);
    if (ok) return true;
  }

  return false;
}

/**
 * ENGINE 3 (TERTIARY): Native Web Speech API (offline fallback).
 * Note: iOS mutes `window.speechSynthesis` when the hardware Silent Switch is active.
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

      utterance.onend = () => finish(true);
      utterance.onerror = () => finish(false);

      activeUtterance = utterance;
      setTimeout(() => finish(true), 5000);

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Main public speak function.
 * Plays Korean pronunciation through the Web Audio / Media Playback pipeline so it is
 * audible on iPhone even when Silent Mode (Stummmodus) is enabled!
 */
export async function speakKorean(text: string, rate: number = 0.9): Promise<void> {
  const cleaned = sanitizeKoreanText(text);
  if (!cleaned) return;

  // Must run synchronously inside the tap gesture before any await
  unlockAudio();
  stopSpeech();

  const pref = getAudioEnginePreference();

  // If user explicitly forced offline device voice
  if (pref === 'device') {
    const ok = await speakViaWebSpeech(cleaned, rate);
    if (!ok) {
      const webAudioOk = await speakViaWebAudio(cleaned, rate);
      if (!webAudioOk) {
        await speakViaHtml5Audio(cleaned, rate);
      }
    }
    return;
  }

  // Default ('auto') & 'online':
  // 1. Play via Web Audio API Buffer (`AudioContext.destination` — exact same hardware channel as the Gong!)
  const webAudioOk = await speakViaWebAudio(cleaned, rate);
  if (webAudioOk) return;

  // 2. Fallback to HTML5 `<audio>` stream (works on static hosts without /api/tts)
  const html5Ok = await speakViaHtml5Audio(cleaned, rate);
  if (html5Ok) return;

  // 3. Offline fallback to Web Speech API
  await speakViaWebSpeech(cleaned, rate);
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
  stopSpeech();

  const sampleText = '안녕하세요! 반갑습니다.';
  let engineUsed: 'webspeech' | 'online' = 'online';
  let success = false;

  if (diag.activePreference === 'device') {
    success = await speakViaWebSpeech(sampleText, 0.95);
    engineUsed = 'webspeech';
    if (!success) {
      success = (await speakViaWebAudio(sampleText, 0.95)) || (await speakViaHtml5Audio(sampleText, 0.95));
      if (success) engineUsed = 'online';
    }
  } else {
    // 1. Primary: Web Audio API (same hardware pipeline as Gong-Check!)
    success = await speakViaWebAudio(sampleText, 0.95);
    if (!success) {
      // 2. Secondary: HTML5 Media Audio element
      success = await speakViaHtml5Audio(sampleText, 0.95);
    }
    engineUsed = 'online';

    if (!success && diag.hasWebSpeech) {
      success = await speakViaWebSpeech(sampleText, 0.95);
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
