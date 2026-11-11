import { COMPONENTS } from '@closet/core';
import { uk } from '../../shared/i18n/uk';
import type { ReasonProps } from './outfits.interfaces';
import { SCORE_FORMAT } from './outfits.constants';

/** One line per component, and Cher's verdict when the whole is below zero. */
export function OutfitReason({ outfit }: ReasonProps) {
  if (outfit.score === null) {
    return null;
  }

  const { total, breakdown } = outfit.score;

  return (
    <div className="flex flex-col gap-2">
      {total < 0 && <p className="mismatch title-bar-text">{uk.outfits.mismatch}</p>}
      <ul aria-label={uk.outfits.why} className="tree-view">
        {COMPONENTS.map((name) => (
          <li key={name}>
            <span>{uk.outfits.components[name]}</span>: {SCORE_FORMAT.format(breakdown[name])}
          </li>
        ))}
      </ul>
    </div>
  );
}
