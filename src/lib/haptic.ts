export function haptic(pattern: number | number[] = 8) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}

export const HAPTIC = {
  light: 6,
  medium: 12,
  heavy: 20,
  success: [20, 50, 20] as number[],
  error: [50, 50, 50] as number[],
};
