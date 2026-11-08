import 'dotenv/config';
import { ensureBucket, makeS3Client, s3SettingsFromEnvironment } from './s3.js';

/**
 * Makes the bucket, once, against whatever `.env` points at.
 *
 * Carries no Nest, and is built before it is run.
 *
 * Running it straight from TypeScript was the original appeal - Node does that -
 * but not for a file that imports another: this project writes `.js` in its
 * import paths, as `nodenext` asks, and Node resolves that literally and finds
 * nothing to open. One of the two had to go, and a convention that holds across
 * every file is worth more than a script that skips a three-second build.
 *
 * What it shares with `StorageService` lives in `s3.ts`, free of decorators so
 * that neither has to keep its own copy.
 *
 * Creating a bucket is a thing a person does, which is why it is a script: a
 * Backblaze key scoped to one bucket has no right to create buckets, so an API
 * that made its own would work on a laptop and fail on its first deployment.
 */
const { bucket, ...settings } = s3SettingsFromEnvironment();

await ensureBucket(makeS3Client(settings), bucket);

console.log(`${bucket} is ready`);
