## REMOVED Requirements

### Requirement: Two people have at most one friendship
**Reason**: A relation is no longer one record for the pair. It is two, one held by each person, so that the schema can say "mine" and "theirs" (ADR-0016).
**Migration**: Replaced by "Each person holds their side of a relation". The migration carries every existing record across as two.

## ADDED Requirements

### Requirement: Each person holds their side of a relation
The system SHALL store a relation between two people as two records, one held by each of them and naming the other, SHALL reject a second record held by the same person about the same other person, SHALL write and remove the two records together so that they always agree on the state of the relation, and SHALL record on each side whether that person asked and whether that person blocked.

#### Scenario: One record per side
- **GIVEN** a record held by A about B
- **WHEN** a second record held by A about B is written
- **THEN** the write fails

#### Scenario: Who asked is kept
- **WHEN** A asks B to be friends
- **THEN** A's record says A asked, and B's record says B did not

#### Scenario: Both sides change together
- **WHEN** A asks B, B agrees, and A blocks B
- **THEN** after each step A's record and B's record hold the same status, and only A's record says it blocked

#### Scenario: Removed with either person
- **GIVEN** A and B are friends
- **WHEN** A is deleted
- **THEN** neither record remains
