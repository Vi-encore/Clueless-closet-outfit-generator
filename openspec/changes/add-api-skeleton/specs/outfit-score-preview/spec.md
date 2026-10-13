# Spec Delta

## Purpose

Lets a client ask the API how well a set of items works as an outfit for an occasion, using the shared core scoring rules, without storing anything.

## ADDED Requirements

### Requirement: Score a posted outfit
The API SHALL answer `POST /outfits/score` with an occasion and one to six outfit items by returning status 200, the hard-filter result and, when the filters pass, the total score with its per-component breakdown.

#### Scenario: Outfit scored
- **GIVEN** the occasion `work` with target formality 3
- **WHEN** a client posts a white blouse with formality 3 and denim jeans with formality 2
- **THEN** the response status is 200
- **AND** the filters pass
- **AND** the total is 1.25 with a color score of 0.5 and a formality score of 0.75

#### Scenario: Empty outfit rejected
- **WHEN** a client posts an outfit with no items
- **THEN** the response status is 400
- **AND** `errors` contains an entry with the path `items`

### Requirement: Rejected outfit explained
The API SHALL answer an outfit that fails a hard filter with status 200, the rejection reasons and no score.

#### Scenario: Formality gap explained
- **WHEN** a client posts two items with formality 1 and 4
- **THEN** the response status is 200
- **AND** the filters do not pass, with a `formality_gap` reason of 3
- **AND** the body contains no score
