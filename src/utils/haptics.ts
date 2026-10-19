/**
 * Safe Vibration API wrapper for tactile feedback on mobile & touch devices.
 * Gracefully degrades on desktop browsers or devices without vibration support.
 */

function canVibrate(): boolean {
  return typeof window !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function';
}

/** Subtle 10ms tap for navigation, filter switches, or minor UI toggles */
export function hapticTap(): void {
  try {
    if (canVibrate()) {
      navigator.vibrate(10);
    }
  } catch {
    // Ignore errors on restricted environments
  }
}

/** Crisp 16ms tactile pulse when flipping a flashcard */
export function hapticFlip(): void {
  try {
    if (canVibrate()) {
      navigator.vibrate(16);
    }
  } catch {
    // Ignore
  }
}

/** Uplifting double pulse when marking a card as "Learned / Known" */
export function hapticSuccess(): void {
  try {
    if (canVibrate()) {
      navigator.vibrate([14, 45, 24]);
    }
  } catch {
    // Ignore
  }
}

/** Distinct firm double tap when marking a card as "Repeat / Again" */
export function hapticRepeat(): void {
  try {
    if (canVibrate()) {
      navigator.vibrate([28, 35, 28]);
    }
  } catch {
    // Ignore
  }
}
