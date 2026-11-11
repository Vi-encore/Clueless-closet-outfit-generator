## ADDED Requirements

### Requirement: A cut-out is trimmed to the item
The client SHALL crop the transparent margin around the item from a cut-out before encoding it, keeping a cut-out that is transparent everywhere as it is.

#### Scenario: The margin is cropped
- **GIVEN** a cut-out whose opaque pixels lie in a box inside the image
- **WHEN** it is trimmed
- **THEN** the result is exactly that box

#### Scenario: Nothing opaque
- **GIVEN** a cut-out with no opaque pixel
- **WHEN** it is trimmed
- **THEN** the whole image is kept
