# Spec Delta

## ADDED Requirements

### Requirement: The storage is described by settings
The API SHALL read the storage endpoint, region, bucket, credentials, addressing style and link lifetimes from the environment, SHALL apply working defaults to everything except the bucket and the credentials, and SHALL refuse to start when a lifetime is not a number it can use.

#### Scenario: Lifetimes default
- **WHEN** the application starts with no lifetimes given
- **THEN** an upload link lasts 300 seconds and a view link lasts 900

#### Scenario: Addressing style defaults to path
- **WHEN** the application starts with no addressing style given
- **THEN** buckets are addressed by path, which is what a local MinIO needs

#### Scenario: A lifetime that is not a number stops the application
- **WHEN** the application starts with `S3_UPLOAD_URL_TTL` set to `soon`
- **THEN** startup fails with a message naming `S3_UPLOAD_URL_TTL`
