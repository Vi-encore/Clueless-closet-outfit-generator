# Spec Delta

## ADDED Requirements

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
