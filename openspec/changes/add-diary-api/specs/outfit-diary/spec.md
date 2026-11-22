# Spec Delta

## Purpose

Covers the outfit diary on the API: a note and a photo of the person on each day an outfit was worn, a month of those days, and memories of the same day a year and a month ago, all readable and writable by their owner alone.

## ADDED Requirements

### Requirement: A worn day takes a note and a photo
The API SHALL let the owner of a wear record set or clear its note (up to 2000 characters) and its photo with `PATCH /diary/:id`. The photo SHALL come from a key the API issued to that person under `diary/`. The API SHALL remove a replaced or cleared photo from storage, and SHALL answer the record as the diary describes it.

#### Scenario: A note and a photo are added
- **GIVEN** an outfit worn today, and a diary upload key issued to its owner
- **WHEN** the owner sets a note and that photo key on the day's record
- **THEN** the response status is 200
- **AND** the record answers the note and a link to the photo

#### Scenario: Clearing them
- **GIVEN** a record with a note and a photo
- **WHEN** the owner sets both to null
- **THEN** the record has neither
- **AND** the photo is removed from storage

#### Scenario: Somebody else's record is not there
- **WHEN** a person changes the wear record of another
- **THEN** the response status is 404

### Requirement: A diary photo is uploaded like an item's, to its own folder
The API SHALL issue upload URLs for diary photos with `POST /diary/upload-url`, for the same image types as an item's, under a key `diary/<ownerId>/<uuid>.<extension>`.

#### Scenario: A diary key is issued
- **WHEN** a signed-in person asks for a diary upload URL for `image/webp`
- **THEN** the key starts with `diary/` and their id

### Requirement: A month of the diary is read in date order
The API SHALL answer `GET /diary?month=YYYY-MM` with the signed-in person's wear records dated in that month, in date order, each with its date, its note, a link to its photo or null, and its outfit with the items' photo links. It SHALL refuse a month that is not `YYYY-MM` with 400.

#### Scenario: The month's days are listed
- **GIVEN** outfits worn on 3 and 17 March 2026, and one on 2 April 2026
- **WHEN** the person reads `2026-03`
- **THEN** two records are answered, dated 3 and 17 March, in that order
- **AND** each carries its outfit's items

#### Scenario: A month in another shape is refused
- **WHEN** the person reads the month `March`
- **THEN** the response status is 400

#### Scenario: Another person's days are not listed
- **GIVEN** another person who wore an outfit in March 2026
- **WHEN** this person reads `2026-03`
- **THEN** none of the other person's records are answered

### Requirement: Memories are of the same day a year and a month ago
The API SHALL answer `GET /diary/memories` with the signed-in person's records dated exactly one year and exactly one month before today in their time zone, each marked `year` or `month`. It SHALL answer no month memory when that day does not exist in the month before.

#### Scenario: A year ago today
- **GIVEN** today is 22 November 2026 for the person, and they wore an outfit on 22 November 2025
- **WHEN** they read their memories
- **THEN** that record is answered, marked `year`

#### Scenario: A month ago today
- **GIVEN** today is 22 November 2026, and they wore an outfit on 22 October 2026
- **WHEN** they read their memories
- **THEN** that record is answered, marked `month`

#### Scenario: No such day a month ago
- **GIVEN** today is 31 March 2027
- **WHEN** the person reads their memories
- **THEN** no record is answered as a month memory

#### Scenario: Nothing to remember
- **GIVEN** no records a year or a month ago
- **WHEN** the person reads their memories
- **THEN** the answer is empty
