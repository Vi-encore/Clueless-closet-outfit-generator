## MODIFIED Requirements

### Requirement: History is read a page at a time
The API SHALL answer `GET /conversations/with/:username/messages` with the conversation's messages newest first, in pages with a cursor, and SHALL answer 404 when the signed-in user may not read it: they are not friends with that person and have no conversation with them, or that person has blocked them.

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

### Requirement: A conversation can be marked as read
The API SHALL answer `POST /conversations/with/:username/read` by recording the moment for the signed-in user alone, and SHALL answer 404 when they may not read the history with that person.

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

## ADDED Requirements

### Requirement: A conversation stays readable when a friendship ends
The API SHALL go on showing a conversation's history to both people after either of them removes the other as a friend, and the gateway SHALL refuse a message from either of them until they are friends again.

#### Scenario: A former friend can still read it
- **GIVEN** `cher` and `dionne` have spoken and `cher` has removed `dionne` as a friend
- **WHEN** `dionne` reads the history
- **THEN** the response contains the messages

#### Scenario: A former friend cannot write in it
- **GIVEN** `cher` and `dionne` have spoken and `cher` has removed `dionne` as a friend
- **WHEN** `cher` sends a message to `dionne`
- **THEN** the message is refused

### Requirement: Only conversations that open are listed
The API SHALL list in `GET /conversations` only the conversations whose history the signed-in user may read, and SHALL leave out the others without deleting them.

#### Scenario: The person blocked does not see it
- **GIVEN** `cher` and `dionne` have spoken and `dionne` has blocked `cher`
- **WHEN** `cher` lists their conversations
- **THEN** the response contains no entries

#### Scenario: Whoever blocked still sees it
- **GIVEN** `cher` and `dionne` have spoken and `dionne` has blocked `cher`
- **WHEN** `dionne` lists their conversations
- **THEN** the response contains one entry naming `cher`

#### Scenario: A former friend's conversation stays listed
- **GIVEN** `cher` and `dionne` have spoken and `cher` has removed `dionne` as a friend
- **WHEN** `cher` lists their conversations
- **THEN** the response contains one entry naming `dionne`
