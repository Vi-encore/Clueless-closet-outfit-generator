import 'dotenv/config';
import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';

/**
 * Makes the bucket, once, against whatever `.env` points at.
 *
 * Deliberately free of Nest and of `StorageService`, for two reasons. Node runs
 * a file like this straight from TypeScript, which it cannot do for anything
 * carrying decorators. And the application must never create its own bucket: a
 * Backblaze key scoped to one bucket has no right to, so an API that did would
 * work on a laptop and fail on its first deployment. Creating one is a thing a
 * person does, which is why it is a script.
 */
const bucket = process.env.S3_BUCKET;

if (bucket === undefined) {
  throw new Error('S3_BUCKET is not set');
}

const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  region: process.env.S3_REGION ?? 'us-east-1',
  forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  },
});

try {
  await client.send(new CreateBucketCommand({ Bucket: bucket }));
  console.log(`Created ${bucket}`);
} catch (error) {
  const name = error instanceof Error ? error.name : '';

  if (name !== 'BucketAlreadyOwnedByYou' && name !== 'BucketAlreadyExists') {
    throw error;
  }

  console.log(`${bucket} is already there`);
}
