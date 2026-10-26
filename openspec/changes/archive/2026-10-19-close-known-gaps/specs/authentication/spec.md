# Spec Delta

## ADDED Requirements

### Requirement: Expired tokens leave as new ones arrive
The API SHALL delete a user's expired refresh tokens when it issues them a new one, and SHALL keep tokens that have been used but have not expired, because presenting one of those is evidence of theft rather than ordinary traffic.

#### Scenario: Expired tokens are cleared
- **GIVEN** a user with an expired refresh token stored
- **WHEN** that user signs in
- **THEN** the expired token is no longer stored

#### Scenario: A spent token is kept while it is still young
- **GIVEN** a user with a refresh token that was used but has not expired
- **WHEN** that user signs in
- **THEN** the used token is still stored

#### Scenario: Another person's tokens are untouched
- **GIVEN** two users, each with an expired refresh token
- **WHEN** one of them signs in
- **THEN** the other's expired token is still stored
