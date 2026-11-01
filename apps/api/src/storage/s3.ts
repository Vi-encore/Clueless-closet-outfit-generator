import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';

/**
 * Everything below here is free of Nest, and deliberately so.
 *
 * `StorageService` carries `@Injectable`, and decorators are not type syntax,
 * so Node cannot run a file that reaches them - which rules the service out for
 * the `storage:init` script, since that script's whole appeal is running
 * straight from TypeScript. Both of them needed to know how to make a client
 * and how to make a bucket, and for a while both knew separately.
 */
export interface S3Settings {
  endpoint: string;
  region: string;
  forcePathStyle: boolean;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * The settings as the two scripts read them, which have no `ConfigService` to ask. The
 * defaults repeat the ones in `config/env.ts`, as the MinIO that Compose starts.
 */
export function s3SettingsFromEnvironment(): S3Settings & { bucket: string } {
  const bucket = process.env.S3_BUCKET;

  if (bucket === undefined) {
    throw new Error('S3_BUCKET is not set');
  }

  return {
    bucket,
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.S3_REGION ?? 'us-east-1',
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  };
}

export function makeS3Client(settings: S3Settings): S3Client {
  return new S3Client({
    endpoint: settings.endpoint,
    region: settings.region,
    forcePathStyle: settings.forcePathStyle,
    // Off, where the SDK defaults to on. When presigning it signs in a checksum computed
    // over no body at all, which a browser sending real bytes cannot match. MinIO let it
    // through and Backblaze does not, so the test reads the URL rather than the upload.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
  });
}

/**
 * Makes the bucket if it is not there.
 *
 * Never called at startup, and that is the point: a Backblaze key scoped to one
 * bucket has no right to create buckets, so an API that made its own would work
 * on a laptop and fail on its first deployment. This is for the test setup and
 * for the script somebody runs once against their local object store.
 */
export async function ensureBucket(client: S3Client, bucket: string): Promise<void> {
  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  } catch (error) {
    const name = error instanceof Error ? error.name : '';

    // Already there, made by us or by somebody else: both mean there is nothing
    // left to do. Anything else is a real failure and belongs to the caller.
    if (name !== 'BucketAlreadyOwnedByYou' && name !== 'BucketAlreadyExists') {
      throw error;
    }
  }
}
