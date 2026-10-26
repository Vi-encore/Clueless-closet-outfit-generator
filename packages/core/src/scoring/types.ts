/** The scoring components implemented so far; more arrive with the generator (step 10). */
export const COMPONENTS = ['color', 'formality'] as const;
export type ComponentName = (typeof COMPONENTS)[number];

/** Per-component scores, each from −1 (clash) to 1 (ideal); 0 means no effect or no data. */
export type ScoreBreakdown = Record<ComponentName, number>;

export interface OutfitScore {
  total: number;
  breakdown: ScoreBreakdown;
}
