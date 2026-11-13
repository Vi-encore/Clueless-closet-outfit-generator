# Spec Delta

## ADDED Requirements

### Requirement: A change to a relation is announced to the people it changes
The API SHALL send a `friends:changed` event with no details, on the live connection, to every connection of each person whose lists a change to a relation alters, and SHALL send it to nobody else. A block placed on somebody who had no request and no friendship with the blocker alters only the blocker's lists, and so does lifting one's own block.

#### Scenario: A request reaches the person asked
- **GIVEN** two connected people with no relation
- **WHEN** one asks the other to be friends
- **THEN** both receive `friends:changed`

#### Scenario: Accepting reaches the person who asked
- **GIVEN** a request waiting for a connected person from another connected person
- **WHEN** it is accepted
- **THEN** both receive `friends:changed`

#### Scenario: Unfriending reaches both
- **GIVEN** two connected friends
- **WHEN** one removes the other
- **THEN** both receive `friends:changed`

#### Scenario: Blocking a stranger reaches only the blocker
- **GIVEN** two connected people with no relation
- **WHEN** one blocks the other
- **THEN** the blocker receives `friends:changed`
- **AND** the person blocked receives nothing

#### Scenario: Lifting a block reaches only the person lifting it
- **GIVEN** a connected person who blocked another connected person
- **WHEN** they lift the block
- **THEN** they receive `friends:changed`
- **AND** the other person receives nothing
