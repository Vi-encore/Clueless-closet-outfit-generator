# Spec Delta

## ADDED Requirements

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
