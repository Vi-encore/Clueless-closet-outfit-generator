# Spec Delta

## ADDED Requirements

### Requirement: Background removal can be switched off
The client SHALL not cut out the background, and SHALL not fetch what cutting out needs, while the `photoCutout` flag is off, and SHALL then save a new item with its original photograph alone, without saying that anything failed.

#### Scenario: Switched off, the original is used
- **GIVEN** the `photoCutout` flag is off
- **WHEN** a person chooses a photograph for a new item
- **THEN** the original is shown
- **AND** nothing says the background was not removed
- **AND** nothing offers to keep a cut-out

#### Scenario: Switched off, only the original is sent
- **GIVEN** the `photoCutout` flag is off
- **WHEN** a person submits a new item with a photograph
- **THEN** only the original is uploaded
- **AND** the item is created with no cut-out key
