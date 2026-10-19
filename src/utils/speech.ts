/**
 * Korean Speech Audio System
 * Uses high-fidelity native Korean neural TTS audio streaming via HTML5 Audio,
 * supporting normal (1.0x) and slow (0.75x) pronunciation, with automatic fallback.
 */

let currentAudio: HTMLAudioElement | null = null;

export function speakKorean(text: string, rate: number = 0.9): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    // Clean text: remove parentheses, grammatical dashes, slashes that might confuse speech
    const cleaned = text
      .replace(/\(.*?\)/g, '')
      .replace(/\//g, ', ')
      .replace(/^-(?=[가-힣])/, '') // Remove leading hyphen in -고 싶다 etc.
      .trim();

    if (!cleaned) {
      resolve();
      return;
    }

    // Stop currently playing audio if any
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      currentAudio = null;
    }

    const isSlow = rate <= 0.8;
    const targetPlaybackRate = isSlow ? 0.75 : 1.0;

    // Priority 1: High-fidelity audio stream with slow parameter support
    const proxyUrl = `/api/tts?text=${encodeURIComponent(cleaned)}${isSlow ? '&slow=true' : ''}`;
    const directFallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&ttsspeed=${isSlow ? '0.24' : '1'}&q=${encodeURIComponent(cleaned)}`;

    const audio = new Audio();
    audio.defaultPlaybackRate = targetPlaybackRate;
    currentAudio = audio;

    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
    };

    audio.onended = () => {
      cleanup();
      resolve();
    };

    // Ensure playback rate is maintained across browser media load events
    audio.onloadedmetadata = () => {
      audio.playbackRate = targetPlaybackRate;
    };
    audio.onplay = () => {
      audio.playbackRate = targetPlaybackRate;
    };

    audio.onerror = () => {
      cleanup();
      // Try direct URL if proxy fails, otherwise fallback to Web Speech API
      if (audio.src.includes('/api/tts')) {
        const directAudio = new Audio();
        directAudio.defaultPlaybackRate = targetPlaybackRate;
        directAudio.src = directFallbackUrl;
        directAudio.playbackRate = targetPlaybackRate;
        currentAudio = directAudio;

        directAudio.onended = () => resolve();
        directAudio.onerror = () => {
          fallbackWebSpeech(cleaned, targetPlaybackRate, resolve);
        };
        directAudio.play().catch(() => {
          fallbackWebSpeech(cleaned, targetPlaybackRate, resolve);
        });
      } else {
        fallbackWebSpeech(cleaned, targetPlaybackRate, resolve);
      }
    };

    audio.src = proxyUrl;
    audio.playbackRate = targetPlaybackRate;

    audio.play()
      .then(() => {
        audio.playbackRate = targetPlaybackRate;
      })
      .catch((err) => {
        console.warn('Audio play error, attempting fallback:', err);
        audio.src = directFallbackUrl;
        audio.playbackRate = targetPlaybackRate;
        audio.play().catch(() => {
          fallbackWebSpeech(cleaned, targetPlaybackRate, resolve);
        });
      });
  });
}

function fallbackWebSpeech(cleaned: string, rate: number, resolve: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    resolve();
    return;
  }

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'ko-KR';
    utterance.rate = rate;

    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find((v) => v.lang.startsWith('ko'));
    if (koVoice) {
      utterance.voice = koVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Web Speech API fallback failed:', err);
    resolve();
  }
}
