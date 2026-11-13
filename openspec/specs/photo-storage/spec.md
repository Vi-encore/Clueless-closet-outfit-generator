# photo-storage Specification

## Purpose
Covers getting a photograph into storage and handing out the right to look at it: a presigned URL that carries an upload without the client holding any credentials, a key that names whoever it was issued to so it cannot be used by anybody else, and the removal of a photograph that has been replaced.

## Requirements

### Requirement: An upload URL is issued to the person asking
The API SHALL answer `POST /items/upload-url` with a storage key and a presigned `PUT` URL that expires, SHALL build the key so that it names the signed-in user and cannot be guessed, and SHALL accept only image content types.

#### Scenario: A URL and a key come back
- **WHEN** a signed-in client asks for an upload URL for `image/webp`
- **THEN** the response status is 201
- **AND** it carries a key and a URL
- **AND** it says how long the URL lasts

#### Scenario: The key names its owner
- **WHEN** a signed-in client asks for an upload URL
- **THEN** the key contains that user's id
- **AND** two requests from the same user give different keys

#### Scenario: Only images are accepted
- **WHEN** a signed-in client asks for an upload URL for `application/pdf`
- **THEN** the response status is 400

#### Scenario: Signing in is required
- **WHEN** a client asks for an upload URL without an access token
- **THEN** the response status is 401

### Requirement: The presigned URL really carries the upload
The storage SHALL accept a `PUT` of the file to that URL from a client holding no credentials of its own, and the object SHALL afterwards be readable through a link the API issues.

#### Scenario: Bytes go up and come back
- **GIVEN** a signed-in client has an upload URL and a key
- **WHEN** it puts a file at that URL with the content type it asked for
- **THEN** the upload succeeds
- **AND** fetching the link the API issues for that key returns the same bytes

#### Scenario: An unsigned request is refused
- **GIVEN** a signed-in client has a key
- **WHEN** something puts a file at the storage without a signature
- **THEN** the upload is refused

### Requirement: A key belongs to whoever it was issued to
The API SHALL refuse an item carrying a storage key whose owner segment is not the signed-in user, whether the item is being created or changed.

#### Scenario: Somebody else's key is refused
- **GIVEN** account A has been issued an upload key
- **WHEN** account B creates an item carrying that key
- **THEN** the response status is 400

#### Scenario: An invented key is refused
- **WHEN** a signed-in client creates an item carrying a key that follows no known shape
- **THEN** the response status is 400

#### Scenario: Your own key is accepted
- **GIVEN** a signed-in client has been issued an upload key
- **WHEN** it creates an item carrying that key
- **THEN** the response status is 201

### Requirement: A replaced photo is removed from storage
The API SHALL delete the object a photo key pointed at when an item is given a different one, so that a replaced photograph is not paid for forever.

#### Scenario: The old object goes
- **GIVEN** an item whose photo has been uploaded
- **WHEN** its owner patches it with a different photo key
- **THEN** the first object is no longer in storage

#### Scenario: The new object stays
- **GIVEN** an item whose photo has been replaced
- **WHEN** its owner reads the item
- **THEN** the link returns the second photograph

### Requirement: A browser may upload to the bucket
The system SHALL provide a script that sets the bucket's CORS rules from the configured origins, allowing exactly what a browser's presigned upload needs, and SHALL refuse to run with no origins configured, so that a deployment cannot end up with a bucket that silently refuses every browser.

#### Scenario: The rules name the configured origins
- **GIVEN** two configured origins
- **WHEN** the rules are built
- **THEN** they allow both origins and no others

#### Scenario: Only an upload is allowed
- **WHEN** the rules are built
- **THEN** they allow `PUT` with a `Content-Type` header
- **AND** they allow no other method

#### Scenario: No origins is refused
- **GIVEN** no configured origins
- **WHEN** the rules are built
- **THEN** building them fails

### Requirement: An upload URL asks for nothing a browser cannot send
The API SHALL issue upload URLs that carry no checksum of their own, since a checksum computed when the URL is signed describes a body that does not exist yet.

#### Scenario: No checksum in the URL
- **WHEN** a client asks for an upload URL
- **THEN** the URL carries no checksum parameter

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
