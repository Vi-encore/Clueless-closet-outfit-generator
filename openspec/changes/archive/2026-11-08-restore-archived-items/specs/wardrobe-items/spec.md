## ADDED Requirements

### Requirement: An archived item can be put back
The API SHALL answer `POST /items/:id/restore` by returning an archived item to the wardrobe, with its status `available` and no moment or reason of archiving, SHALL answer an item that is not archived with the item unchanged, and SHALL answer 404 for an item that is not the signed-in user's.

#### Scenario: A restored item is back in the wardrobe
- **GIVEN** an archived item with a reason
- **WHEN** its owner restores it
- **THEN** the response shows it `available` with no `archivedAt` and no `archivedReason`
- **AND** the wardrobe lists it again

#### Scenario: Restoring an item that is not archived changes nothing
- **GIVEN** an item that is not archived
- **WHEN** its owner restores it
- **THEN** the response status is 200
- **AND** the item is unchanged

#### Scenario: Somebody else's item cannot be restored
- **GIVEN** an archived item belonging to somebody else
- **WHEN** a person restores it
- **THEN** the response status is 404
- **AND** the item stays archived
