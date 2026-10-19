/** Haptic feedback wrapper for mobile controllers */
export const haptics = {
  light(): void {
    if ('vibrate' in navigator) navigator.vibrate(30);
  },
  medium(): void {
    if ('vibrate' in navigator) navigator.vibrate(60);
  },
  heavy(): void {
    if ('vibrate' in navigator) navigator.vibrate([80, 30, 80]);
  },
  pattern(pattern: number[]): void {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  },
  stop(): void {
    if ('vibrate' in navigator) navigator.vibrate(0);
  },
};
