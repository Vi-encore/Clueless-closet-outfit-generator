# Spec Delta

## ADDED Requirements

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
