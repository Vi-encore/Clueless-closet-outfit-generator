# Spec Delta

## ADDED Requirements

### Requirement: A friend sees the items marked for friends
The API SHALL answer `GET /users/:username/items` with that person's items whose visibility is `friends` and which are not archived, when the signed-in user is friends with them, and SHALL answer 404 when they are not — so that a wardrobe nobody may see and a person who does not exist look alike. `GET /items/:id` SHALL remain readable by its owner alone.

#### Scenario: Friend sees a shared item
- **GIVEN** `cher` and `dionne` are friends
- **AND** `cher` owns an item whose visibility is `friends`
- **WHEN** `dionne` requests `cher`'s items
- **THEN** the response status is 200
- **AND** the response contains that item

#### Scenario: Private items stay private
- **GIVEN** `cher` and `dionne` are friends
- **AND** `cher` owns one `friends` item and one `private` item
- **WHEN** `dionne` requests `cher`'s items
- **THEN** the response contains only the `friends` item

#### Scenario: A stranger is told nothing
- **GIVEN** `cher` owns an item whose visibility is `friends`
- **AND** `dionne` is not friends with `cher`
- **WHEN** `dionne` requests `cher`'s items
- **THEN** the response status is 404

#### Scenario: A friend still cannot read an item by id
- **GIVEN** `cher` and `dionne` are friends
- **AND** `cher` owns an item whose visibility is `friends`
- **WHEN** `dionne` requests that item through `GET /items/:id`
- **THEN** the response status is 404

#### Scenario: Archived items are not shared
- **GIVEN** `cher` and `dionne` are friends
- **AND** `cher` owns an archived item whose visibility is `friends`
- **WHEN** `dionne` requests `cher`'s items
- **THEN** the response contains no items
