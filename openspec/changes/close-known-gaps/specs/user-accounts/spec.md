# Spec Delta

## ADDED Requirements

### Requirement: An email is one address whatever its case
The API SHALL lowercase and trim an email before storing it or looking it up, so that an address differing only in case or surrounding spaces is the same account at sign-up and at sign-in.

#### Scenario: Case does not make a second account
- **GIVEN** an account registered as `cher@example.com`
- **WHEN** a client signs up with `Cher@Example.COM`
- **THEN** the response status is 409

#### Scenario: Signing in ignores case
- **GIVEN** an account registered as `cher@example.com`
- **WHEN** a client signs in as `CHER@example.com` with the right password
- **THEN** the response status is 200

#### Scenario: Surrounding spaces are trimmed
- **WHEN** a client signs up with an email padded with spaces
- **THEN** the response status is 201
- **AND** the stored address has no spaces

#### Scenario: Something that is not an address is still refused
- **WHEN** a client signs up with `not-an-email`
- **THEN** the response status is 400
