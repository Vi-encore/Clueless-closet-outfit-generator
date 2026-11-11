# wardrobe-taxonomy Specification

## Purpose
Defines the single shared vocabulary for describing wardrobe items — slots, types, patterns, fabrics, materials, cut, seasons, styles, occasions and scales — and the rules for validating an item's tags against it.

## Requirements

### Requirement: Tags use vocabulary codes
The system SHALL accept item tags only as codes from the fixed vocabularies for slot, type, pattern, fabric type, material, fit, length, rise, season, style and occasion; display labels SHALL NOT be accepted as tag values.

#### Scenario: Known code accepted
- **WHEN** an item with slot `top`, type `blouse` and pattern `stripes` is validated
- **THEN** validation succeeds

#### Scenario: Unknown code rejected
- **WHEN** an item with slot `top`, type `blouse` and style `casul` is validated
- **THEN** validation fails
- **AND** the error names the `styles` field

#### Scenario: Label instead of code rejected
- **WHEN** an item with slot `top` and type `Блуза` is validated
- **THEN** validation fails
- **AND** the error names the `type` field

### Requirement: Slot and type are the only required tags
The system SHALL accept an item whose only tags are a slot and a type, and SHALL reject an item that lacks either of them.

#### Scenario: Minimal item
- **WHEN** an item with slot `top`, type `blouse` and no other tags is validated
- **THEN** validation succeeds

#### Scenario: Missing type
- **WHEN** an item with slot `top` and no type is validated
- **THEN** validation fails
- **AND** the error names the `type` field

### Requirement: Type belongs to its slot
The system SHALL accept an item type only when it belongs to the item's slot.

#### Scenario: Type from another slot
- **WHEN** an item with slot `bottom` and type `blouse` is validated
- **THEN** validation fails
- **AND** the error names the `type` field

### Requirement: Warmth and formality scales
The system SHALL accept warmth and formality only as whole numbers from 1 to 5.

#### Scenario: Out of range
- **WHEN** an item with slot `top`, type `blouse` and formality 6 is validated
- **THEN** validation fails
- **AND** the error names the `formality` field

#### Scenario: Not a whole number
- **WHEN** an item with slot `top`, type `blouse` and warmth 2.5 is validated
- **THEN** validation fails
- **AND** the error names the `warmth` field

### Requirement: Seasons are distinct
The system SHALL accept seasons as a list of distinct values from spring, summer, autumn and winter.

#### Scenario: All four seasons
- **WHEN** an item with seasons `spring`, `summer`, `autumn` and `winter` is validated
- **THEN** validation succeeds

#### Scenario: Duplicate season
- **WHEN** an item with seasons `summer` and `summer` is validated
- **THEN** validation fails
- **AND** the error names the `seasons` field

### Requirement: Material composition
The system SHALL accept a material composition as a list of distinct materials, each with an optional whole-number percentage from 1 to 100, where the given percentages add up to at most 100.

#### Scenario: Percentages omitted
- **WHEN** an item with the material `silk` and no percentage is validated
- **THEN** validation succeeds

#### Scenario: Percentages over 100
- **WHEN** an item with `viscose` 70% and `polyester` 40% is validated
- **THEN** validation fails
- **AND** the error names the `materials` field

#### Scenario: Duplicate material
- **WHEN** an item lists `cotton` twice in its materials
- **THEN** validation fails
- **AND** the error names the `materials` field

### Requirement: Tag schema export
The system SHALL provide a JSON Schema of item tags in which every enumerated field lists exactly the codes of its vocabulary.

#### Scenario: Vocabulary reflected in the schema
- **WHEN** the JSON Schema of item tags is exported
- **THEN** the allowed values of the `styles` items equal the style vocabulary
- **AND** the allowed values of `slot` equal the slot vocabulary

### Requirement: An item's state is named by a vocabulary
The domain SHALL define the statuses an item can hold, the visibilities it can carry and the reasons it can be archived for, in the same place as the tags that describe it, so that the API, the database defaults and the interface all read the same list.

#### Scenario: Statuses are defined
- **WHEN** the item statuses are read
- **THEN** they are `available`, `laundry` and `archived`

#### Scenario: Visibilities are defined
- **WHEN** the visibilities are read
- **THEN** they are `private` and `friends`

#### Scenario: Archive reasons are defined
- **WHEN** the archive reasons are read
- **THEN** they include `worn_out`, `given_away`, `sold` and `damaged`
- **AND** they include `other`, so that no reason has to be invented

#### Scenario: A value outside the vocabulary is rejected
- **WHEN** a status that is not in the vocabulary is validated
- **THEN** validation fails

### Requirement: A tag suggestion has the shape of the tags
The domain package SHALL define a tag suggestion holding every tag an item has, each of which may be null, and a list of the fields the suggester is unsure of, and SHALL read an untrusted suggestion field by field, turning any field that breaks the vocabularies or the slot/type rule into null rather than refusing the whole suggestion.

#### Scenario: A valid suggestion is read as it is
- **WHEN** a suggestion with slot `top`, type `blouse` and seasons `spring` and `summer` is read
- **THEN** the result carries those values

#### Scenario: An invalid field becomes null
- **WHEN** a suggestion with pattern `tartan-ish` and slot `top` is read
- **THEN** the pattern is null
- **AND** the slot is `top`

#### Scenario: A type from another slot becomes null
- **WHEN** a suggestion with slot `bottom` and type `blouse` is read
- **THEN** the type is null
- **AND** the slot is `bottom`

#### Scenario: A missing field is null
- **WHEN** an empty object is read as a suggestion
- **THEN** every tag is null and nothing is uncertain

### Requirement: Colors are read from an item's pixels
The domain package SHALL compute an item's colors from the pixels of its image, SHALL ignore transparent pixels, SHALL name each color by a color family with its hex value and its share of the visible area, SHALL leave out colors under a tenth of that area, and SHALL return at most three, largest first.

#### Scenario: One color
- **WHEN** the colors of an image that is entirely one red are read
- **THEN** the result is one color of family `red` with a share of 1

#### Scenario: Transparent pixels do not count
- **WHEN** the colors of an image that is half navy and half transparent are read
- **THEN** the result is one color of family `navy` with a share of 1

#### Scenario: Shares and order
- **WHEN** the colors of an image that is three quarters white and one quarter black are read
- **THEN** the result is white with a share of 0.75, then black with a share of 0.25

#### Scenario: Specks are left out
- **WHEN** the colors of an image that is 95% beige and 5% green are read
- **THEN** the result is beige alone

#### Scenario: A fully transparent image has no colors
- **WHEN** the colors of an image with no opaque pixel are read
- **THEN** the result is empty
