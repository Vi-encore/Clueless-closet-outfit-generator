# Spec Delta

## ADDED Requirements

### Requirement: A browser may upload to the bucket
The system SHALL provide a script that sets the bucket's CORS rules from the configured origins, allowing exactly what a browser's presigned upload needs, and SHALL refuse to run with no origins configured, so that a deployment cannot end up with a bucket that silently refuses every browser.

#### Scenario: The rules name the configured origins
- **GIVEN** two configured origins
- **WHEN** the rules are built
- **THEN** they allow both origins and no others

#### Scenario: Only an upload is allowed
- **WHEN** the rules are built
- **THEN** they allow `PUT` with a `Content-Type` header
- **AND** they allow no other method

#### Scenario: No origins is refused
- **GIVEN** no configured origins
- **WHEN** the rules are built
- **THEN** building them fails

### Requirement: An upload URL asks for nothing a browser cannot send
The API SHALL issue upload URLs that carry no checksum of their own, since a checksum computed when the URL is signed describes a body that does not exist yet.

#### Scenario: No checksum in the URL
- **WHEN** a client asks for an upload URL
- **THEN** the URL carries no checksum parameter
