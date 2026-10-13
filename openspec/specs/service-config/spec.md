# service-config Specification

## Purpose
Defines how the API reads its settings from environment variables and refuses to run when a setting is invalid.

## Requirements

### Requirement: Settings from the environment
The API SHALL read its port from the `PORT` environment variable, its environment name from `NODE_ENV` and its database connection string from `DATABASE_URL`, using port 3000 and the environment `development` when they are not set. `DATABASE_URL` has no default and SHALL be a PostgreSQL connection string.

#### Scenario: Defaults
- **GIVEN** neither `PORT` nor `NODE_ENV` is set
- **WHEN** the API configuration is loaded
- **THEN** the port is 3000
- **AND** the environment is `development`

#### Scenario: Port from the environment
- **GIVEN** `PORT` is `4000`
- **WHEN** the API configuration is loaded
- **THEN** the port is the number 4000

#### Scenario: Database connection string missing
- **GIVEN** `DATABASE_URL` is not set
- **WHEN** the API starts
- **THEN** startup fails
- **AND** the error names `DATABASE_URL`

#### Scenario: Database connection string malformed
- **GIVEN** `DATABASE_URL` is `localhost:5432`
- **WHEN** the API starts
- **THEN** startup fails
- **AND** the error names `DATABASE_URL`

### Requirement: Invalid settings stop startup
The API SHALL refuse to start when a setting has an invalid value, with an error that names the setting.

#### Scenario: Port is not a number
- **GIVEN** `PORT` is `abc`
- **WHEN** the API starts
- **THEN** startup fails
- **AND** the error names `PORT`

#### Scenario: Unknown environment name
- **GIVEN** `NODE_ENV` is `staging`
- **WHEN** the API starts
- **THEN** startup fails
- **AND** the error names `NODE_ENV`

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
