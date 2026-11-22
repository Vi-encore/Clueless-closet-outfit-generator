# Spec Delta

## ADDED Requirements

### Requirement: A key belongs to the folder it was issued for
The API SHALL file item photos under `items/` and diary photos under `diary/`, SHALL refuse an item carrying a diary key, and SHALL refuse a diary record carrying an item key, each with 400, so that a photo cannot be moved from where it was meant to be seen.

#### Scenario: A diary key on an item is refused
- **GIVEN** a person issued a diary upload key
- **WHEN** they create an item carrying that key
- **THEN** the response status is 400

#### Scenario: An item key on the diary is refused
- **GIVEN** a person issued an item upload key, and a wear record of theirs
- **WHEN** they set that key as the record's photo
- **THEN** the response status is 400
