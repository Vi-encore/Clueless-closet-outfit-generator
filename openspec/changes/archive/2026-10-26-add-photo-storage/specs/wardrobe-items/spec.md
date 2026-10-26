# Spec Delta

## ADDED Requirements

### Requirement: An item answers with a link to its photograph
The API SHALL include a short-lived link to the photograph with every item it returns that has one, and `null` where an item has none, so that a browser can render the image without sending a token. The link SHALL be issued only on the paths that already decide who may see the item.

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
