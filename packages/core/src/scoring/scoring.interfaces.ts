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

/** "Bright" = saturated and neither too dark nor pastel. Saturation and lightness are 0-1. */
export interface BrightnessTuning {
  readonly minSaturation: number;
  readonly minLightness: number;
  readonly maxLightness: number;
}

export interface ColorTuning {
  /** A clash-free outfit without accents. */
  readonly calm: number;
  /** One bright color or print on a neutral base. */
  readonly accent: number;
  /** Penalty for every bright color or print beyond the first one. */
  readonly extraAccentPenalty: number;
  readonly bright: BrightnessTuning;
}

export interface FormalityTuning {
  /** Cost of each step between the outfit's average formality and the target. */
  readonly pointsPerStep: number;
}

export interface PickingTuning {
  /** How many of the best bases are kept before noise is added. */
  readonly topK: number;
  /** How many survive the noise and enter the weighted random choice. */
  readonly keep: number;
  /** The noise added to each score is uniform in -noise..noise. */
  readonly noise: number;
}

/** Every threshold and score the filters, components and generator use. */
export interface Tuning {
  /** Items in one outfit may differ in formality by at most this much. */
  readonly maxFormalityGap: number;
  readonly color: ColorTuning;
  readonly formality: FormalityTuning;
  readonly picking: PickingTuning;
}
