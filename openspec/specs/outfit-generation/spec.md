# outfit-generation Specification

## Purpose
Makes outfits from a person's items for an occasion: combinations by template, filtered and scored, picked so that a good outfit is not always the same one, and built around chosen items on request.

## Requirements

### Requirement: Every occasion has a target and weights
The domain package SHALL define, for every occasion code, a target formality on the 1–5 scale and a weight for every score component, so that any occasion can be passed to the generator by its code alone.

#### Scenario: Every code is an occasion
- **WHEN** the system occasions are read
- **THEN** there is one for every occasion code
- **AND** each passes the occasion schema

#### Scenario: Work is more formal than home
- **WHEN** the occasions for work and for home are compared
- **THEN** work's target formality is higher

### Requirement: An outfit has a base
The generator SHALL build every outfit on a base of one top and one bottom, or of one one-piece, and SHALL return no outfits when the items it is given make no base.

#### Scenario: A top and a bottom make an outfit
- **GIVEN** one top and one bottom
- **WHEN** an outfit is generated
- **THEN** it holds that top and that bottom

#### Scenario: A one-piece is an outfit on its own
- **GIVEN** one dress and nothing else
- **WHEN** an outfit is generated
- **THEN** it holds the dress alone

#### Scenario: No base, no outfit
- **GIVEN** two tops and no bottom or one-piece
- **WHEN** an outfit is generated
- **THEN** no outfit is returned

### Requirement: Shoes and outerwear are added to the base
The generator SHALL add to each base the shoes that give the outfit the best score when there are any that pass the hard filters, and SHALL add outerwear only when the best one does not lower the outfit's score.

#### Scenario: Shoes are added
- **GIVEN** a top, a bottom and a pair of shoes
- **WHEN** an outfit is generated
- **THEN** it holds the shoes

#### Scenario: The better shoes are chosen
- **GIVEN** a top and a bottom of formality 4, and shoes of formality 4 and of formality 2
- **WHEN** an outfit is generated for an occasion of target formality 4
- **THEN** it holds the shoes of formality 4

#### Scenario: Outerwear that lowers the score is left off
- **GIVEN** a bright patterned top, a neutral bottom, neutral shoes and a bright patterned coat
- **WHEN** an outfit is generated
- **THEN** it does not hold the coat

### Requirement: An outfit that breaks a hard filter is never offered
The generator SHALL leave out every combination that breaks a hard filter for the occasion, whether in its base or in a layer.

#### Scenario: An item avoided for the occasion is left out
- **GIVEN** two tops, one of which avoids work, and one bottom
- **WHEN** an outfit is generated for work
- **THEN** it holds the other top

#### Scenario: Shoes too far in formality are left off
- **GIVEN** a top and a bottom of formality 5 and shoes of formality 1 only
- **WHEN** an outfit is generated
- **THEN** it holds no shoes

### Requirement: A good outfit is picked, not always the same one
The generator SHALL pick among the best-scoring bases with a weighted random choice after adding noise to each score, SHALL take its randomness from a source the caller can pass, and SHALL return as many distinct outfits as asked for, up to as many as there are.

#### Scenario: The same randomness gives the same outfit
- **GIVEN** a wardrobe with several possible outfits
- **WHEN** outfits are generated twice with the same random source
- **THEN** both are the same

#### Scenario: A bad outfit is not picked over good ones
- **GIVEN** ten bases that score well and one that scores far below them
- **WHEN** an outfit is generated many times with different randomness
- **THEN** the low one is never picked

#### Scenario: Several outfits are distinct
- **GIVEN** a wardrobe with at least three possible outfits
- **WHEN** three are asked for
- **THEN** three outfits come back, no two with the same items

### Requirement: An outfit is built around chosen items
The generator SHALL return only outfits holding every item in `mustInclude`, of any slot, and SHALL return none when no outfit can hold them all.

#### Scenario: Around a skirt
- **GIVEN** two bottoms, one of them a skirt, and a top
- **WHEN** an outfit is generated around the skirt
- **THEN** it holds the skirt

#### Scenario: Around shoes
- **GIVEN** a top, a bottom and two pairs of shoes
- **WHEN** an outfit is generated around one pair
- **THEN** it holds that pair

#### Scenario: Two dresses cannot be one outfit
- **GIVEN** two dresses
- **WHEN** an outfit is generated around both
- **THEN** no outfit is returned

### Requirement: Items and outfits can be kept out
The generator SHALL never use an item in `exclude`, and SHALL not return an outfit whose items are exactly those of an outfit in `seen`.

#### Scenario: An excluded item is never used
- **GIVEN** two tops and a bottom, one top excluded
- **WHEN** an outfit is generated
- **THEN** it holds the other top

#### Scenario: Another one is another outfit
- **GIVEN** a wardrobe with two possible outfits, one of which was shown
- **WHEN** an outfit is generated with the shown one as seen
- **THEN** the other one is returned

### Requirement: An outfit says why it was chosen
The generator SHALL return each outfit with the ids of its items, its total score and the score of each component, computed for the whole outfit including its layers.

#### Scenario: The breakdown is the whole outfit's
- **GIVEN** a top, a bottom and shoes
- **WHEN** an outfit is generated
- **THEN** its score equals the score of those three items for that occasion
