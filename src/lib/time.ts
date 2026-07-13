export const KM_PER_MI = 1.609344;

/** Parse "mm:ss" or "h:mm:ss" into seconds; null when invalid. */
export function parseTime(str: string): number | null {
  if (!str) return null;
  const parts = str.trim().split(':');
  if (parts.length < 2 || parts.length > 3) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;
  let h = 0;
  let m: number;
  let s: number;
  if (nums.length === 3) {
    [h, m, s] = nums as [number, number, number];
  } else {
    [m, s] = nums as [number, number];
  }
  if (m >= 60 || s >= 60) return null;
  return h * 3600 + m * 60 + s;
}

/** Format seconds as "m:ss" or "h:mm:ss". */
export function formatTime(totalSeconds: number): string {
  const total = Math.round(totalSeconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}
