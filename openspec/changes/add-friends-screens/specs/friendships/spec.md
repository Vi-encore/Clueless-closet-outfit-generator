# Spec Delta

## ADDED Requirements

### Requirement: Requests you sent are listed
The API SHALL answer `GET /friends/requests/sent` with the requests the signed-in user made that have not been answered, and with nobody else's.

#### Scenario: A sent request is listed
- **GIVEN** `cher` has asked `dionne` to be friends
- **WHEN** `cher` lists the requests they sent
- **THEN** the response contains `dionne`

#### Scenario: A request waiting for you is not one you sent
- **GIVEN** `cher` has asked `dionne` to be friends
- **WHEN** `dionne` lists the requests they sent
- **THEN** the response is empty

#### Scenario: An answered request leaves the list
- **GIVEN** `dionne` has accepted a request from `cher`
- **WHEN** `cher` lists the requests they sent
- **THEN** the response is empty

### Requirement: People you blocked are listed
The API SHALL answer `GET /friends/blocked` with the people the signed-in user has blocked, and SHALL leave out anybody who has blocked them, so that a block can be undone without a block ever announcing itself.

#### Scenario: A block is listed
- **GIVEN** `cher` has blocked `tai`
- **WHEN** `cher` lists the people they blocked
- **THEN** the response contains `tai`

#### Scenario: Being blocked is not listed
- **GIVEN** `cher` has blocked `tai`
- **WHEN** `tai` lists the people they blocked
- **THEN** the response is empty
