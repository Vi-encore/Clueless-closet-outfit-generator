# Spec Delta

## ADDED Requirements

### Requirement: The doll stands on a backdrop its outfit shows against
The client SHALL draw the doll on one of a light, a middle and a dark backdrop, choosing for each outfit the one whose weakest contrast with the main colour of each item on the doll is the strongest, and SHALL use the light one when no item on the doll has colours.

#### Scenario: A white top on a dark backdrop
- **GIVEN** an outfit whose top is mostly white
- **WHEN** it is drawn on the doll
- **THEN** the backdrop is the dark one

#### Scenario: Black clothes on a light backdrop
- **GIVEN** an outfit of black items
- **WHEN** it is drawn on the doll
- **THEN** the backdrop is the light one

#### Scenario: No colours known
- **GIVEN** an outfit whose items have no colours
- **WHEN** it is drawn on the doll
- **THEN** the backdrop is the light one

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
