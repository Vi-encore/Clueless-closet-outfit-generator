# wardrobe-stats Specification

## Purpose
Covers the wardrobe's statistics on the API: what the wardrobe holds and how much of it is worn, by slot and by main colour, the most worn items, cost per wear, and the items not worn for a long time, all read by their owner alone.

## Requirements

### Requirement: The wardrobe is counted
The API SHALL answer `GET /stats` with the number of the signed-in person's items in the wardrobe, archived ones left out, the number of them worn at least once, and the count of them per slot and per main colour family, the family covering the largest share of an item, with items that have no colours counted apart.

#### Scenario: Items and the share worn
- **GIVEN** a person with four items, one of them worn twice, and an archived fifth
- **WHEN** they read their statistics
- **THEN** there are four items, one of them worn

#### Scenario: By slot and by main colour
- **GIVEN** two tops, mostly white and mostly red, and a bottom with no colours
- **WHEN** the person reads their statistics
- **THEN** there are two tops and one bottom
- **AND** one item is mostly white, one mostly red, and one has no colours

#### Scenario: Another person's items are not counted
- **GIVEN** another person with three items
- **WHEN** this person, with none, reads their statistics
- **THEN** there are no items

### Requirement: The most worn items are listed
The API SHALL answer, in the statistics, at most five of the person's items in the wardrobe that were worn at least once, most worn first, each described as the wardrobe describes it, with its wear count.

#### Scenario: The most worn first
- **GIVEN** items worn 1, 5, 3 times, and one never worn
- **WHEN** the person reads their statistics
- **THEN** the most worn are those worn 5, 3 and 1 times, in that order

### Requirement: Cost per wear is worked out
The API SHALL answer, in the statistics, each of the person's items in the wardrobe that has a price and was worn at least once, with its price divided by its wear count to the cent, in its own currency, cheapest per wear first, and SHALL answer apart the items with a price that were never worn.

#### Scenario: Cost per wear
- **GIVEN** a coat of 3000 UAH worn 4 times, and a dress of 1200 UAH worn 6 times
- **WHEN** the person reads their statistics
- **THEN** the dress costs 200 UAH a wear and the coat 750, the dress first

#### Scenario: Bought and not yet worn
- **GIVEN** shoes of 2500 UAH never worn
- **WHEN** the person reads their statistics
- **THEN** the shoes are among the items not yet worn for their price
- **AND** not among the costs per wear

### Requirement: Items not worn for a long time are found
The API SHALL answer `GET /stats/unworn?days=` with the person's items in the wardrobe last worn at least that many days ago, or never worn and added that long ago, the longest unworn first, a page at a time, each with when it was last worn or null. It SHALL accept 30, 90 or 180 days, defaulting to 90, and SHALL refuse any other number, or a cursor it did not issue, with 400.

#### Scenario: Not worn for 90 days
- **GIVEN** today is 23 November 2026, an item last worn on 1 July 2026, one worn on 1 November 2026, and one never worn and added on 1 March 2026
- **WHEN** the person reads their items unworn for 90 days
- **THEN** the item added in March and never worn comes first, then the one worn in July
- **AND** the one worn in November is not there

#### Scenario: Read a page at a time
- **GIVEN** three items unworn for 90 days, added on 1, 2 and 3 March 2026 and never worn
- **WHEN** the person reads them two at a time
- **THEN** the first page holds those added on 1 and 2 March, with a cursor
- **AND** the page after that cursor holds the one added on 3 March, with no cursor

#### Scenario: A cursor that was not issued is refused
- **WHEN** the person reads the unworn items with the cursor `not-a-cursor`
- **THEN** the response status is 400

#### Scenario: Another number of days is refused
- **WHEN** the person asks for items unworn for 45 days
- **THEN** the response status is 400

#### Scenario: Archived items are not offered
- **GIVEN** an archived item never worn and added a year ago
- **WHEN** the person reads their items unworn for 90 days
- **THEN** it is not there
