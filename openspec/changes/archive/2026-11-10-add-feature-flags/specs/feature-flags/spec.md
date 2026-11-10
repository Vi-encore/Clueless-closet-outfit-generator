# Spec Delta

## Purpose

Covers the switches a deployment can turn on and off without changing code: which flags exist and their defaults, how the API decides each flag's value from its settings, and how anybody can read them.

## ADDED Requirements

### Requirement: Flags are one vocabulary with defaults
The system SHALL define every feature flag once, by name and default value, in the shared core package, so that the API and the client read the same list.

#### Scenario: The cut-out flag exists
- **WHEN** the vocabulary is read
- **THEN** it has a flag named `photoCutout`
- **AND** its default is on

### Requirement: A deployment switches flags in its settings
The API SHALL take each flag's default, SHALL turn on the flags its settings list in `FEATURES_ON` and turn off those listed in `FEATURES_OFF`, and SHALL refuse to start when either list names a flag that does not exist, or when one flag is in both.

#### Scenario: Nothing set means the defaults
- **GIVEN** neither `FEATURES_ON` nor `FEATURES_OFF` is set
- **WHEN** the API starts
- **THEN** every flag has its default value

#### Scenario: A flag is switched off
- **GIVEN** `FEATURES_OFF` is `photoCutout`
- **WHEN** the API starts
- **THEN** `photoCutout` is off

#### Scenario: An unknown flag stops startup
- **GIVEN** `FEATURES_OFF` names a flag that does not exist
- **WHEN** the API starts
- **THEN** it refuses to start
- **AND** the error names the setting

#### Scenario: A flag in both lists stops startup
- **GIVEN** `photoCutout` is in both `FEATURES_ON` and `FEATURES_OFF`
- **WHEN** the API starts
- **THEN** it refuses to start

### Requirement: The flags can be read by anybody
The API SHALL answer `GET /flags` without authentication, with every flag and its value, so that the client can follow them before anybody has signed in.

#### Scenario: The flags are answered
- **GIVEN** `FEATURES_OFF` is `photoCutout`
- **WHEN** `GET /flags` is called without a token
- **THEN** the response status is 200
- **AND** the body is an object with `photoCutout` set to `false`
