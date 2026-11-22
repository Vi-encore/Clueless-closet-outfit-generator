# web-stats Specification

## Purpose
Covers the wardrobe's statistics in the client: the screen with the wardrobe in numbers, its pie charts by category and by colour, the most worn and the cost per wear, and the list of items not worn for a long time, from which an item can be archived.

## Requirements

### Requirement: Statistics are reached from the desktop
The client SHALL offer a statistics shortcut on the desktop that opens the statistics screen, and the screen SHALL lead back to the desktop when closed.

#### Scenario: The shortcut
- **GIVEN** a signed-in person on the desktop
- **WHEN** they use the statistics shortcut
- **THEN** the statistics screen opens

#### Scenario: Back to the desktop
- **GIVEN** a person on the statistics screen
- **WHEN** they press back
- **THEN** the desktop opens

### Requirement: The wardrobe is shown in numbers
The client SHALL show how many items the wardrobe holds and how many of them were worn, with that share as a whole percent, and SHALL say so when the wardrobe is empty instead of showing charts.

#### Scenario: The share worn
- **GIVEN** statistics of 40 items, 12 of them worn
- **WHEN** the screen is shown
- **THEN** it says 12 of 40 items are worn, 30%

#### Scenario: An empty wardrobe
- **GIVEN** statistics of no items
- **WHEN** the screen is shown
- **THEN** it says the wardrobe is empty
- **AND** no chart is drawn

### Requirement: Category and colour are pie charts
The client SHALL draw the count per category and per main colour each as a pie chart, a colour's sector in its family's typical colour and items without colours as a sector of their own, and SHALL list every sector beside its chart with its label and count, so that the numbers can be read without the picture.

#### Scenario: By category
- **GIVEN** statistics of 3 tops and 1 bottom
- **WHEN** the screen is shown
- **THEN** the category chart's legend lists the tops with 3 and the bottoms with 1

#### Scenario: By colour
- **GIVEN** statistics of 2 mostly white items and 1 with no colours
- **WHEN** the screen is shown
- **THEN** the colour chart's legend lists white with 2 and no colours with 1
- **AND** white's sector is white's typical colour

### Requirement: The most worn and the cost per wear are listed
The client SHALL show the most worn items as bars as long as their share of the most worn one, each with its name and wear count, and SHALL list the cost per wear cheapest first, each with its currency, and the items bought and not yet worn with their price, showing neither list when it is empty.

#### Scenario: The most worn
- **GIVEN** the most worn items are worn 6 and 3 times
- **WHEN** the screen is shown
- **THEN** the first bar is full and the second half as long
- **AND** each says how many times

#### Scenario: Cost per wear
- **GIVEN** a dress at 200.00 UAH a wear, and shoes bought for 2500.00 UAH and not yet worn
- **WHEN** the screen is shown
- **THEN** the dress is listed at 200.00 UAH a wear
- **AND** the shoes are listed as not yet worn, at 2500.00 UAH

### Requirement: Items not worn for a long time are listed
The client SHALL list the items not worn for 30, 90 or 180 days, 90 unless the address names another, keep the choice in the address, read them a page at a time, and show each as a link to its card with when it was last worn or that it never was, saying so when there are none.

#### Scenario: Choosing how long
- **GIVEN** the statistics screen
- **WHEN** the person chooses 180 days
- **THEN** the items unworn for 180 days are asked for
- **AND** the address says 180

#### Scenario: More than one page
- **GIVEN** a first page with a cursor
- **WHEN** the person asks for more
- **THEN** the next page is asked for with that cursor and shown below the first

#### Scenario: Nothing unworn
- **GIVEN** no items unworn for 90 days
- **WHEN** the screen is shown
- **THEN** it says every item was worn in that time

### Requirement: An unworn item can be archived from the list
The client SHALL offer each listed item "В архів", which asks for a reason from the same vocabulary as the card and archives it only with one, after which the item leaves the list and the statistics are read again.

#### Scenario: Archived with a reason
- **GIVEN** an item in the unworn list
- **WHEN** the person archives it as given away
- **THEN** the API is told to archive it as given away
- **AND** the item is no longer in the list

#### Scenario: No reason, no archive
- **GIVEN** an item in the unworn list
- **WHEN** the person tries to archive it without a reason
- **THEN** a message asks for one
- **AND** nothing is archived
