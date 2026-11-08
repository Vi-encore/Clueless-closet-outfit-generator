## ADDED Requirements

### Requirement: An item keeps a cut-out beside its photograph
The API SHALL accept an optional `photoCutoutKey` on `POST /items` and `PATCH /items/:id`, SHALL refuse one that was not issued to the signed-in user with status 400 as it refuses such a photo key, and SHALL delete the object a cut-out key pointed at when an item is given a different one.

#### Scenario: An item is stored with its cut-out
- **WHEN** a signed-in client posts an item with a photo key and a cut-out key both issued to them
- **THEN** the response status is 201
- **AND** the item carries both keys

#### Scenario: A cut-out is optional
- **WHEN** a signed-in client posts an item with a photo key and no cut-out key
- **THEN** the response status is 201

#### Scenario: Somebody else's cut-out key is refused
- **GIVEN** a key issued to another account
- **WHEN** a signed-in client posts an item with it as the cut-out key
- **THEN** the response status is 400
- **AND** no item is stored

#### Scenario: A replaced cut-out is removed
- **GIVEN** an item whose cut-out has been uploaded
- **WHEN** its owner patches it with a different cut-out key
- **THEN** the first object is no longer in storage

## MODIFIED Requirements

### Requirement: An item answers with a link to its photograph
The API SHALL include a short-lived link to the photograph with every item it returns that has one, and `null` where an item has none, and SHALL do the same for the cut-out in a separate field, so that a browser can render either image without sending a token. The links SHALL be issued only on the paths that already decide who may see the item.

#### Scenario: The owner's item carries a link
- **GIVEN** an item whose photo key has been set
- **WHEN** its owner reads it
- **THEN** the response carries a link to the photograph

#### Scenario: An item without a photo says so
- **GIVEN** an item with no photo
- **WHEN** its owner reads it
- **THEN** the link is null

#### Scenario: A list carries links too
- **GIVEN** an owner with two items, one of which has a photo
- **WHEN** they list their wardrobe
- **THEN** one item carries a link and the other carries null

#### Scenario: A friend gets a link to a shared item
- **GIVEN** `cher` and `dionne` are friends
- **AND** `cher` owns an item marked `friends` with a photo
- **WHEN** `dionne` reads `cher`'s wardrobe
- **THEN** the item carries a link to the photograph

#### Scenario: The cut-out has a link of its own
- **GIVEN** an item with a photo and a cut-out
- **WHEN** its owner reads it
- **THEN** the response carries a link to the photograph and a different link to the cut-out

#### Scenario: An item without a cut-out says so
- **GIVEN** an item with a photo and no cut-out
- **WHEN** its owner reads it
- **THEN** the cut-out link is null
