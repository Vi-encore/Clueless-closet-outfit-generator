# outfits Specification

## Purpose
Makes outfits from the signed-in person's wardrobe for an occasion and keeps them, so they can be liked, saved and recorded as worn.

## Requirements

### Requirement: An outfit is generated from the person's own wardrobe
The API SHALL answer `POST /outfits/generate` with an occasion code by generating an outfit from the signed-in person's items whose status is `available`, storing it, and returning it with its items, its total score and its per-component breakdown; it SHALL return `{ outfit: null }` when no outfit can be made, and SHALL require a signed-in person.

#### Scenario: An outfit for an occasion
- **GIVEN** a person with a top and a bottom
- **WHEN** they ask for an outfit for work
- **THEN** the answer holds an outfit with those two items, its score and breakdown
- **AND** the outfit is stored as theirs, for work

#### Scenario: Only their own available items
- **GIVEN** a person with a top, a bottom and a second top in the laundry, and another person with a bottom
- **WHEN** the first person asks for outfits many times
- **THEN** every outfit holds only their top and their bottom

#### Scenario: Nothing to make an outfit from
- **GIVEN** a person with two tops only
- **WHEN** they ask for an outfit
- **THEN** the answer is `{ outfit: null }`
- **AND** nothing is stored

#### Scenario: An unknown occasion
- **WHEN** an outfit is asked for with an occasion code that does not exist
- **THEN** the answer is 400

#### Scenario: Without signing in
- **WHEN** an outfit is asked for without a token
- **THEN** the answer is 401

### Requirement: An outfit is generated around chosen items
The API SHALL return only an outfit holding every item in `mustInclude`, and SHALL return `{ outfit: null }` when they cannot share an outfit or any of them is not one of the person's available items, without telling apart someone else's item from one that does not exist.

#### Scenario: Around a skirt
- **GIVEN** a person with a top, trousers and a skirt
- **WHEN** they ask for an outfit around the skirt
- **THEN** the outfit holds the skirt

#### Scenario: Around someone else's item
- **GIVEN** a person with a top and a bottom, and another person's skirt
- **WHEN** the first person asks for an outfit around that skirt
- **THEN** the answer is `{ outfit: null }`

### Requirement: Another one is another outfit
The API SHALL not return an outfit with the same items as one of the person's outfits listed in `seen`.

#### Scenario: Another one
- **GIVEN** a person with a top and two bottoms, who was shown the outfit with the first bottom
- **WHEN** they ask for another one with that outfit as seen
- **THEN** the outfit holds the second bottom

### Requirement: An outfit is readable only by its owner
The API SHALL answer `GET /outfits/:id` with the outfit, its items with links to their photographs, its occasion, score, reaction and whether it is saved, and SHALL answer 404 for an outfit of someone else exactly as for one that does not exist, on this route and on every route that takes an outfit id.

#### Scenario: Reading one's outfit
- **GIVEN** an outfit a person generated
- **WHEN** they read it
- **THEN** it holds the same items, in slot order, each with its photo link

#### Scenario: Someone else's outfit
- **GIVEN** an outfit of another person
- **WHEN** a person reads it, reacts to it, saves it or wears it
- **THEN** each answer is 404

### Requirement: An outfit can be liked or disliked
The API SHALL set an outfit's reaction to `like`, `dislike` or none with `PUT /outfits/:id/reaction`, and SHALL answer with the outfit.

#### Scenario: Like, then change one's mind
- **GIVEN** an outfit
- **WHEN** it is liked and then disliked
- **THEN** its reaction is `dislike`

#### Scenario: Taking the reaction back
- **GIVEN** a liked outfit
- **WHEN** its reaction is set to none
- **THEN** it has no reaction

### Requirement: An outfit can be saved
The API SHALL mark an outfit as saved with `PUT /outfits/:id/save` and unmark it with `DELETE /outfits/:id/save`, both idempotent, and SHALL list the person's saved outfits with `GET /outfits/saved` a page at a time, newest first.

#### Scenario: Saving twice
- **GIVEN** an outfit
- **WHEN** it is saved twice
- **THEN** it is saved, with the moment of the first save

#### Scenario: The saved list
- **GIVEN** a person with three outfits, two of them saved, and another person's saved outfit
- **WHEN** they list their saved outfits
- **THEN** the list holds their two saved outfits

#### Scenario: Unsaving
- **GIVEN** a saved outfit
- **WHEN** it is unsaved
- **THEN** it is no longer in the saved list

### Requirement: Wearing an outfit is recorded once a day
The API SHALL answer `POST /outfits/:id/wear` by recording that the outfit was worn on today's date in the person's time zone and, in the same transaction, adding 1 to every item's wear count and setting its last-worn moment; a second request for the same outfit on the same date SHALL change nothing and answer the existing record.

#### Scenario: Wore it today
- **GIVEN** an outfit of two items never worn
- **WHEN** the person says they wore it
- **THEN** a wear record of today's date is stored for the outfit
- **AND** each item has a wear count of 1 and a last-worn moment

#### Scenario: Twice the same day
- **GIVEN** an outfit worn today
- **WHEN** the person says they wore it again
- **THEN** the answer is the same wear record
- **AND** each item's wear count is still 1

#### Scenario: Today is the person's today
- **GIVEN** a person in the time zone `Pacific/Auckland`
- **WHEN** they wear an outfit at 23:30 UTC on 1 March
- **THEN** the record's date is 2 March
