/** Keeps a component score inside the −1…1 range. */
export function clamp(value: number, min = -1, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function average(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
