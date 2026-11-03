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

export interface UploadTarget {
  key: string;
  url: string;
  expiresIn: number;
}
