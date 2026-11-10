# web-feature-flags Specification

## Purpose
Covers how the client reads the feature flags a deployment set, and what it does before they arrive or when they cannot be read.

## Requirements

### Requirement: The client follows the deployment's flags
The client SHALL ask the API for the flags and SHALL treat a flag as the API answered it, and SHALL use the flag's default from the shared vocabulary while there is no answer or when the flags cannot be read, so that a missing answer never breaks a screen.

#### Scenario: A flag switched off is followed
- **GIVEN** an API that answers `photoCutout` as off
- **WHEN** a screen asks for `photoCutout`
- **THEN** it is told the flag is off

#### Scenario: No answer means the default
- **GIVEN** an API that cannot answer the flags
- **WHEN** a screen asks for `photoCutout`
- **THEN** it is told the flag's default, on
