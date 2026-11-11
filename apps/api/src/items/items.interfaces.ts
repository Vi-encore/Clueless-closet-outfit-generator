import type { Item } from '../generated/prisma/client.js';

/**
 * An item as the API answers with it: the row, plus a link to its photograph.
 *
 * The link is short-lived and carries its own authorisation, which is what lets
 * a browser render `<img src>` with no token anywhere - and what makes it safe
 * to put in a list, since one that leaks stops working in minutes.
 */
export interface ItemView extends Item {
  photoUrl: string | null;
  /** The same for the item cut out of its background, where it has been. */
  cutoutUrl: string | null;
}
