## ADDED Requirements

### Requirement: Scoring is tuned in one place
The domain package SHALL take every threshold and score the filters and components use from one tuning object, SHALL use the defaults when none is passed, and SHALL score the same with the defaults as before the object existed.

#### Scenario: The defaults change nothing
- **GIVEN** an outfit
- **WHEN** it is scored with no tuning and with the default tuning
- **THEN** both scores are the same

#### Scenario: A tuning changes the score
- **GIVEN** an outfit with one bright accent on a neutral base
- **WHEN** it is scored with a tuning whose accent score is 1
- **THEN** its color component is 1

#### Scenario: A tuning changes a filter
- **GIVEN** an outfit whose items differ in formality by 3
- **WHEN** its hard filters are checked with a tuning allowing a gap of 3
- **THEN** it passes
