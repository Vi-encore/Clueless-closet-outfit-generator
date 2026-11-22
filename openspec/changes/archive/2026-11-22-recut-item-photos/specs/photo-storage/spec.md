# Spec Delta

## MODIFIED Requirements

### Requirement: A browser may upload to the bucket
The system SHALL provide a script that sets the bucket's CORS rules from the configured origins, allowing exactly what a browser needs to upload a photograph through a presigned URL and to read one back, and SHALL refuse to run with no origins configured, so that a deployment cannot end up with a bucket that silently refuses every browser.

#### Scenario: The rules name the configured origins
- **GIVEN** two configured origins
- **WHEN** the rules are built
- **THEN** they allow both origins and no others

#### Scenario: Only an upload is allowed
- **WHEN** the rules are built
- **THEN** they allow `PUT` with a `Content-Type` header, and `GET` to read a photograph back
- **AND** they allow no other method

#### Scenario: No origins is refused
- **GIVEN** no configured origins
- **WHEN** the rules are built
- **THEN** building them fails
