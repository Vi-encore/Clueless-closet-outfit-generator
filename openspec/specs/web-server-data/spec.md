# web-server-data Specification

## Purpose
Covers how the client holds what the API answered for as long as a session lasts: shown again at once when a screen is reopened, brought up to date after a change, and forgotten when the session ends.

## Requirements

### Requirement: A screen opened again shows what it last had
The client SHALL show what a screen last loaded as soon as it is opened again in the same session, SHALL ask the API again behind it, and SHALL replace it with the newer answer when that arrives.

#### Scenario: The wardrobe comes back at once
- **GIVEN** a person who opened their wardrobe and went back to the desktop
- **WHEN** they open the wardrobe again while the API has not answered yet
- **THEN** the items they saw before are shown

#### Scenario: A newer answer replaces it
- **GIVEN** a person who opened their friends screen and went back to the desktop
- **AND** a friend added since then
- **WHEN** they open the friends screen again
- **THEN** the new friend is shown once the API answers

#### Scenario: Another slot is its own list
- **GIVEN** a person who saw their wardrobe narrowed to shoes
- **WHEN** they narrow it to tops
- **THEN** no shoes are shown while the tops are on their way

### Requirement: A change shows wherever it is seen
The client SHALL bring every screen that shows something up to date after the person changes it, including screens they already visited, so that no screen opened afterwards shows it as it was.

#### Scenario: A new item is in the wardrobe
- **GIVEN** a person who opened their wardrobe
- **WHEN** they add an item and go back to the wardrobe
- **THEN** the new item is shown

#### Scenario: An archived item is gone from the wardrobe
- **GIVEN** a person who opened their wardrobe
- **WHEN** they archive one of its items
- **THEN** the wardrobe shown afterwards does not have it

#### Scenario: Sharing is remembered on the card
- **GIVEN** a person who shared an item from its card and went back to the wardrobe
- **WHEN** they open the same card again
- **THEN** it shows the item as shared before the API answers

#### Scenario: Reading a conversation clears its count
- **GIVEN** a conversation with unread messages
- **WHEN** the person opens it and goes back to the desktop
- **THEN** the chat shortcut no longer counts them

### Requirement: Signing out forgets what was loaded
The client SHALL forget everything loaded for a person when their session ends, whether they signed out or the API ended it, so that nobody who signs in afterwards in the same tab sees any of it.

#### Scenario: The next person sees only their own
- **GIVEN** a person who opened their wardrobe and signed out
- **WHEN** somebody else signs in in the same tab and opens the wardrobe
- **THEN** none of the first person's items are shown at any point

#### Scenario: A lost session forgets too
- **GIVEN** a person who opened their friends screen
- **WHEN** the API refuses to renew their session and they sign in again as somebody else
- **THEN** none of the first person's friends are shown at any point

### Requirement: A failed load says so at once
The client SHALL show that a load failed as soon as the API refuses or cannot be reached, without asking again on its own first, and SHALL ask again the next time the screen is opened.

#### Scenario: One refusal, one answer on screen
- **GIVEN** an API that answers the wardrobe with an error
- **WHEN** the wardrobe is opened
- **THEN** the API is asked once
- **AND** the screen says the wardrobe cannot be loaded

#### Scenario: A missing item is not found at once
- **GIVEN** an id the API answers with 404
- **WHEN** its card is opened
- **THEN** the API is asked once
- **AND** a window saying the screen was not found is shown
