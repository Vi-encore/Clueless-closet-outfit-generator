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

### Requirement: Each person's block is their own
The API SHALL record a block separately for each of the two people, SHALL let only the person who placed a block lift it, SHALL keep the other person's block when one is lifted, and SHALL show a person only the blocks they placed themselves.

#### Scenario: Two people can block each other
- **GIVEN** `cher` has blocked `tai`
- **WHEN** `tai` blocks `cher`
- **THEN** each of them lists the other as blocked

#### Scenario: A block cannot be lifted from under it
- **GIVEN** `cher` has blocked `tai`
- **WHEN** `tai` removes the relation
- **THEN** the response status is 404
- **AND** `cher` still has `tai` blocked

#### Scenario: Blocking back does not take a block over
- **GIVEN** `cher` and `tai` have blocked each other
- **WHEN** `tai` lifts their block
- **THEN** `tai` lists nobody as blocked
- **AND** `cher` still has `tai` blocked
- **AND** `tai` asking `cher` to be friends is answered with 404

#### Scenario: Lifting both leaves nothing between them
- **GIVEN** `cher` and `tai` have blocked each other
- **WHEN** both lift their blocks
- **THEN** no relation remains
- **AND** either can ask the other to be friends
