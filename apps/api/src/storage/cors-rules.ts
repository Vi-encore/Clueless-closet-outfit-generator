import type { CORSRule } from '@aws-sdk/client-s3';

/**
 * What a browser needs from the bucket: to `PUT` a file with its `Content-Type`.
 *
 * Nothing for reading, and that is not an oversight. An `<img>` is not a CORS request,
 * so a photograph displays with no rule at all, and a rule allowing `GET` would permit
 * something nothing does. A screen that reads a photo's pixels would change this, for
 * a reason that would exist by then.
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
      AllowedMethods: ['PUT'],
      // Lower case because a browser's preflight lists headers that way, and not every
      // storage service compares them the way S3 does.
      AllowedHeaders: ['content-type'],
      // A preflight per photograph is a round trip per photograph, so remember it a while.
      MaxAgeSeconds: 3600,
    },
  ];
}
