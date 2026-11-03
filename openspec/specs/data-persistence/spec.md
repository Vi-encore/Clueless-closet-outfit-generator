# data-persistence Specification

## Purpose
Defines how wardrobe data is stored: which rules the database itself guarantees, so that no amount of application code can leave the wardrobe in a state the rest of the project does not expect.

## Requirements

### Requirement: Records are identified by UUID
The system SHALL identify every stored record by a UUID assigned automatically when the record is created, so that an identifier appearing in a URL or a photo file name reveals nothing about other records and cannot be guessed.

#### Scenario: Identifier assigned on insert
- **WHEN** a user is created without an id
- **THEN** the stored record has an id
- **AND** the id is a UUID

### Requirement: A username identifies a person
The system SHALL require a unique username and a unique email for every user, and SHALL reject a second user with either.

#### Scenario: Username taken
- **GIVEN** a user with the username `cher`
- **WHEN** another user is created with the username `cher`
- **THEN** the write fails

#### Scenario: Email taken
- **GIVEN** a user with the email `cher@example.com`
- **WHEN** another user is created with that email
- **THEN** the write fails

### Requirement: An item needs an owner, a slot and a type
The system SHALL store an item only with an owner, a slot and a type; every other tag is optional, and an item whose owner does not exist SHALL be rejected.

#### Scenario: Minimal item stored
- **WHEN** an item is created with an owner, slot `top` and type `blouse`
- **THEN** the item is stored
- **AND** its remaining tags are empty

#### Scenario: Owner does not exist
- **WHEN** an item is created with an owner id that belongs to nobody
- **THEN** the write fails

### Requirement: Items are private by default
The system SHALL store a new item as `private` unless another visibility is given.

#### Scenario: Visibility not given
- **WHEN** an item is created without a visibility
- **THEN** the stored item is `private`

### Requirement: Items are archived, not deleted
The system SHALL keep an archived item stored, recording when and why it was archived, so that outfit history and statistics still refer to it.

#### Scenario: Item archived
- **WHEN** an item is archived with a reason
- **THEN** the item is still stored
- **AND** it records the reason and the moment it was archived

### Requirement: Timestamps are stored with a time zone
The system SHALL store every timestamp with its time zone, so that a moment means the same thing wherever it is read.

#### Scenario: Creation time recorded
- **WHEN** an item is created
- **THEN** its creation time is stored with a time zone

### Requirement: The connection is opened and closed with the application
The API SHALL open its database connection when the application starts and close it when the application shuts down.

#### Scenario: Connected after startup
- **WHEN** the application has started
- **THEN** a query against the database succeeds

#### Scenario: Closed on shutdown
- **WHEN** the application shuts down
- **THEN** the database connection is closed

### Requirement: A stored refresh token keeps only a hash
The system SHALL store a refresh token as a hash together with the user it belongs to and the moment it expires, never as the token itself, and SHALL remove a user's refresh tokens when the user is removed.

#### Scenario: Only a hash is stored
- **WHEN** a refresh token is issued and stored
- **THEN** the stored record does not contain the token
- **AND** it records which user it belongs to and when it expires

#### Scenario: Removed with its user
- **GIVEN** a user with a stored refresh token
- **WHEN** the user is deleted
- **THEN** the refresh token is gone too

### Requirement: Two people have at most one direct conversation
The system SHALL store a direct conversation once for a pair of people, identified by the pair itself rather than by who wrote first, SHALL reject a second direct conversation for the same two people in either order, and SHALL remove a conversation's messages and membership when the conversation goes.

#### Scenario: One direct conversation per pair
- **GIVEN** a direct conversation between A and B
- **WHEN** a second direct conversation is written for B and A
- **THEN** the write fails

#### Scenario: A message belongs to a conversation and a sender
- **WHEN** a message is stored
- **THEN** it records which conversation it is in, who sent it, and when it arrived

#### Scenario: Messages go with their conversation
- **GIVEN** a conversation holding a message
- **WHEN** the conversation is deleted
- **THEN** the message is gone too

### Requirement: A conversation records when it was last spoken in
The system SHALL store on each conversation the moment of its most recent message, updated as part of storing that message, so that conversations can be ordered without reading their messages.

#### Scenario: Storing a message records the moment
- **GIVEN** a conversation with no messages
- **WHEN** a message is stored in it
- **THEN** the conversation records that moment

#### Scenario: A later message replaces the moment
- **GIVEN** a conversation whose last message was stored earlier
- **WHEN** another message is stored in it
- **THEN** the conversation records the later moment

### Requirement: Each person holds their side of a relation
The system SHALL store a relation between two people as two records, one held by each of them and naming the other, SHALL reject a second record held by the same person about the same other person, SHALL write and remove the two records together so that they always agree on the state of the relation, and SHALL record on each side whether that person asked and whether that person blocked.

#### Scenario: One record per side
- **GIVEN** a record held by A about B
- **WHEN** a second record held by A about B is written
- **THEN** the write fails

#### Scenario: Who asked is kept
- **WHEN** A asks B to be friends
- **THEN** A's record says A asked, and B's record says B did not

#### Scenario: Both sides change together
- **WHEN** A asks B, B agrees, and A blocks B
- **THEN** after each step A's record and B's record hold the same status, and only A's record says it blocked

#### Scenario: Removed with either person
- **GIVEN** A and B are friends
- **WHEN** A is deleted
- **THEN** neither record remains
