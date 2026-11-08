## ADDED Requirements

### Requirement: Outerwear can be taken off the doll
The client SHALL offer, under a doll wearing outerwear, a checkbox that is ticked by default and, when unticked, stops drawing the outerwear while leaving the rest of the outfit on the doll; it SHALL not offer the checkbox for an outfit without outerwear on the doll.

#### Scenario: Taking the coat off
- **GIVEN** a doll wearing a coat over a top
- **WHEN** the person unticks the outerwear checkbox
- **THEN** the coat is no longer on the doll
- **AND** the top still is

#### Scenario: Putting it back
- **GIVEN** a doll with its outerwear taken off
- **WHEN** the person ticks the checkbox again
- **THEN** the coat is on the doll again

#### Scenario: No outerwear, no checkbox
- **GIVEN** an outfit of a top and a bottom
- **WHEN** it is drawn
- **THEN** there is no outerwear checkbox
