## ADDED Requirements

### Requirement: A conversation with yourself is not found
The client SHALL show the not-found window for a conversation addressed to the signed-in person's own username, and SHALL ask the API nothing about it.

#### Scenario: Your own address is not found
- **GIVEN** `cher` is signed in
- **WHEN** `/chat/cher` is opened
- **THEN** the not-found window is shown
- **AND** there is no field to write in
- **AND** no history is asked for
