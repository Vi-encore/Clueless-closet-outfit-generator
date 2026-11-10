import {
  FABRIC_TYPES,
  FITS,
  LENGTHS,
  OCCASIONS,
  PATTERNS,
  RISES,
  SCALE_MAX,
  SCALE_MIN,
  SEASONS,
  STYLES,
} from '@closet/core';
import { uk } from '../../../shared/i18n/uk';
import { checklistOf, choiceOf } from './tag-form.utils';

export const SCALE = Array.from({ length: SCALE_MAX - SCALE_MIN + 1 }, (_, at) => SCALE_MIN + at);

/** The tags chosen from one vocabulary, in the order the form shows them. */
export const CHOICES = [
  choiceOf('pattern', uk.tags.pattern, PATTERNS, uk.patterns),
  choiceOf('fabricType', uk.tags.fabricType, FABRIC_TYPES, uk.fabricTypes),
  choiceOf('fit', uk.tags.fit, FITS, uk.fits),
  choiceOf('length', uk.tags.length, LENGTHS, uk.lengths),
  choiceOf('rise', uk.tags.rise, RISES, uk.rises),
];

/** The tags that hold several codes, in the order the form shows them. */
export const CHECKLISTS = [
  checklistOf('seasons', uk.tags.seasons, SEASONS, uk.seasons, uk.tags.allSeasons),
  checklistOf('styles', uk.tags.styles, STYLES, uk.styles),
  checklistOf('occasions', uk.tags.occasions, OCCASIONS, uk.occasions),
  checklistOf('avoidOccasions', uk.tags.avoidOccasions, OCCASIONS, uk.occasions),
];
