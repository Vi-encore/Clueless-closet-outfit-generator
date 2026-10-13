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
