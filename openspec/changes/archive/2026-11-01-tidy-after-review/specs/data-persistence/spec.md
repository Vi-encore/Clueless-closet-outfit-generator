# Spec Delta

## ADDED Requirements

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
