# Spec Delta

## ADDED Requirements

### Requirement: An item's state is named by a vocabulary
The domain SHALL define the statuses an item can hold, the visibilities it can carry and the reasons it can be archived for, in the same place as the tags that describe it, so that the API, the database defaults and the interface all read the same list.

#### Scenario: Statuses are defined
- **WHEN** the item statuses are read
- **THEN** they are `available`, `laundry` and `archived`

#### Scenario: Visibilities are defined
- **WHEN** the visibilities are read
- **THEN** they are `private` and `friends`

#### Scenario: Archive reasons are defined
- **WHEN** the archive reasons are read
- **THEN** they include `worn_out`, `given_away`, `sold` and `damaged`
- **AND** they include `other`, so that no reason has to be invented

#### Scenario: A value outside the vocabulary is rejected
- **WHEN** a status that is not in the vocabulary is validated
- **THEN** validation fails
