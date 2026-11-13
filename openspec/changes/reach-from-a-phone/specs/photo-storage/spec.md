# Spec Delta

## ADDED Requirements

### Requirement: Photo links can go through a public base
The API SHALL, when a public base for the store is set, give out every presigned upload and view link with the store's own origin replaced by that base, keeping the path, the query and the signature unchanged, and SHALL give links out unchanged when no base is set.

#### Scenario: A view link through the public base
- **GIVEN** the store is at `http://localhost:9000` and the public base is `/storage`
- **WHEN** a link to a photo is given out
- **THEN** it starts with `/storage/` and is followed by the bucket, the key and the signed query

#### Scenario: An upload link through the public base
- **GIVEN** the store is at `http://localhost:9000` and the public base is `/storage`
- **WHEN** an upload link is issued
- **THEN** it starts with `/storage/`

#### Scenario: No base, no change
- **GIVEN** no public base is set
- **WHEN** a link to a photo is given out
- **THEN** it starts with the store's own address
