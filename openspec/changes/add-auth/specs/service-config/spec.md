# Spec Delta

## ADDED Requirements

### Requirement: Token settings
The API SHALL read its token signing secret from `JWT_SECRET`, which has no default and SHALL be at least 32 characters long, and the two token lifetimes from `ACCESS_TOKEN_TTL` and `REFRESH_TOKEN_TTL`, using 15 minutes and 30 days when they are not set.

#### Scenario: Lifetimes default
- **GIVEN** neither `ACCESS_TOKEN_TTL` nor `REFRESH_TOKEN_TTL` is set
- **WHEN** the API configuration is loaded
- **THEN** the access token lifetime is 15 minutes
- **AND** the refresh token lifetime is 30 days

#### Scenario: Secret missing
- **GIVEN** `JWT_SECRET` is not set
- **WHEN** the API starts
- **THEN** startup fails
- **AND** the error names `JWT_SECRET`

#### Scenario: Secret too short
- **GIVEN** `JWT_SECRET` is `short`
- **WHEN** the API starts
- **THEN** startup fails
- **AND** the error names `JWT_SECRET`
