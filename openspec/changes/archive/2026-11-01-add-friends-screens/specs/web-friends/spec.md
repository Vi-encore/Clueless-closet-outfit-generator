# Spec Delta

## ADDED Requirements

### Requirement: Your friends are listed
The client SHALL show the signed-in person's friends on a screen reached from the desktop, each leading to their wardrobe, and SHALL say so when there are none.

#### Scenario: The desktop opens the friends screen
- **GIVEN** a person who has signed in
- **WHEN** they use the friends shortcut on the desktop
- **THEN** the friends screen is shown

#### Scenario: A friend is named
- **GIVEN** a person with a friend who has a display name
- **WHEN** they open the friends screen
- **THEN** the friend's display name is shown

#### Scenario: A friend without a display name goes by their username
- **GIVEN** a person with a friend who has no display name
- **WHEN** they open the friends screen
- **THEN** the friend's username is shown

#### Scenario: No friends says so
- **GIVEN** a person with no friends
- **WHEN** they open the friends screen
- **THEN** a message is shown instead of a list

### Requirement: A person is asked by their exact username
The client SHALL send a friend request to the exact username typed, SHALL show the request as sent, and SHALL say so when nobody has that name, in the same words whether the name is unknown or its owner has blocked the person asking.

#### Scenario: A request is sent
- **WHEN** a person asks for a username the API knows
- **THEN** the request appears among the ones they sent

#### Scenario: Nobody by that name
- **WHEN** a person asks for a username the API answers with 404
- **THEN** a message is shown

### Requirement: A request is answered
The client SHALL show the requests waiting for the signed-in person and SHALL let them accept or decline each one.

#### Scenario: Accepting makes a friend
- **GIVEN** a request waiting for a person
- **WHEN** they accept it
- **THEN** the sender appears among their friends
- **AND** the request is gone

#### Scenario: Declining removes the request
- **GIVEN** a request waiting for a person
- **WHEN** they decline it
- **THEN** the API is told
- **AND** the request is gone

### Requirement: A sent request can be withdrawn
The client SHALL show the requests the signed-in person sent and SHALL let them withdraw one.

#### Scenario: Withdrawing a request
- **GIVEN** a person who sent a request
- **WHEN** they withdraw it
- **THEN** the API is told
- **AND** the request is gone

### Requirement: A friend can be removed or blocked
The client SHALL ask for confirmation before removing a friend or blocking somebody, and SHALL do nothing if the person changes their mind.

#### Scenario: Removing a friend
- **GIVEN** a person with a friend
- **WHEN** they remove the friend and confirm
- **THEN** the API is told
- **AND** the friend is gone from the list

#### Scenario: Changing one's mind
- **GIVEN** a person with a friend
- **WHEN** they ask to remove the friend and cancel
- **THEN** the API is told nothing
- **AND** the friend is still listed

#### Scenario: Blocking a friend
- **GIVEN** a person with a friend
- **WHEN** they block the friend and confirm
- **THEN** the friend is gone from the list
- **AND** appears among the people they blocked

### Requirement: A block can be undone
The client SHALL show the people the signed-in person has blocked and SHALL let them unblock one.

#### Scenario: Unblocking
- **GIVEN** a person who has blocked somebody
- **WHEN** they unblock them
- **THEN** the API is told
- **AND** nobody is listed as blocked

### Requirement: A friend's wardrobe can be read
The client SHALL show what a friend has marked for friends, with photographs, a page at a time, and SHALL answer a person the API refuses the way it answers any path it does not know.

#### Scenario: A friend's shared items are shown
- **GIVEN** a friend who has shared an item
- **WHEN** a person opens the friend's wardrobe
- **THEN** the item's name and photograph are shown

#### Scenario: Nothing shared says so
- **GIVEN** a friend who has shared nothing
- **WHEN** a person opens the friend's wardrobe
- **THEN** a message is shown instead of a list

#### Scenario: A stranger's wardrobe is simply not there
- **GIVEN** a username the API answers with 404
- **WHEN** its wardrobe is opened
- **THEN** a window saying the screen was not found is shown
