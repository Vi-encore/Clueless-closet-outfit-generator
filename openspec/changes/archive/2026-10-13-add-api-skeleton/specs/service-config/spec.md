# Spec Delta

## Purpose

Defines how the API reads its settings from environment variables and refuses to run when a setting is invalid.

## ADDED Requirements

### Requirement: Settings from the environment
The API SHALL read its port from the `PORT` environment variable and its environment name from `NODE_ENV`, using port 3000 and the environment `development` when they are not set.

#### Scenario: Defaults
- **GIVEN** neither `PORT` nor `NODE_ENV` is set
- **WHEN** the API configuration is loaded
- **THEN** the port is 3000
- **AND** the environment is `development`

#### Scenario: Port from the environment
- **GIVEN** `PORT` is `4000`
- **WHEN** the API configuration is loaded
- **THEN** the port is the number 4000

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
