# Spec Delta

## ADDED Requirements

### Requirement: A stored refresh token keeps only a hash
The system SHALL store a refresh token as a hash together with the user it belongs to and the moment it expires, never as the token itself, and SHALL remove a user's refresh tokens when the user is removed.

#### Scenario: Only a hash is stored
- **WHEN** a refresh token is issued and stored
- **THEN** the stored record does not contain the token
- **AND** it records which user it belongs to and when it expires

#### Scenario: Removed with its user
- **GIVEN** a user with a stored refresh token
- **WHEN** the user is deleted
- **THEN** the refresh token is gone too
