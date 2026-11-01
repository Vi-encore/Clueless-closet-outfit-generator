import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { ensureBucket, makeS3Client } from './s3.js';

export interface UploadTarget {
  key: string;
  url: string;
  expiresIn: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.bucket = config.get('S3_BUCKET', { infer: true });
    this.client = makeS3Client({
      endpoint: config.get('S3_ENDPOINT', { infer: true }),
      region: config.get('S3_REGION', { infer: true }),
      forcePathStyle: config.get('S3_FORCE_PATH_STYLE', { infer: true }),
      accessKeyId: config.get('S3_ACCESS_KEY_ID', { infer: true }),
      secretAccessKey: config.get('S3_SECRET_ACCESS_KEY', { infer: true }),
    });
  }

  /**
   * A URL that accepts this one file, as this one content type, for a few minutes.
   *
   * The content type is signed into it: a URL asked for as `image/webp` refuses a
   * `PUT` that sends anything else, and refuses it with an opaque 403, so a client
   * has to send back exactly what it asked for.
   */
  async uploadUrl(key: string, contentType: string): Promise<UploadTarget> {
    const expiresIn = this.config.get('S3_UPLOAD_URL_TTL', { infer: true });
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn },
    );

    return { key, url, expiresIn };
  }

  /**
   * A URL that reads this one object for a while.
   *
   * Signing is local arithmetic rather than a request, so attaching one of these
   * to every item on a page costs no round trips - which is what lets the link be
   * a field of an item rather than a route of its own.
   */
  viewUrl(key: string): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: this.config.get('S3_VIEW_URL_TTL', { infer: true }),
    });
  }

  /**
   * Removes an object, and says nothing if it cannot.
   *
   * The only caller replaces a photograph, and by the time this runs the item is
   * already correct. An orphaned object costs a fraction of a cent; a failure
   * raised here would tell somebody their edit failed when it did not.
   */
  async remove(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (error) {
      this.logger.warn(`Could not remove ${key}: ${String(error)}`);
    }
  }

  /** The script and the tests both reach the bucket check through here. */
  ensureBucket(): Promise<void> {
    return ensureBucket(this.client, this.bucket);
  }
}
