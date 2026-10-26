# friendships Specification

## Purpose
Covers who is connected to whom: finding one person by their exact name and no other way, asking to be friends and agreeing, ending any relation, and blocking somebody so completely that they cannot tell a block from a name nobody holds.

## Requirements

### Requirement: A person is found by their exact username
The API SHALL answer `GET /users/:username` with that person's id, username and display name when the username matches exactly, ignoring case, and SHALL answer 404 otherwise, offering no way to search for or list people.

#### Scenario: Person found
- **GIVEN** an account with the username `cher`
- **WHEN** a signed-in client requests `GET /users/cher`
- **THEN** the response status is 200
- **AND** the body contains the id, username and display name

#### Scenario: Nothing private is returned
- **GIVEN** an account with the username `cher`
- **WHEN** a signed-in client requests `GET /users/cher`
- **THEN** the body contains no email and nothing derived from the password

#### Scenario: Case does not matter
- **GIVEN** an account with the username `cher`
- **WHEN** a signed-in client requests `GET /users/CHER`
- **THEN** the response status is 200

#### Scenario: Nobody by that name
- **WHEN** a signed-in client requests a username nobody has
- **THEN** the response status is 404

### Requirement: Asking to be friends
The API SHALL answer `POST /friends/:username` by recording a request from the signed-in user to that person, SHALL store one record per pair whichever way round it was asked, SHALL treat asking somebody whose request is already pending as accepting it, and SHALL refuse a request to oneself.

#### Scenario: Request recorded
- **GIVEN** accounts `cher` and `dionne`
- **WHEN** `cher` asks to be friends with `dionne`
- **THEN** the response status is 201
- **AND** the relation is pending

#### Scenario: Asking back agrees
- **GIVEN** `dionne` has asked to be friends with `cher`
- **WHEN** `cher` asks to be friends with `dionne`
- **THEN** the response status is 200
- **AND** the two are friends

#### Scenario: Asking twice changes nothing
- **GIVEN** `cher` has asked to be friends with `dionne`
- **WHEN** `cher` asks again
- **THEN** the relation is still a single pending request

#### Scenario: Nobody befriends themselves
- **WHEN** `cher` asks to be friends with `cher`
- **THEN** the response status is 400

### Requirement: Requests waiting for you are listed
The API SHALL answer `GET /friends/requests` with the pending requests addressed to the signed-in user, and SHALL leave out the ones they sent themselves.

#### Scenario: Incoming request listed
- **GIVEN** `dionne` has asked to be friends with `cher`
- **WHEN** `cher` lists the requests waiting
- **THEN** the response contains one entry
- **AND** it names `dionne`

#### Scenario: Your own asking is not waiting for you
- **GIVEN** `cher` has asked to be friends with `dionne`
- **WHEN** `cher` lists the requests waiting
- **THEN** the response contains no entries

### Requirement: Agreeing to be friends
The API SHALL answer `POST /friends/:username/accept` by making the two people friends when the signed-in user is the one the request was addressed to, and SHALL refuse when they are not.

#### Scenario: Request accepted
- **GIVEN** `dionne` has asked to be friends with `cher`
- **WHEN** `cher` accepts
- **THEN** the response status is 200
- **AND** the two are friends

#### Scenario: The asker cannot accept their own request
- **GIVEN** `cher` has asked to be friends with `dionne`
- **WHEN** `cher` accepts
- **THEN** the response status is 404
- **AND** the relation is still pending

### Requirement: Friends are listed
The API SHALL answer `GET /friends` with the people the signed-in user is friends with, describing each as the other person rather than as a record, and SHALL leave out pending and blocked relations.

#### Scenario: Friend listed
- **GIVEN** `cher` and `dionne` are friends
- **WHEN** `cher` lists their friends
- **THEN** the response contains one entry
- **AND** it names `dionne`

#### Scenario: A pending request is not a friend
- **GIVEN** `cher` has asked to be friends with `dionne`
- **WHEN** `cher` lists their friends
- **THEN** the response contains no entries

### Requirement: Any relation can be removed
The API SHALL answer `DELETE /friends/:username` by removing whatever relation exists between the two people, whether a pending request or a friendship, so that declining, cancelling and unfriending all reach the same state.

#### Scenario: Friendship ended
- **GIVEN** `cher` and `dionne` are friends
- **WHEN** `cher` removes the relation
- **THEN** the response status is 200
- **AND** neither lists the other as a friend

#### Scenario: Request declined
- **GIVEN** `dionne` has asked to be friends with `cher`
- **WHEN** `cher` removes the relation
- **THEN** no request is waiting for `cher`
- **AND** `dionne` can ask again

#### Scenario: Nothing to remove
- **GIVEN** `cher` and `dionne` have no relation
- **WHEN** `cher` removes the relation
- **THEN** the response status is 404

### Requirement: A blocked person cannot reach you
The API SHALL answer `POST /friends/:username/block` by blocking that person, which SHALL end any friendship or request between them, SHALL refuse any further request from them, and SHALL hide the blocker's wardrobe from them. Only the person who blocked SHALL be able to remove the block, and removing it SHALL leave no relation at all.

#### Scenario: Blocking ends a friendship
- **GIVEN** `cher` and `dionne` are friends
- **WHEN** `cher` blocks `dionne`
- **THEN** the response status is 200
- **AND** neither lists the other as a friend

#### Scenario: A blocked person cannot ask again
- **GIVEN** `cher` has blocked `dionne`
- **WHEN** `dionne` asks to be friends with `cher`
- **THEN** no request is waiting for `cher`

#### Scenario: Only the blocker can lift the block
- **GIVEN** `cher` has blocked `dionne`
- **WHEN** `dionne` removes the relation
- **THEN** the block is still in place

#### Scenario: Unblocking leaves nothing behind
- **GIVEN** `cher` has blocked `dionne`
- **WHEN** `cher` removes the relation
- **THEN** no relation exists between them
- **AND** `dionne` can ask to be friends again
