import type { CORSRule } from '@aws-sdk/client-s3';

/**
 * What a browser needs from the bucket: to `PUT` a file with its `Content-Type`, and to
 * `GET` one back as bytes.
 *
 * An `<img>` is not a CORS request, so a photograph displays with no rule at all. Reading
 * one's bytes is: the card cuts the background out of a saved item's original on the
 * device, and has to read it to do so (`recut-item-photos`). A `GET` sends no header of
 * its own, so the allowed headers stay the one an upload needs.
 *
 * Refusing an empty list matters more than it looks. The bucket would accept it, the
 * script would report success, and every browser would then be refused with an error
 * that names neither the bucket nor the setting.
 */
export function corsRulesFor(origins: readonly string[]): CORSRule[] {
  if (origins.length === 0) {
    throw new Error('WEB_ORIGINS is empty: a bucket with no origins refuses every browser');
  }

  return [
    {
      AllowedOrigins: [...origins],
      AllowedMethods: ['PUT', 'GET'],
      // Lower case because a browser's preflight lists headers that way, and not every
      // storage service compares them the way S3 does.
      AllowedHeaders: ['content-type'],
      // A preflight per photograph is a round trip per photograph, so remember it a while.
      MaxAgeSeconds: 3600,
    },
  ];
}
