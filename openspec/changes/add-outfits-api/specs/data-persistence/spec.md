## ADDED Requirements

### Requirement: An outfit holds its items and goes with its owner
The system SHALL store an outfit with its owner, its occasion code, its items with their slots, and optionally a score with its breakdown, a reaction and the moment it was saved; it SHALL hold an item at most once per outfit, and SHALL remove a person's outfits and their wear records when the person goes.

#### Scenario: An item once per outfit
- **GIVEN** an outfit holding an item
- **WHEN** the same item is added to it again
- **THEN** the write fails

#### Scenario: Outfits go with their owner
- **GIVEN** a person with an outfit that was worn
- **WHEN** the person is deleted
- **THEN** the outfit, its items and its wear record are gone too

### Requirement: A wear record is a calendar date, once per outfit
The system SHALL store a wear record's date as a calendar date without a time, and SHALL reject a second wear record for the same outfit on the same date.

#### Scenario: One record a day
- **GIVEN** an outfit with a wear record for 2 March
- **WHEN** a second record for that outfit and 2 March is written
- **THEN** the write fails

#### Scenario: A date stays a date
- **WHEN** a wear record for 2 March is stored and read back
- **THEN** its date is 2 March, whatever the server's time zone
