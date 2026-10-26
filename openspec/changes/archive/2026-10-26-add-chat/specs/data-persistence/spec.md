# Spec Delta

## ADDED Requirements

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
