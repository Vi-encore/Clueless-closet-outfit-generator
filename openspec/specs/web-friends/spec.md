# web-friends Specification

## Purpose
Covers friends as a person sees them: their list, finding somebody by exact username, answering and withdrawing requests, removing and blocking with a confirmation, undoing a block, and reading what a friend has shared.

## Requirements

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

### Requirement: A person can share a link to themselves
The client SHALL offer, on the friends screen, to share a link to the signed-in person, made of the app's own origin and `/friends?add=` with their username. It SHALL hand the link to the system's share sheet where there is one, SHALL otherwise copy it and say so, SHALL show it to copy by hand when neither is possible, and SHALL say nothing when the person cancels the share sheet.

#### Scenario: The share sheet gets the link
- **GIVEN** a device with a share sheet, and a person signed in as `cher`
- **WHEN** they press the button to share their link
- **THEN** the share sheet is opened with a URL that ends in `/friends?add=cher`

#### Scenario: Without a share sheet the link is copied
- **GIVEN** a device with no share sheet but a clipboard
- **WHEN** the person presses the button
- **THEN** the link is copied
- **AND** a line says it was copied

#### Scenario: With neither, the link is shown
- **GIVEN** a device with no share sheet and no usable clipboard
- **WHEN** the person presses the button
- **THEN** the link is shown in a field to copy by hand

#### Scenario: Cancelling the share sheet says nothing
- **GIVEN** a device with a share sheet
- **WHEN** the person opens it and cancels it
- **THEN** no message is shown

### Requirement: An invitation link offers to ask, and asks only when told
The client SHALL show, on the friends screen opened with `add=<username>`, an offer naming that username with a button to send a request and one to decline, and SHALL send nothing until the first is pressed. It SHALL then send one request, refresh the lists and remove `add` from the address. It SHALL answer a username the API refuses as it answers one typed. It SHALL say so, and offer nothing, when the link is the person's own. It SHALL keep the link through signing in.

#### Scenario: Opening a link sends nothing
- **WHEN** a signed-in person opens `/friends?add=dionne`
- **THEN** an offer to send `dionne` a request is shown
- **AND** no request has been sent

#### Scenario: Pressing sends the request
- **GIVEN** the offer for `dionne`
- **WHEN** the person presses to send the request
- **THEN** one request is sent to `dionne`
- **AND** `dionne` is shown among the requests sent
- **AND** the offer is gone, and the address no longer names her

#### Scenario: Declining sends nothing
- **GIVEN** the offer for `dionne`
- **WHEN** the person declines it
- **THEN** the offer is gone
- **AND** no request has been sent

#### Scenario: Somebody the API refuses is nobody
- **GIVEN** the offer for a username the API answers with 404
- **WHEN** the person presses to send the request
- **THEN** the message for nobody by that name is shown

#### Scenario: One's own link
- **WHEN** a person signed in as `cher` opens `/friends?add=cher`
- **THEN** a line says it is their own link
- **AND** there is nothing to send

#### Scenario: The link survives signing in
- **GIVEN** a person not signed in
- **WHEN** they open `/friends?add=dionne` and sign in
- **THEN** the friends screen is shown with the offer for `dionne`
