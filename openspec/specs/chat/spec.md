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

### Requirement: Conversations are listed by when they were last spoken in
The API SHALL order `GET /conversations` by the moment each conversation last received a message, newest first, so that the list a person opens is the one they are most likely to want.

#### Scenario: The most recent conversation is first
- **GIVEN** `cher` has conversations with `dionne` and with `tai`
- **AND** the message to `tai` came after the message to `dionne`
- **WHEN** `cher` lists their conversations
- **THEN** `tai` is first

#### Scenario: A new message moves a conversation up
- **GIVEN** `cher`'s conversation with `dionne` is below the one with `tai`
- **WHEN** `dionne` sends `cher` a message
- **THEN** `dionne` is first

### Requirement: A browser from a known origin may open a socket
The API SHALL answer a socket handshake from an origin named in its configuration with the headers a browser needs, SHALL allow credentials, and SHALL not allow any other origin, by the same list `enableCors` uses.

#### Scenario: A known origin may connect
- **WHEN** a socket handshake arrives carrying an `Origin` the configuration names
- **THEN** the response allows that origin

#### Scenario: An unknown origin may not
- **WHEN** a socket handshake arrives carrying an `Origin` the configuration does not name
- **THEN** the response does not allow that origin

### Requirement: Unread messages are counted
The API SHALL answer `GET /conversations` with, for each conversation, how many messages from the other person arrived after the signed-in user last read it.

#### Scenario: New messages are unread
- **GIVEN** `dionne` has sent `cher` two messages
- **WHEN** `cher` lists their conversations
- **THEN** the entry for `dionne` says two are unread

#### Scenario: Your own messages are not unread
- **GIVEN** `cher` has sent `dionne` a message
- **WHEN** `cher` lists their conversations
- **THEN** the entry for `dionne` says none are unread

### Requirement: A conversation can be marked as read
The API SHALL answer `POST /conversations/with/:username/read` by recording the moment for the signed-in user alone, and SHALL answer 404 when they are not friends with that person.

#### Scenario: Reading clears the count
- **GIVEN** `dionne` has sent `cher` a message
- **WHEN** `cher` marks the conversation as read
- **THEN** the entry for `dionne` says none are unread

#### Scenario: A later message is unread again
- **GIVEN** `cher` has marked the conversation with `dionne` as read
- **WHEN** `dionne` sends another message
- **THEN** the entry for `dionne` says one is unread

#### Scenario: Reading is one person's
- **GIVEN** `cher` and `dionne` have each sent a message
- **WHEN** `cher` marks the conversation as read
- **THEN** `dionne` still has one unread

#### Scenario: A stranger marks nothing
- **GIVEN** `cher` and `dionne` are not friends
- **WHEN** `cher` marks the conversation as read
- **THEN** the response status is 404

### Requirement: Typing reaches a friend and goes no further
The gateway SHALL relay `typing` to the friend it is addressed to, SHALL store nothing, and SHALL relay nothing to somebody who is not a friend.

#### Scenario: A friend sees it
- **GIVEN** `cher` and `dionne` are friends and both connected
- **WHEN** `cher` says they are typing to `dionne`
- **THEN** `dionne` is told who is typing

#### Scenario: A stranger hears nothing
- **GIVEN** `cher` and `dionne` are not friends
- **WHEN** `cher` says they are typing to `dionne`
- **THEN** `dionne` is told nothing

### Requirement: A conversation stays with whoever blocked
The API SHALL go on showing a conversation's history to a person who blocked the other, SHALL answer the person blocked with 404 as it always has, and SHALL refuse a message from either of them.

#### Scenario: The person who blocked can still read it
- **GIVEN** `cher` and `dionne` have spoken and `cher` has blocked `dionne`
- **WHEN** `cher` reads the history
- **THEN** the response contains the messages

#### Scenario: The person blocked reads nothing
- **GIVEN** `cher` and `dionne` have spoken and `cher` has blocked `dionne`
- **WHEN** `dionne` reads the history
- **THEN** the response status is 404

#### Scenario: Nobody can write in it
- **GIVEN** `cher` has blocked `dionne`
- **WHEN** `cher` sends a message to `dionne`
- **THEN** the message is refused
