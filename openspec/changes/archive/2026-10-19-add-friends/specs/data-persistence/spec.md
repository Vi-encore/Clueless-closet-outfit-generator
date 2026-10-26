# Spec Delta

## ADDED Requirements

### Requirement: Two people have at most one friendship
The system SHALL store a friendship once for a pair of people, identified by the pair itself rather than by who asked, and SHALL reject a second record for the same two people in either order. It SHALL record who asked and, when the relation is blocked, who blocked.

#### Scenario: One record per pair
- **GIVEN** a friendship between A and B
- **WHEN** a second friendship is written for B and A
- **THEN** the write fails

#### Scenario: Who asked is kept
- **WHEN** a friendship is created by A asking B
- **THEN** the stored record names A as the one who asked

#### Scenario: Removed with either person
- **GIVEN** a friendship between A and B
- **WHEN** A is deleted
- **THEN** the friendship is gone too
