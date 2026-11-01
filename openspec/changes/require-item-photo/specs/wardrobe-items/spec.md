# Spec Delta

## MODIFIED Requirements

### Requirement: An item is added to the signed-in person's wardrobe
The API SHALL answer `POST /items` with a slot, a type, a photo key and any further tags by storing the item against the signed-in user and returning status 201 with the stored item, SHALL take the owner from the access token and never from the request body, and SHALL reject a request with no photo key, or with tags that break the vocabularies or the slot/type rule, with status 400.

#### Scenario: Item stored
- **WHEN** a signed-in client posts an item with slot `top`, type `blouse` and a photo key issued to them
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

#### Scenario: A photograph is required
- **WHEN** a signed-in client posts an item with no photo key
- **THEN** the response status is 400
- **AND** `errors` contains an entry with the path `photoOriginalKey`

#### Scenario: Signing in is required
- **WHEN** a client posts an item without an access token
- **THEN** the response status is 401
