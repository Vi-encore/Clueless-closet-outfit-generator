# Spec Delta

## ADDED Requirements

### Requirement: A wardrobe is read a page at a time
The API SHALL answer `GET /items` and `GET /users/:username/items` with an object carrying the page's items and a cursor for the next page, SHALL accept `cursor` and `limit` as query parameters, SHALL return a cursor of null on the last page, and SHALL order items so that no row is repeated or skipped across pages.

#### Scenario: A page and a cursor come back
- **GIVEN** account A owns three items
- **WHEN** A requests `GET /items?limit=2`
- **THEN** the response contains two items
- **AND** it carries a cursor for the next page

#### Scenario: The next page follows on
- **GIVEN** account A owns three items
- **WHEN** A reads the first page of two and then the page after it
- **THEN** the second page contains the remaining item
- **AND** no item appears on both pages

#### Scenario: The last page says so
- **GIVEN** account A owns three items
- **WHEN** A reads the page after the first page of two
- **THEN** the cursor is null

#### Scenario: Everything fits by default
- **GIVEN** account A owns three items
- **WHEN** A requests `GET /items`
- **THEN** the response contains all three
- **AND** the cursor is null

#### Scenario: A limit outside what is allowed is refused
- **WHEN** a signed-in client requests `GET /items?limit=0`
- **THEN** the response status is 400

#### Scenario: A friend's wardrobe pages the same way
- **GIVEN** `cher` and `dionne` are friends
- **AND** `cher` owns two items marked `friends`
- **WHEN** `dionne` requests `cher`'s items with a limit of one
- **THEN** the response contains one item and a cursor

#### Scenario: A stranger is still told nothing
- **GIVEN** `cher` owns an item marked `friends`
- **AND** `dionne` is not friends with `cher`
- **WHEN** `dionne` requests `cher`'s items with a limit
- **THEN** the response status is 404
