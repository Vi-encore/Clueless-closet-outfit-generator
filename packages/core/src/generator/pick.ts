import type { PickingTuning } from '../scoring/scoring.interfaces.js';
import type { NoisyCandidate, RandomSource, ScoredCombination } from './generator.interfaces.js';

/** A shuffled copy, so that equal scores do not always favour the first item added. */
export function shuffle<T>(values: readonly T[], random: RandomSource): T[] {
  return values
    .map((candidate): NoisyCandidate<T> => ({ candidate, value: random() }))
    .sort((a, b) => a.value - b.value)
    .map((keyed) => keyed.candidate);
}

/**
 * Picks one candidate: the best `topK` by total, noise added to each, the best `keep` of those,
 * then a weighted random choice where a higher noisy score weighs more.
 * Returns undefined when there is nothing to pick from.
 */
export function pickOne<T extends ScoredCombination>(
  candidates: readonly T[],
  random: RandomSource,
  picking: PickingTuning,
): T | undefined {
  if (candidates.length === 0) return undefined;

  const best = shuffle(candidates, random)
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, picking.topK);

  const kept: NoisyCandidate<T>[] = best
    .map((candidate) => ({
      candidate,
      value: candidate.score.total + (random() * 2 - 1) * picking.noise,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, picking.keep);

  const lowest = Math.min(...kept.map((noisy) => noisy.value));
  const weight = (noisy: NoisyCandidate<T>): number => Math.max(1, noisy.value - lowest + 1) ** 2;
  const sum = kept.reduce((total, noisy) => total + weight(noisy), 0);

  let roll = random() * sum;
  for (const noisy of kept) {
    roll -= weight(noisy);
    if (roll < 0) return noisy.candidate;
  }
  return kept.at(-1)?.candidate;
}
