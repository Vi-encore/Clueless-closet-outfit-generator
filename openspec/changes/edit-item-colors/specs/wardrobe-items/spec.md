# Spec Delta

## MODIFIED Requirements

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

#### Scenario: Colours are replaced
- **GIVEN** account A owns an item whose colours are grey and white
- **WHEN** A patches it with the colours white alone
- **THEN** the response status is 200
- **AND** the item's colours are white alone

#### Scenario: Colours are cleared
- **GIVEN** account A owns an item with colours
- **WHEN** A patches it with an empty list of colours
- **THEN** the response status is 200
- **AND** the item has no colours
