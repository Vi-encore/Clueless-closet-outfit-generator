## ADDED Requirements

### Requirement: Archived items can be looked at
The client SHALL offer the archive in the wardrobe's filter, SHALL list only archived items while it is chosen, SHALL keep that choice in the URL alongside the slot, and SHALL say so when the archive is empty.

#### Scenario: The archive lists archived items
- **GIVEN** a person with an archived item
- **WHEN** they choose the archive
- **THEN** the API is asked for archived items
- **AND** the archived item is shown

#### Scenario: The archive and a slot combine
- **WHEN** the wardrobe is opened at an address naming the archive and a slot
- **THEN** the API is asked for archived items of that slot

#### Scenario: An empty archive says so
- **GIVEN** a person with nothing archived
- **WHEN** they choose the archive
- **THEN** a message says the archive is empty

### Requirement: An archived item can be put back
The client SHALL show on an archived item's card that it is archived, when and why, SHALL offer to put it back in place of archiving it, and SHALL show it as back in the wardrobe once the API has answered.

#### Scenario: An archived card says why it left
- **GIVEN** an item archived as given away
- **WHEN** its card is opened
- **THEN** the card says it is archived and why
- **AND** no way to archive it is offered

#### Scenario: Putting it back
- **GIVEN** an archived item's card
- **WHEN** its owner puts it back
- **THEN** the API is told
- **AND** the card no longer says it is archived
- **AND** the wardrobe lists it again
