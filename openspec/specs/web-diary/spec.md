# web-diary Specification

## Purpose
Covers the outfit diary in the client: a month as a calendar of what was worn, a day with its outfits, its note and its photo, and the memory of the same day a year or a month ago on the desktop.

## Requirements

### Requirement: The diary is reached from the desktop
The client SHALL offer a diary shortcut on the desktop that opens the current month of the diary, and the diary SHALL lead back to the desktop when closed.

#### Scenario: The shortcut
- **GIVEN** a signed-in person on the desktop
- **WHEN** they use the diary shortcut
- **THEN** the diary opens on the current month

#### Scenario: The diary leads back to the desktop
- **GIVEN** a person in the diary
- **WHEN** they press back
- **THEN** the desktop opens

### Requirement: A month is a calendar of what was worn
The client SHALL draw a month as weeks starting on Monday. A day with a record SHALL show the record's photo, or, when it has none, a small doll wearing the outfit, and SHALL link to that day. A day with more than one record SHALL say how many. Today SHALL be marked. A photo SHALL load only when it comes into view.

#### Scenario: Days with and without a photo
- **GIVEN** a month with a record on the 3rd that has a photo, and one on the 17th that has none
- **WHEN** the person opens that month
- **THEN** the 3rd shows the photo
- **AND** the 17th shows a doll wearing that outfit
- **AND** both link to their day

#### Scenario: Weeks start on Monday
- **WHEN** the person opens March 2026, which starts on a Sunday
- **THEN** the 1st is the seventh day of the first week

#### Scenario: Two outfits on one day
- **GIVEN** two records on the same day
- **WHEN** the month is shown
- **THEN** that day says there are two

#### Scenario: Photos wait to be seen
- **WHEN** a month with photos is shown
- **THEN** each photo is marked to load lazily

### Requirement: Months are turned
The client SHALL offer the previous and the next month, SHALL keep the month shown in the address as `?month=YYYY-MM`, and SHALL show the current month when the address names none or names a month it cannot read.

#### Scenario: The next month
- **GIVEN** the diary on March 2026
- **WHEN** the person asks for the next month
- **THEN** April 2026 is shown and the address names it

#### Scenario: A month that cannot be read
- **WHEN** the person opens the diary at `?month=March`
- **THEN** the current month is shown

### Requirement: A day shows what was worn
The client SHALL show a day at `/diary/YYYY-MM-DD` with each outfit worn that day on the doll, its note and its photo, and SHALL say so when nothing was recorded that day.

#### Scenario: A day with a record
- **GIVEN** a record on 17 March 2026 with a note
- **WHEN** the person opens that day
- **THEN** the outfit is on the doll
- **AND** the note is shown

#### Scenario: An empty day
- **WHEN** the person opens a day with no record
- **THEN** the screen says nothing was recorded that day

### Requirement: A day takes a note and a photo
The client SHALL let the person write a note of up to 2000 characters, choose a photo of themselves, or take either away, and save, sending the photo before the record. It SHALL never cut a diary photo's background out, and SHALL show a refusal or a failure in a dialog.

#### Scenario: A note and a photo are saved
- **GIVEN** a day with a record
- **WHEN** the person writes a note, chooses a photo and saves
- **THEN** the photo is uploaded to the diary's upload address
- **AND** the record is sent the note and that photo's key
- **AND** the day shows the saved note and photo

#### Scenario: The photo is taken away
- **GIVEN** a record with a photo
- **WHEN** the person takes the photo away and saves
- **THEN** the record is sent no photo

#### Scenario: A note too long
- **WHEN** the person writes more than 2000 characters
- **THEN** saving is not offered
- **AND** nothing is sent

#### Scenario: A failed save
- **GIVEN** the API refuses the record
- **WHEN** the person saves
- **THEN** a dialog says it failed

### Requirement: Memories are on the desktop
The client SHALL show on the desktop each memory the API answers, as "a year ago" or "a month ago" with the record's photo or doll and a link to that day, and SHALL show nothing when there is none.

#### Scenario: A year ago
- **GIVEN** the API answers a year memory
- **WHEN** the desktop is shown
- **THEN** a card says it was a year ago
- **AND** it links to that day of the diary

#### Scenario: Nothing to remember
- **GIVEN** the API answers no memories
- **WHEN** the desktop is shown
- **THEN** no memory card is shown
