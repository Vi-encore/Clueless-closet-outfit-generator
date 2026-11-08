import 'dotenv/config';
import { GetBucketCorsCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { envSchema } from '../config/env.js';
import { corsRulesFor } from './cors-rules.js';
import { makeS3Client, s3SettingsFromEnvironment } from './s3.js';

/**
 * Sets the bucket's CORS rules from `WEB_ORIGINS`, against whatever `.env` points at.
 *
 * Run once per deployment and again when an origin changes. A script for the reason
 * `storage:init` is one: changing a bucket is a thing a person does, and an API doing it
 * at startup would need a key with rights it has no business holding.
 *
 * It is needed at all because of Backblaze. MinIO allows every origin by default, so on
 * a laptop an upload works with or without this, and a browser against Backblaze is
 * refused before anything is sent. The origins are read through the application's own
 * schema, so that the two lists cannot follow different rules.
 */
const { bucket, ...settings } = s3SettingsFromEnvironment();
const origins = envSchema.shape.WEB_ORIGINS.parse(process.env.WEB_ORIGINS);
const client = makeS3Client(settings);

try {
  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules: corsRulesFor(origins) },
    }),
  );

  // Read back rather than assumed: this is the bucket's word, not the request's.
  const { CORSRules } = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));

  console.log(`${bucket} now allows`, JSON.stringify(CORSRules));
} catch (error) {
  // MinIO has no rules per bucket and answers 501, which is the local case and no fault:
  // it allows every origin already. Everything else is a real failure.
  if (!(error instanceof Error) || error.name !== 'NotImplemented') {
    throw error;
  }

  console.log(`${bucket} is on a store without bucket rules, which allows every origin`);
}
