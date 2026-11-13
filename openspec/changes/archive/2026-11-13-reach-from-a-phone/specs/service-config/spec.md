# Spec Delta

## ADDED Requirements

### Requirement: The store's public base is a setting
The API SHALL read an optional public base for photo links from `S3_PUBLIC_URL`, SHALL accept either an absolute origin or a path that starts with `/`, with no trailing slash, and SHALL refuse to start on anything else.

#### Scenario: Unset by default
- **WHEN** the application starts with no `S3_PUBLIC_URL`
- **THEN** there is no public base

#### Scenario: A path is accepted
- **WHEN** the application starts with `S3_PUBLIC_URL` set to `/storage`
- **THEN** the public base is `/storage`

#### Scenario: A trailing slash stops the application
- **WHEN** the application starts with `S3_PUBLIC_URL` set to `/storage/`
- **THEN** startup fails with a message naming `S3_PUBLIC_URL`
