# Spec Delta

## ADDED Requirements

### Requirement: A cut-out keeps the item and drops what stands apart
The client SHALL group a cut-out's opaque pixels into islands of pixels that touch, diagonals included, and SHALL make every island smaller than a quarter of the largest transparent before the cut-out is trimmed, so that a scrap the model kept apart from the item is neither drawn nor counted in the item's box.

#### Scenario: A scrap beside the item is dropped
- **GIVEN** a cut-out of a large item and, apart from it, a scrap a tenth of its size
- **WHEN** it is cleaned and trimmed
- **THEN** the scrap is transparent
- **AND** the result is the item's box alone

#### Scenario: A pair is kept
- **GIVEN** a cut-out of two shoes of about one size, apart from each other
- **WHEN** it is cleaned
- **THEN** both shoes are kept

#### Scenario: A diagonal touch is one island
- **GIVEN** a strap that joins the item only corner to corner
- **WHEN** it is cleaned
- **THEN** the strap is kept with the item

#### Scenario: Nothing opaque
- **GIVEN** a cut-out with no opaque pixel
- **WHEN** it is cleaned
- **THEN** nothing is changed
