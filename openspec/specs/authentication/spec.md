# authentication Specification

## Purpose
Covers proving who you are with a password once, and then staying signed in with tokens, so that a request can be attributed to a person without the password travelling again.

## Requirements

### Requirement: Sign-in issues a token pair
The API SHALL answer `POST /auth/sign-in` with correct credentials by returning status 200, an access token in the body and a refresh token in an `httpOnly` cookie, and SHALL answer wrong credentials with status 401 and the same message whether or not the email is registered.

#### Scenario: Correct credentials
- **WHEN** a registered user signs in with the right password
- **THEN** the response status is 200
- **AND** the body contains an access token
- **AND** the response sets an `httpOnly` refresh token cookie

#### Scenario: Wrong password
- **WHEN** a registered user signs in with the wrong password
- **THEN** the response status is 401

#### Scenario: Unknown email tells nothing extra
- **WHEN** a client signs in with an email nobody registered
- **THEN** the response status is 401
- **AND** the body is identical to the one returned for a wrong password

### Requirement: A protected route needs a valid access token
The API SHALL reject a request to a protected route with status 401 when its access token is missing, malformed or expired, and SHALL otherwise run the handler with the signed-in user available to it.

#### Scenario: Token missing
- **WHEN** a client requests `GET /auth/me` without an `Authorization` header
- **THEN** the response status is 401

#### Scenario: Token tampered with
- **WHEN** a client requests `GET /auth/me` with an access token whose signature does not match
- **THEN** the response status is 401

#### Scenario: Token expired
- **WHEN** a client requests `GET /auth/me` with an access token that has expired
- **THEN** the response status is 401

#### Scenario: Signed-in user reaches the handler
- **WHEN** a signed-in client requests `GET /auth/me`
- **THEN** the response status is 200
- **AND** the body is the signed-in user's id, email and username

### Requirement: A refresh token can be exchanged for a new pair
The API SHALL answer `POST /auth/refresh` with a valid refresh token, taken from the cookie or from the request body, by returning a new access token and a new refresh token, and SHALL make the refresh token it was given stop working.

#### Scenario: Pair exchanged
- **WHEN** a signed-in client refreshes with its refresh token
- **THEN** the response status is 200
- **AND** the body contains a new access token
- **AND** the response sets a new refresh token cookie

#### Scenario: The used token stops working
- **GIVEN** a client that has refreshed once
- **WHEN** it refreshes again with the token it already used
- **THEN** the response status is 401

#### Scenario: Refresh token from the request body
- **WHEN** a client refreshes by sending the refresh token in the request body instead of a cookie
- **THEN** the response status is 200

#### Scenario: Unknown refresh token
- **WHEN** a client refreshes with a token that was never issued
- **THEN** the response status is 401

### Requirement: Access tokens can be verified without an HTTP request
The system SHALL expose verification of an access token as a service method that takes the token and returns the user it identifies, so that a caller outside the HTTP layer can authenticate a connection.

#### Scenario: Valid token resolves to its user
- **WHEN** a valid access token is passed to the verification method
- **THEN** it returns the user that token was issued for

#### Scenario: Invalid token is refused
- **WHEN** a token with a broken signature is passed to the verification method
- **THEN** it rejects the token
