## ADDED Requirements

### Requirement: Nobody has a conversation with themselves
The API SHALL answer 404 to `GET /conversations/with/:username/messages` and `POST /conversations/with/:username/read` when the username is the signed-in user's own, and the gateway SHALL refuse `message:send` addressed to the sender's own username with the words it gives a stranger, storing nothing.

#### Scenario: Your own history is not found
- **GIVEN** `cher` is signed in
- **WHEN** `cher` reads the history with `cher`
- **THEN** the response status is 404

#### Scenario: Your own conversation is not marked read
- **GIVEN** `cher` is signed in
- **WHEN** `cher` marks the conversation with `cher` as read
- **THEN** the response status is 404

#### Scenario: A message to yourself is refused
- **GIVEN** `cher` is connected
- **WHEN** `cher` sends a message to `cher`
- **THEN** the message is refused with the words a stranger gets
- **AND** nothing is stored
