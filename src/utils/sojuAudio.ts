/**
 * Web Audio API synthesizer for Soju Bottle Roulette.
 * Zero external audio files required, works offline.
 */

export function playSojuSpinTick() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Short wooden/glass click sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620 + Math.random() * 80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  } catch {
    // audio failure silent
  }
}

export function playSojuCheersChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const startTime = ctx.currentTime;

    // Realistic glass clink ("짠!"): High resonant harmonic bells with quick attack & delicate glass decay
    const freqs = [1760, 2637, 3520]; // A6, E7, A7
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const amp = idx === 0 ? 0.2 : 0.12 / (idx + 1);
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(amp, startTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.7 + idx * 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.85);
    });
  } catch {
    // ignore
  }
}
