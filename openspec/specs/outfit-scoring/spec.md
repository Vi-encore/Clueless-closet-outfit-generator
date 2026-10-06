# outfit-scoring Specification

## Purpose
Rates how well a candidate outfit suits an occasion: hard filters drop unsuitable combinations, and the remaining ones get separate component scores plus a weighted total, so outfits can be ranked and the reasons shown.

## Requirements

### Requirement: Formality gap filter
The system SHALL reject an outfit whose items' formality values differ by more than 2.

#### Scenario: Gap of three rejected
- **WHEN** an outfit with items of formality 1 and 4 is checked against any occasion
- **THEN** the outfit is rejected
- **AND** the rejection reason names the formality gap

#### Scenario: Gap of two accepted
- **WHEN** an outfit with items of formality 2 and 4 is checked against an occasion the items do not avoid
- **THEN** the outfit passes the filters

### Requirement: Avoided occasion filter
The system SHALL reject an outfit for an occasion when any of its items lists that occasion among the occasions it avoids.

#### Scenario: Avoided occasion rejected
- **GIVEN** a top that avoids the occasion `work`
- **WHEN** an outfit with that top is checked against the occasion `work`
- **THEN** the outfit is rejected
- **AND** the rejection reason names the item and the occasion

### Requirement: Component score range
The system SHALL express every component score as a number from −1 (clash) to 1 (ideal), where 0 means no effect.

#### Scenario: Component range
- **WHEN** any outfit that passes the filters is scored
- **THEN** every component score in its breakdown is between −1 and 1 inclusive

### Requirement: Missing data scores zero
The system SHALL give a component a score of 0 when any item in the outfit lacks the data that component needs.

#### Scenario: Missing colors
- **WHEN** an outfit in which one item has no colors is scored
- **THEN** its color score is 0

#### Scenario: Missing formality
- **WHEN** an outfit in which one item has no formality is scored
- **THEN** its formality score is 0

### Requirement: Neutral colors go with everything
The system SHALL NOT lower the color score for combining a neutral main color (black, white, grey, beige or denim) with any other main color.

#### Scenario: Neutral with a bright color
- **WHEN** an outfit with a black top and red trousers is scored
- **THEN** its color score is 0 or higher

#### Scenario: Two neutrals
- **WHEN** an outfit with a white top and denim jeans is scored
- **THEN** its color score is greater than 0

### Requirement: At most one bright accent
The system SHALL give a negative color score to an outfit in which more than one item has a bright, non-neutral main color.

#### Scenario: Two bright colors
- **WHEN** an outfit with a bright orange top and bright green trousers is scored
- **THEN** its color score is below 0

### Requirement: At most one print
The system SHALL give a negative color score to an outfit in which more than one item has a pattern other than solid.

#### Scenario: Two prints
- **WHEN** an outfit with a striped top and a floral skirt is scored
- **THEN** its color score is below 0

### Requirement: Formality fit
The system SHALL give the highest formality score when the outfit's average formality equals the occasion's target formality, and a lower score the further the average is from the target.

#### Scenario: Exact match
- **WHEN** an outfit with items of formality 3 and 3 is scored for an occasion with target formality 3
- **THEN** its formality score is 1

#### Scenario: Further is worse
- **WHEN** outfits with average formality 4 and 5 are scored for an occasion with target formality 3
- **THEN** the outfit with average 5 has a lower formality score than the one with average 4

### Requirement: Weighted total with breakdown
The system SHALL return, for each scored outfit, the score of every component and a total equal to the sum of each component score multiplied by the occasion's weight for it, using weight 1 for components the occasion does not weight.

#### Scenario: Weighted total
- **GIVEN** an occasion with color weight 2 and no formality weight
- **WHEN** an outfit with color score 0.5 and formality score 1 is totalled
- **THEN** the total is 2

#### Scenario: Breakdown lists every component
- **WHEN** an outfit is scored
- **THEN** the breakdown contains a color score and a formality score
