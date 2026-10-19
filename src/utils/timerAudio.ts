/**
 * Synthesizes a cheerful kitchen timer chime using the browser's Web Audio API.
 * Requires 0 external audio files and works offline reliably.
 */
export function playRamyeonDoneChime() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Cheerful 4-tone marimba/bell arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const startTime = ctx.currentTime + 0.05;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Warm bell/vibraphone chime
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.16);

      // Attack and gentle decay
      gain.gain.setValueAtTime(0.001, startTime + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.28, startTime + idx * 0.16 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + idx * 0.16 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.16);
      osc.stop(startTime + idx * 0.16 + 0.65);
    });

    // Second celebratory flourish 0.8s later
    setTimeout(() => {
      const finalOsc = ctx.createOscillator();
      const finalGain = ctx.createGain();
      finalOsc.type = 'sine';
      finalOsc.frequency.setValueAtTime(1046.5, ctx.currentTime);
      finalGain.gain.setValueAtTime(0.25, ctx.currentTime);
      finalGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      finalOsc.connect(finalGain);
      finalGain.connect(ctx.destination);
      finalOsc.start();
      finalOsc.stop(ctx.currentTime + 0.85);
    }, 750);
  } catch (e) {
    console.warn('Could not play timer chime:', e);
  }
}
