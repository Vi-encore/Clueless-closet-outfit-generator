# Spec Delta

## ADDED Requirements

### Requirement: A session starts and ends on the client
The client SHALL exchange an email and password for an access token, SHALL keep that token in memory and nowhere a page script can read it later, SHALL show the application once it has one, SHALL say so without a token when the credentials are refused, and SHALL end the session by telling the API and forgetting the token.

#### Scenario: The right password gets in
- **WHEN** a person signs in with credentials the API accepts
- **THEN** the application is shown

#### Scenario: The wrong password says so
- **WHEN** a person signs in with credentials the API refuses
- **THEN** a message is shown
- **AND** the application is not shown

#### Scenario: The token is not written down
- **GIVEN** a person who has signed in
- **WHEN** the browser's storage is examined
- **THEN** it holds no access token

#### Scenario: Signing out tells the API and forgets the token
- **GIVEN** a person who has signed in
- **WHEN** they sign out
- **THEN** the API was asked to end the session
- **AND** the sign-in screen is shown

### Requirement: A reload does not ask for the password again
The client SHALL try to refresh its access token when it starts, SHALL show the application when that succeeds, SHALL show the sign-in screen when it fails, and SHALL show neither until the answer arrives, so that a reload neither loses the session nor flashes a sign-in screen at somebody who is signed in.

#### Scenario: The session comes back
- **GIVEN** a refresh cookie the API still accepts
- **WHEN** the application starts
- **THEN** the application is shown without a password being typed

#### Scenario: A refusal asks for the password
- **GIVEN** a refresh cookie the API no longer accepts
- **WHEN** the application starts
- **THEN** the sign-in screen is shown

#### Scenario: Nothing is decided while it is being asked
- **GIVEN** a refresh that has not answered yet
- **WHEN** the application starts
- **THEN** neither the application nor the sign-in screen is shown

### Requirement: An expired token is renewed out of sight
The client SHALL answer a 401 by refreshing once and sending the request again, SHALL end the session when the refresh is refused, and SHALL refresh only once however many requests are waiting, so that a quarter of an hour of use does not interrupt itself.

#### Scenario: The request succeeds after a renewal
- **GIVEN** an access token the API has stopped accepting
- **WHEN** the client asks for something
- **THEN** the caller receives the answer
- **AND** the request was sent twice

#### Scenario: A refused renewal ends the session
- **GIVEN** an access token the API has stopped accepting
- **AND** a refresh the API refuses
- **WHEN** the client asks for something
- **THEN** the sign-in screen is shown

#### Scenario: Several waiting requests cause one renewal
- **GIVEN** an access token the API has stopped accepting
- **WHEN** the client asks for three things at once
- **THEN** the API was asked to refresh once
