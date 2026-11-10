import { SLOTS, type Slot } from '@closet/core';
import { hasStatus } from '../../shared/api/api-error';
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
