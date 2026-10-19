# user-accounts Specification

## Purpose
Covers creating an account and holding its password in a way that stays safe even if the database is read by someone who should not have it.

## Requirements

### Requirement: Sign-up creates an account
The API SHALL answer `POST /auth/sign-up` with an email, a username and a password by creating the account and returning status 201 with the new user's id, email, username and display name.

#### Scenario: Account created
- **WHEN** a client signs up with an unused email and username
- **THEN** the response status is 201
- **AND** the body contains the new user's id, email and username

#### Scenario: Email already registered
- **GIVEN** an account with the email `cher@example.com`
- **WHEN** a client signs up with that email
- **THEN** the response status is 409

#### Scenario: Username already taken
- **GIVEN** an account with the username `cher`
- **WHEN** a client signs up with that username
- **THEN** the response status is 409

#### Scenario: Password too short
- **WHEN** a client signs up with a password of fewer than 10 characters
- **THEN** the response status is 400
- **AND** `errors` contains an entry with the path `password`

### Requirement: A password is never stored or returned in the clear
The API SHALL store a password only as an argon2 hash, and SHALL never include the password or its hash in any response.

#### Scenario: Password stored as an argon2 hash
- **WHEN** an account is created
- **THEN** the stored record holds neither the password nor anything derived from it by a reversible transformation
- **AND** the stored hash identifies itself as argon2

#### Scenario: Nothing leaks through the response
- **WHEN** an account is created
- **THEN** the response body contains no password and no hash

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
