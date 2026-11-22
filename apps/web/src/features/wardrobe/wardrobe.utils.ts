import {
  COLOR_SWATCHES,
  LEAST_COLOR_SHARE,
  SLOTS,
  type ColorFamily,
  type ItemColor,
  type Slot,
} from '@closet/core';
import { hasStatus } from '../../shared/api/api.utils';
import { uk } from '../../shared/i18n/uk';
import { BAD_TAGS, NO_PHOTO, NO_REASON } from './wardrobe.constants';

export function describeArchiveFailure(error: unknown): string {
  return error === NO_REASON ? uk.item.noReason : uk.errors.unavailable;
}

export function describeNewItemFailure(error: unknown): string {
  if (error === NO_PHOTO) {
    return uk.newItem.noPhoto;
  }

  if (error === BAD_TAGS) {
    return uk.newItem.badTags;
  }

  // The API refuses a content type it does not know. The images are made here, so this
  // would be a browser that encoded something unexpected; it is still worth saying.
  return hasStatus(error, 400) ? uk.newItem.badPhoto : uk.newItem.failed;
}

/** Several labels on one line of an item's card. */
export const joinLabels = (labels: string[]) => labels.join(', ');

/** The address is typed by anybody, so a slot from it is only believed if it is one. */
export function slotFrom(value: string | null): Slot | undefined {
  return SLOTS.find((slot) => slot === value);
}

/** The same for the archive: anything but `archived` means the wardrobe itself. */
export function statusFrom(value: string | null): 'archived' | undefined {
  return value === 'archived' ? value : undefined;
}

/**
 * The colours with one of them named another family. It takes that family's typical
 * colour, so what the scorer and the doll read is what the person said, and keeps its
 * share. Named as a family already listed, the two become one, their shares together.
 */
export function withFamily(
  colors: readonly ItemColor[],
  index: number,
  family: ColorFamily,
): ItemColor[] {
  const changed = colors[index];

  if (changed === undefined || changed.family === family) {
    return [...colors];
  }

  const already = colors.findIndex((color) => color.family === family);
  const share =
    already === -1 ? changed.share : Math.min(1, changed.share + (colors[already]?.share ?? 0));
  const named = { family, hex: COLOR_SWATCHES[family], share };

  return colors.flatMap((color, at) => {
    if (at === index) {
      return already === -1 ? [named] : [];
    }

    return at === already ? [named] : [color];
  });
}

/**
 * The colours with a family added at the smallest share the photograph would report: a
 * colour added by hand is a detail unless it is the only one, and then it is the item.
 */
export function withAdded(colors: readonly ItemColor[], family: ColorFamily): ItemColor[] {
  if (colors.some((color) => color.family === family)) {
    return [...colors];
  }

  return [
    ...colors,
    { family, hex: COLOR_SWATCHES[family], share: colors.length === 0 ? 1 : LEAST_COLOR_SHARE },
  ];
}

export function withoutColor(colors: readonly ItemColor[], index: number): ItemColor[] {
  return colors.filter((_, at) => at !== index);
}
