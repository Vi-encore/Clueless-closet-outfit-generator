# wardrobe-items Specification

## Purpose
Covers a person's own wardrobe over HTTP: adding an item, reading it back, correcting its tags and taking it out of circulation, with every one of those scoped to the owner so that an item belonging to somebody else is indistinguishable from an item that does not exist.

## Requirements

### Requirement: An item is added to the signed-in person's wardrobe
The API SHALL answer `POST /items` with a slot, a type and any further tags by storing the item against the signed-in user and returning status 201 with the stored item, SHALL take the owner from the access token and never from the request body, and SHALL reject tags that break the vocabularies or the slot/type rule with status 400.

#### Scenario: Item stored
- **WHEN** a signed-in client posts an item with slot `top` and type `blouse`
- **THEN** the response status is 201
- **AND** the body contains the item's id, slot and type
- **AND** the item's status is `available` and its visibility is `private`

#### Scenario: Owner comes from the token
- **GIVEN** two accounts, A and B
- **WHEN** A posts an item carrying B's id as the owner
- **THEN** the stored item belongs to A

#### Scenario: Type does not belong to the slot
- **WHEN** a signed-in client posts an item with slot `bottom` and type `blouse`
- **THEN** the response status is 400
- **AND** `errors` contains an entry with the path `type`

#### Scenario: Signing in is required
- **WHEN** a client posts an item without an access token
- **THEN** the response status is 401

### Requirement: The wardrobe lists only its owner's items
The API SHALL answer `GET /items` with the signed-in user's items and no others.

#### Scenario: Own items returned
- **GIVEN** account A owns two items
- **WHEN** A requests `GET /items`
- **THEN** the response contains both items

#### Scenario: Another wardrobe stays invisible
- **GIVEN** account A owns an item and account B owns none
- **WHEN** B requests `GET /items`
- **THEN** the response contains no items

### Requirement: An item is readable only by its owner
The API SHALL answer `GET /items/:id` with the item when the signed-in user owns it, and SHALL answer 404 both when no such item exists and when it belongs to somebody else, so that the two cannot be told apart.

#### Scenario: Owner reads the item
- **GIVEN** account A owns an item
- **WHEN** A requests that item by id
- **THEN** the response status is 200
- **AND** the body contains the item's tags

#### Scenario: Somebody else's item is not found
- **GIVEN** account A owns an item
- **WHEN** account B requests that item by id
- **THEN** the response status is 404

#### Scenario: An unknown id answers the same way
- **WHEN** a signed-in client requests an id that belongs to no item
- **THEN** the response status is 404
- **AND** the body is the same shape as for somebody else's item

### Requirement: Tags are corrected in place
The API SHALL answer `PATCH /items/:id` by applying the given tags to the signed-in user's item and returning the updated item, SHALL leave tags that were not given untouched, SHALL apply the slot/type rule to the item as it will be after the change rather than to the request alone, and SHALL refuse a patch that names no tag at all.

#### Scenario: One tag changed
- **GIVEN** account A owns an item with formality 3 and the name "White blouse"
- **WHEN** A patches it with formality 4
- **THEN** the response status is 200
- **AND** the item's formality is 4 and its name is unchanged

#### Scenario: The pair is judged after merging
- **GIVEN** account A owns an item with slot `top` and type `blouse`
- **WHEN** A patches it with type `jeans` alone
- **THEN** the response status is 400
- **AND** `errors` contains an entry with the path `type`

#### Scenario: Slot and type change together
- **GIVEN** account A owns an item with slot `top` and type `blouse`
- **WHEN** A patches it with slot `bottom` and type `jeans`
- **THEN** the response status is 200
- **AND** the item's slot is `bottom` and its type is `jeans`

#### Scenario: Somebody else's item cannot be changed
- **GIVEN** account A owns an item
- **WHEN** account B patches it
- **THEN** the response status is 404
- **AND** the item is unchanged

#### Scenario: A patch that names nothing is refused
- **GIVEN** account A owns an item
- **WHEN** A patches it with an empty body
- **THEN** the response status is 400

### Requirement: An item is archived rather than deleted
The API SHALL answer `DELETE /items/:id` by setting the item's status to `archived` and recording the reason and the moment, SHALL keep the record, and SHALL answer 200 when the item was already archived.

#### Scenario: Item archived with a reason
- **GIVEN** account A owns an item
- **WHEN** A deletes it with the reason `worn_out`
- **THEN** the response status is 200
- **AND** the item is still readable by id
- **AND** its status is `archived` and it records the reason and the moment

#### Scenario: Archiving twice is not an error
- **GIVEN** account A owns an archived item
- **WHEN** A deletes it again
- **THEN** the response status is 200
- **AND** the moment it was first archived is unchanged

#### Scenario: Somebody else's item cannot be archived
- **GIVEN** account A owns an item
- **WHEN** account B deletes it
- **THEN** the response status is 404
- **AND** the item's status is unchanged

### Requirement: The wardrobe is narrowed by slot and status
The API SHALL accept `slot` and `status` as query parameters on `GET /items`, SHALL leave archived items out unless a status asks for them, and SHALL reject a value outside the vocabulary with status 400.

#### Scenario: Archived items are left out
- **GIVEN** account A owns one available item and one archived item
- **WHEN** A requests `GET /items`
- **THEN** the response contains only the available item

#### Scenario: Archived items on request
- **GIVEN** account A owns one available item and one archived item
- **WHEN** A requests `GET /items?status=archived`
- **THEN** the response contains only the archived item

#### Scenario: Narrowed by slot
- **GIVEN** account A owns a `top` and a `bottom`
- **WHEN** A requests `GET /items?slot=top`
- **THEN** the response contains only the `top`

#### Scenario: Unknown slot rejected
- **WHEN** a signed-in client requests `GET /items?slot=hat`
- **THEN** the response status is 400

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
