# Spec Delta

## ADDED Requirements

### Requirement: Cutting out shows how far it has got
The client SHALL show, while a background is cut out on the new item form or on an item's card, a progress bar with its value. While the model downloads, it SHALL say so and show the share of bytes received across every file reported so far. While the photograph itself is cut out, it SHALL say so and show the step reached out of four.

#### Scenario: The model is downloading
- **GIVEN** a cut-out whose model has reported 3 MB of 12 MB of one file and 1 MB of 4 MB of another
- **WHEN** the form is shown
- **THEN** it says the model is downloading
- **AND** the progress bar's value is 25%

#### Scenario: The photograph is being cut out
- **GIVEN** a cut-out that has reported the step `compute:mask`, two of four
- **WHEN** the form is shown
- **THEN** it says the background is being cut out
- **AND** the progress bar's value is 50%

#### Scenario: On the card
- **GIVEN** an item whose background is being cut out again from its card, at the step `compute:inference`
- **WHEN** the card is shown
- **THEN** the progress bar's value is 25%
