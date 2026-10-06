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
