# Spec Delta

## MODIFIED Requirements

### Requirement: An outfit can be liked, saved and worn
The client SHALL let the person like or dislike the outfit shown, pressing the same choice again to take it back; save and unsave it; and say they wore it today, after which the screen says the date it was recorded for and links to that day of the diary.

#### Scenario: Like, then take it back
- **GIVEN** an outfit with no reaction
- **WHEN** the person presses like, then like again
- **THEN** the API is told `like`, then no reaction
- **AND** the like button shows whether it is pressed

#### Scenario: Save
- **GIVEN** an outfit that is not saved
- **WHEN** the person saves it
- **THEN** the API is asked to save it
- **AND** the button now offers to unsave

#### Scenario: Wore it today
- **GIVEN** an outfit
- **WHEN** the person says they wore it today
- **THEN** the API is asked to record it
- **AND** the screen says it was recorded for the date the API answered
- **AND** it links to that day of the diary
