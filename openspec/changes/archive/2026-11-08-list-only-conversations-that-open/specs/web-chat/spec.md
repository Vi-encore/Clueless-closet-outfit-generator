## ADDED Requirements

### Requirement: A conversation with a former friend is read-only
The client SHALL show a conversation with somebody who is no longer the signed-in person's friend, with its history, SHALL offer no way to write in it, and SHALL say why.

#### Scenario: A former friend's conversation cannot be written in
- **GIVEN** a conversation with somebody who is no longer a friend
- **WHEN** it is opened
- **THEN** its messages are shown
- **AND** a message says why nothing can be written
- **AND** there is no field to write in
