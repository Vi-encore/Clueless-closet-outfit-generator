# web-outfits Specification

## Purpose
The screens where a person gets an outfit for an occasion, sees it on a 2D doll with the reason it was chosen, asks for another one, likes, saves and wears it, and finds the outfits they saved.

## Requirements

### Requirement: The outfits are reached from the desktop
The client SHALL offer an outfits shortcut on the desktop that opens the outfit screen, and the outfit screen SHALL lead back to the desktop when closed.

#### Scenario: The shortcut
- **GIVEN** a signed-in person on the desktop
- **WHEN** they use the outfits shortcut
- **THEN** the outfit screen opens

#### Scenario: The outfit screen leads back to the desktop
- **GIVEN** a person on the outfit screen
- **WHEN** they press back
- **THEN** the desktop opens

### Requirement: An outfit is made for a chosen occasion
The client SHALL let the person choose an occasion, keep the choice in the address, ask the API for an outfit for it, and show the outfit's items, or a line saying no outfit can be made from what they have.

#### Scenario: An outfit for work
- **GIVEN** a person on the outfit screen
- **WHEN** they choose work and ask for an outfit
- **THEN** the API is asked for an outfit for work
- **AND** the outfit's items are shown on the doll
- **AND** the address holds the occasion

#### Scenario: Nothing to make an outfit from
- **GIVEN** a wardrobe the API makes no outfit from
- **WHEN** an outfit is asked for
- **THEN** a line says no outfit can be made yet

#### Scenario: A failed request
- **WHEN** the API cannot be reached while asking for an outfit
- **THEN** an error dialog says so

### Requirement: An outfit says why it was chosen
The client SHALL show beside the outfit a line for each component of its score, and SHALL show "MIS-MATCH" when the total is below zero.

#### Scenario: The reason
- **GIVEN** an outfit whose color scores 0.75 and formality 1
- **WHEN** it is shown
- **THEN** a line for color and a line for formality are shown with their scores

#### Scenario: A mismatch
- **GIVEN** an outfit whose total is below zero
- **WHEN** it is shown
- **THEN** "MIS-MATCH" is shown

### Requirement: Another one is another outfit
The client SHALL ask for another outfit for the same occasion with every outfit already shown on this screen sent as seen.

#### Scenario: Two in a row
- **GIVEN** an outfit was shown
- **WHEN** the person asks for another one twice
- **THEN** the second request sends the first outfit as seen
- **AND** the third sends both earlier outfits

### Requirement: An outfit can be liked, saved and worn
The client SHALL let the person like or dislike the outfit shown, pressing the same choice again to take it back; save and unsave it; and say they wore it today, after which the screen says the date it was recorded for.

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

### Requirement: An outfit can be made around an item
The client SHALL offer, on the card of an item in the wardrobe, to make an outfit with it, which opens the outfit screen and asks for outfits that hold that item.

#### Scenario: From the card
- **GIVEN** the card of an item in the wardrobe
- **WHEN** the person asks for an outfit with it
- **THEN** the outfit screen opens
- **AND** the API is asked for an outfit that must include the item

#### Scenario: Not for an archived item
- **GIVEN** the card of an archived item
- **WHEN** it is shown
- **THEN** there is no offer to make an outfit with it

### Requirement: Saved outfits can be found again
The client SHALL list the person's saved outfits a page at a time and open each one, with its doll, reason and the same actions, at its own address.

#### Scenario: The saved list
- **GIVEN** a person with two saved outfits
- **WHEN** they open the saved outfits
- **THEN** both are listed
- **AND** opening one shows it at its own address

#### Scenario: Someone else's outfit
- **WHEN** the address of an outfit the API answers 404 for is opened
- **THEN** the not-found screen is shown

### Requirement: The doll wears the outfit
The client SHALL draw a mannequin and place each item's cut-out on it by slot — a top from the shoulders, a bottom from the waist, a one-piece from the shoulders, outerwear from the shoulders over the rest, shoes at the feet — keeping each image's proportions, and SHALL show an item without a cut-out beside the doll instead.

#### Scenario: A top sits on the shoulders
- **GIVEN** a top's cut-out
- **WHEN** it is placed on the doll
- **THEN** its top edge is on the shoulder line and it is centred on the doll
- **AND** its width is the shoulders' width times the sleeve allowance

#### Scenario: Proportions are kept
- **GIVEN** a cut-out on the doll
- **WHEN** it is drawn
- **THEN** it is given a position and a width but no height, so its proportions are its own

#### Scenario: Layers
- **GIVEN** an outfit of outerwear, a top, a bottom and shoes
- **WHEN** it is drawn
- **THEN** the bottom is under the top, the top under the outerwear, and the shoes on top of all

#### Scenario: No cut-out
- **GIVEN** an outfit holding an item with no cut-out
- **WHEN** it is drawn
- **THEN** that item's photograph is shown beside the doll, not on it
