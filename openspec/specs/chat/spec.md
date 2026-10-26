# chat Specification

## Purpose
Covers messages between friends, live and afterwards: a socket that says who it is before it is accepted, a message that arrives at both people and is stored once however often it is sent, the history that can be read back a page at a time, and the catching up a client does when a dropped connection comes back.

## Requirements

### Requirement: A connection says who it is at the handshake
The gateway SHALL take an access token from the connection's `auth` payload, SHALL accept the connection only when the token is valid and belongs to an existing account, and SHALL disconnect it otherwise.

#### Scenario: A valid token connects
- **WHEN** a client connects with a valid access token
- **THEN** the connection is established

#### Scenario: No token is refused
- **WHEN** a client connects with no token
- **THEN** the connection is refused

#### Scenario: A tampered token is refused
- **WHEN** a client connects with a token whose signature does not match
- **THEN** the connection is refused

### Requirement: A message reaches the other person live
The gateway SHALL accept `message:send` addressed to a friend's username, SHALL deliver the message to that person's open connections, and SHALL acknowledge the sender with the stored message.

#### Scenario: The message arrives
- **GIVEN** `cher` and `dionne` are friends and both connected
- **WHEN** `cher` sends a message to `dionne`
- **THEN** `dionne` receives it
- **AND** its body is what `cher` sent

#### Scenario: The sender is acknowledged
- **GIVEN** `cher` and `dionne` are friends and both connected
- **WHEN** `cher` sends a message to `dionne`
- **THEN** the acknowledgement carries the message's id and the moment it was stored

#### Scenario: A conversation that did not exist is reached anyway
- **GIVEN** `cher` and `dionne` are friends with no conversation between them
- **AND** both are already connected
- **WHEN** `cher` sends the first message
- **THEN** `dionne` receives it without reconnecting

### Requirement: A message is stored once however often it is sent
The gateway SHALL store a message under the id its sender generated, and SHALL answer a second send carrying an id already stored with the message that was stored, without writing another.

#### Scenario: The message is stored
- **GIVEN** `cher` and `dionne` are friends
- **WHEN** `cher` sends a message to `dionne`
- **THEN** the message is in the conversation's history

#### Scenario: Sending the same message twice stores one
- **GIVEN** `cher` has sent a message to `dionne`
- **WHEN** `cher` sends it again with the same id
- **THEN** the acknowledgement carries the same message
- **AND** the history holds one message

### Requirement: Only friends may send to each other
The gateway SHALL refuse a message to somebody the sender is not friends with, and SHALL refuse it the same way whether they never were, no longer are, or have been blocked.

#### Scenario: A stranger cannot send
- **GIVEN** `cher` and `dionne` are not friends
- **WHEN** `cher` sends a message to `dionne`
- **THEN** the message is refused
- **AND** nothing is stored

#### Scenario: Blocking stops messages
- **GIVEN** `cher` and `dionne` were friends and `dionne` has blocked `cher`
- **WHEN** `cher` sends a message to `dionne`
- **THEN** the message is refused

### Requirement: History is read a page at a time
The API SHALL answer `GET /conversations/with/:username/messages` with the conversation's messages newest first, in pages with a cursor, and SHALL answer 404 when the signed-in user is not friends with that person.

#### Scenario: Messages come back newest first
- **GIVEN** `cher` has sent three messages to `dionne`
- **WHEN** `cher` reads the history
- **THEN** the response contains three messages
- **AND** the newest is first

#### Scenario: History pages
- **GIVEN** `cher` has sent three messages to `dionne`
- **WHEN** `cher` reads the history with a limit of two
- **THEN** the response contains two messages and a cursor
- **AND** the page after it contains the third

#### Scenario: A stranger reads nothing
- **GIVEN** `cher` and `dionne` are not friends
- **WHEN** `cher` reads the history with `dionne`
- **THEN** the response status is 404

### Requirement: Messages missed while away are fetched
The API SHALL accept `after` on the history route and answer with the messages newer than that one, oldest first, so that a client returning from a dropped connection can catch up without reading what it already has.

#### Scenario: Only what is newer comes back
- **GIVEN** `cher` and `dionne` have exchanged three messages
- **WHEN** `dionne` asks for what is newer than the first
- **THEN** the response contains the other two
- **AND** the oldest of them is first

#### Scenario: Nothing was missed
- **GIVEN** `cher` and `dionne` have exchanged three messages
- **WHEN** `dionne` asks for what is newer than the last
- **THEN** the response contains no messages

### Requirement: Conversations are listed
The API SHALL answer `GET /conversations` with the conversations the signed-in user is in, naming the other person in each, and SHALL leave out people they have no conversation with.

#### Scenario: A conversation appears once there is a message
- **GIVEN** `cher` has sent a message to `dionne`
- **WHEN** `cher` lists their conversations
- **THEN** the response contains one entry naming `dionne`

#### Scenario: A friendship alone is not a conversation
- **GIVEN** `cher` and `dionne` are friends and have said nothing
- **WHEN** `cher` lists their conversations
- **THEN** the response contains no entries
