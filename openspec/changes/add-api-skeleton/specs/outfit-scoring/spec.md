# Spec Delta

## ADDED Requirements

### Requirement: Occasion validation
The system SHALL accept an occasion only with a known occasion code, a whole-number target formality from 1 to 5, and weights that are non-negative numbers for known scoring components.

#### Scenario: Valid occasion
- **WHEN** an occasion with code `party`, target formality 4 and a color weight of 2 is validated
- **THEN** validation succeeds

#### Scenario: Target formality out of range
- **WHEN** an occasion with code `work` and target formality 6 is validated
- **THEN** validation fails
- **AND** the error names the `targetFormality` field

#### Scenario: Negative weight
- **WHEN** an occasion with code `work`, target formality 3 and a color weight of −1 is validated
- **THEN** validation fails
- **AND** the error names the `weights` field

### Requirement: Outfit items carry an id
The system SHALL accept an outfit item only when it has a non-empty id in addition to valid item tags.

#### Scenario: Missing id
- **WHEN** an outfit item with slot `top`, type `blouse` and no id is validated
- **THEN** validation fails
- **AND** the error names the `id` field

#### Scenario: Tags still checked
- **WHEN** an outfit item with id `b1`, slot `bottom` and type `blouse` is validated
- **THEN** validation fails
- **AND** the error names the `type` field
