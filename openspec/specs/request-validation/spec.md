# request-validation Specification

## Purpose
Ensures every request body is checked against its endpoint's schema, so handlers only ever see valid data and clients get a clear explanation of what is wrong.

## Requirements

### Requirement: Invalid request data is rejected
The API SHALL reject a request whose body does not match its endpoint's schema with status 400 and a body containing the message `Validation failed` and an `errors` list with one `{ path, message }` entry per invalid field, where the path joins nested keys with dots.

#### Scenario: Field error listed
- **WHEN** a client posts to `/outfits/score` an outfit whose first item has slot `bottom` and type `blouse`
- **THEN** the response status is 400
- **AND** `errors` contains an entry with the path `items.0.type`

#### Scenario: Several errors at once
- **WHEN** a client posts to `/outfits/score` an occasion with target formality 9 and an item with formality 0
- **THEN** the response status is 400
- **AND** `errors` contains entries with the paths `occasion.targetFormality` and `items.0.formality`

### Requirement: Unknown fields are dropped
The API SHALL remove body fields that the endpoint's schema does not define before the request reaches the handler.

#### Scenario: Extra field removed
- **WHEN** a valid body with an extra field `isAdmin: true` passes validation
- **THEN** the handler receives the body without `isAdmin`
