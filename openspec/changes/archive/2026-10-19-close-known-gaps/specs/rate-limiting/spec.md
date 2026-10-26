# Spec Delta

## ADDED Requirements

### Requirement: A caller who asks too often is refused
The API SHALL count requests per caller within a window and SHALL answer 429 once the allowance is spent, applying a tighter allowance to the routes that accept a password than to the rest.

#### Scenario: Too many requests are refused
- **GIVEN** an API whose general allowance is two requests per window
- **WHEN** a client makes three requests in that window
- **THEN** the third response status is 429

#### Scenario: Signing in runs out sooner
- **GIVEN** an API whose general allowance is larger than its allowance for passwords
- **WHEN** a client spends the password allowance on `POST /auth/sign-in`
- **THEN** the next sign-in attempt is refused with 429
- **AND** a request to a route that takes no password still succeeds

#### Scenario: Refusing costs nothing to verify
- **GIVEN** a client that has spent the password allowance
- **WHEN** it sends another sign-in with any password
- **THEN** the response status is 429
- **AND** no password is verified
