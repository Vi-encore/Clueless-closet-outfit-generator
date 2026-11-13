# Spec Delta

## ADDED Requirements

### Requirement: Friends are kept up to date while the app is open
The client SHALL ask for a person's lists of people again, and for their conversations, whenever the live connection says a relation of theirs has changed, so that a screen already open shows the change without being reopened.

#### Scenario: An accepted request moves on its own
- **GIVEN** a person on the friends screen with a request they sent
- **WHEN** the live connection says their relations changed, and the API now lists that person as a friend
- **THEN** the person is shown among their friends
- **AND** the sent request is gone

#### Scenario: A new request appears on its own
- **GIVEN** a person on the friends screen with no requests waiting
- **WHEN** the live connection says their relations changed, and the API now lists a request for them
- **THEN** the request is shown among those waiting

### Requirement: The desktop counts the requests waiting
The client SHALL show on the desktop's friends shortcut how many requests are waiting for the person, SHALL show nothing there when none are, and SHALL keep the count up to date as the live connection says relations changed.

#### Scenario: Waiting requests are counted
- **GIVEN** two requests waiting for a person
- **WHEN** the desktop is shown
- **THEN** the friends shortcut says two

#### Scenario: A request arriving changes the count
- **GIVEN** the desktop shown with no requests waiting
- **WHEN** the live connection says relations changed, and the API now lists one request
- **THEN** the friends shortcut says one

## MODIFIED Requirements

### Requirement: A friend's wardrobe can be read
The client SHALL show what a friend has marked for friends, with photographs, a page at a time, SHALL lead there from each friend on the friends screen with a button of its own, and SHALL answer a person the API refuses the way it answers any path it does not know.

#### Scenario: A button leads to a friend's wardrobe
- **GIVEN** a person with a friend
- **WHEN** they press that friend's wardrobe button on the friends screen
- **THEN** the friend's wardrobe is shown

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
