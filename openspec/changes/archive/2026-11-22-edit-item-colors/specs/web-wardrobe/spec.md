# Spec Delta

## ADDED Requirements

### Requirement: An item's colours can be changed on its card
The client SHALL offer, on the card of one of the person's own items that is not archived, to change its colours the way the new item form does, and SHALL send the colours as they are when the person saves, an empty list when every one was removed. It SHALL show a refusal or a failure in a dialog and leave the colours as they were.

#### Scenario: A grey top becomes white
- **GIVEN** an item whose colours are grey
- **WHEN** the person changes grey to white on its card and saves
- **THEN** the API is sent white alone, with white's typical colour
- **AND** the card shows white

#### Scenario: Every colour removed
- **GIVEN** an item with colours
- **WHEN** the person removes them all on its card and saves
- **THEN** the API is sent an empty list of colours

#### Scenario: Not for an archived item
- **GIVEN** an archived item
- **WHEN** its card is opened
- **THEN** changing its colours is not offered

#### Scenario: A failed save
- **GIVEN** the API refuses the change
- **WHEN** the person saves
- **THEN** a dialog says it failed
- **AND** the card shows the colours as they were

## MODIFIED Requirements

### Requirement: Colors are offered from the photograph
The client SHALL fill the form's colors from the pixels of the cut-out, or of the original where there is none, SHALL show each color with its family's label, and SHALL let the person, before saving, remove any of them, change any to another family, and add a family not yet listed. A colour changed or added by hand SHALL carry its family's typical colour; a changed one SHALL keep its share, and an added one SHALL take the smallest share the photograph would report, or the whole item when it is the only colour.

#### Scenario: Colors appear once the photograph is ready
- **GIVEN** a cut-out that is mostly red
- **WHEN** it is shown
- **THEN** the form offers red among the colors

#### Scenario: A color can be removed
- **GIVEN** a form offering two colors
- **WHEN** the person removes one and submits
- **THEN** the item is created with the other alone

#### Scenario: A colour is changed to another family
- **GIVEN** a form offering grey, read from the photograph
- **WHEN** the person changes it to white and submits
- **THEN** the item is created with white in its place, with white's typical colour and grey's share

#### Scenario: A colour is added
- **GIVEN** a form offering red alone
- **WHEN** the person adds navy and submits
- **THEN** the item is created with red and navy, navy taking the smallest share

#### Scenario: The first colour is the whole item
- **GIVEN** a form offering no colours
- **WHEN** the person adds white and submits
- **THEN** the item is created with white covering the whole item
