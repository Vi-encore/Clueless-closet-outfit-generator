# Spec Delta

## ADDED Requirements

### Requirement: Signing out ends the session
The API SHALL answer `POST /auth/sign-out` by clearing the refresh cookie and making the refresh token it carried stop working, SHALL leave that person's other sessions alone, and SHALL answer the same way when there is no session to end, so that a client can always reach a signed-out state.

#### Scenario: The cookie is cleared
- **GIVEN** a signed-in client
- **WHEN** it signs out
- **THEN** the response clears the refresh token cookie

#### Scenario: The refresh token stops working
- **GIVEN** a client that has signed out
- **WHEN** it refreshes with the token it had
- **THEN** the response status is 401

#### Scenario: Signing out twice is not an error
- **GIVEN** a client with no refresh cookie
- **WHEN** it signs out
- **THEN** the response status is 204

#### Scenario: Another session survives
- **GIVEN** the same person signed in from two clients
- **WHEN** one of them signs out
- **THEN** the other can still refresh

### Requirement: The refresh cookie can reach a client on another origin
The API SHALL take the refresh cookie's `SameSite` attribute from its configuration, and SHALL send the cookie as `Secure` whenever that attribute is `none`, so that a client served from a different origin than the API can still refresh while a client served from the same origin keeps the stricter default.

#### Scenario: The configured attribute is used
- **GIVEN** the configuration says the cookie is `none`
- **WHEN** a client signs in
- **THEN** the refresh cookie says `SameSite=None`
- **AND** the refresh cookie is marked `Secure`

#### Scenario: The strict default is kept
- **GIVEN** the configuration says nothing about the attribute
- **WHEN** a client signs in
- **THEN** the refresh cookie says `SameSite=Lax`
