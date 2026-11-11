import { SCALE_MAX } from '@closet/core';
import type { ItemSheetProps } from './wardrobe.interfaces';
import { uk } from '../../shared/i18n/uk';
import { TagLine } from './tag-line';
import { joinLabels } from './wardrobe.utils';

/**
 * Every tag an item has, after its slot and type, by its Ukrainian label. A tag the item
 * does not have gets no line: a card full of "not said" says less, not more.
 */
export function TagLines({ item }: ItemSheetProps) {
  const scale = (value: number | null) => (value === null ? '' : uk.tags.outOf(value, SCALE_MAX));

  return (
    <>
      <TagLine
        label={uk.tags.colors}
        value={joinLabels((item.colors ?? []).map(({ family }) => uk.colors[family]))}
      />
      <TagLine label={uk.tags.pattern} value={item.pattern ? uk.patterns[item.pattern] : ''} />
      <TagLine
        label={uk.tags.fabricType}
        value={item.fabricType ? uk.fabricTypes[item.fabricType] : ''}
      />
      <TagLine
        label={uk.tags.materials}
        value={joinLabels(
          (item.materials ?? []).map(({ material, percent }) =>
            percent === undefined
              ? uk.materials[material]
              : `${uk.materials[material]} ${percent}%`,
          ),
        )}
      />
      <TagLine label={uk.tags.fit} value={item.fit ? uk.fits[item.fit] : ''} />
      <TagLine label={uk.tags.length} value={item.length ? uk.lengths[item.length] : ''} />
      <TagLine label={uk.tags.rise} value={item.rise ? uk.rises[item.rise] : ''} />
      <TagLine
        label={uk.tags.seasons}
        value={joinLabels(item.seasons.map((code) => uk.seasons[code]))}
      />
      <TagLine label={uk.tags.warmth} value={scale(item.warmth)} />
      <TagLine label={uk.tags.formality} value={scale(item.formality)} />
      <TagLine
        label={uk.tags.styles}
        value={joinLabels(item.styles.map((code) => uk.styles[code]))}
      />
      <TagLine
        label={uk.tags.occasions}
        value={joinLabels(item.occasions.map((code) => uk.occasions[code]))}
      />
      <TagLine
        label={uk.tags.avoidOccasions}
        value={joinLabels(item.avoidOccasions.map((code) => uk.occasions[code]))}
      />
      <TagLine label={uk.tags.brand} value={item.brand ?? ''} />
      <TagLine label={uk.tags.size} value={item.size ?? ''} />
      <TagLine
        label={uk.tags.priceShown}
        value={item.price === null ? '' : `${item.price} ${item.currency}`}
      />
      <TagLine label={uk.tags.notes} value={item.notes ?? ''} />
    </>
  );
}
