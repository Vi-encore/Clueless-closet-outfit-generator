import type { OccasionCode } from '../taxonomy/vocabularies.js';
import type { ComponentName } from './components.js';

/** Per-component scores, each from −1 (clash) to 1 (ideal); 0 means no effect or no data. */
export type ScoreBreakdown = Record<ComponentName, number>;

export interface OutfitScore {
  total: number;
  breakdown: ScoreBreakdown;
}

export interface Hsl {
  /** Hue in degrees, 0–360. */
  h: number;
  /** Saturation, 0–1. */
  s: number;
  /** Lightness, 0–1. */
  l: number;
}

/** Why an outfit was rejected — structured, so the UI can phrase it in its own language. */
export type RejectionReason =
  | { kind: 'formality_gap'; gap: number }
  | { kind: 'avoided_occasion'; itemId: string; occasion: OccasionCode };

export type FilterResult = { ok: true } | { ok: false; reasons: RejectionReason[] };
