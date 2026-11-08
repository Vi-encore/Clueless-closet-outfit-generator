# browser-access Specification

## Purpose
Covers what the API has to do before a browser will hand it a request and read the answer: naming the origins it answers, and sending the headers that tell a browser how to treat its responses.

## Requirements

### Requirement: A browser from a known origin is answered
The API SHALL answer a cross-origin request from an origin named in its configuration with the headers a browser needs to let the page read the response, SHALL allow credentials so that the refresh cookie travels, and SHALL answer an origin that is not named without those headers, so that the browser itself refuses the response.

#### Scenario: A known origin is allowed
- **WHEN** a request arrives carrying an `Origin` the configuration names
- **THEN** the response allows that origin
- **AND** the response allows credentials

#### Scenario: An unknown origin is not allowed
- **WHEN** a request arrives carrying an `Origin` the configuration does not name
- **THEN** the response does not allow that origin

#### Scenario: A preflight is answered
- **WHEN** a browser preflights a `PATCH` carrying an `Authorization` header from a known origin
- **THEN** the response allows that method
- **AND** the response allows that header

#### Scenario: A request with no origin is unaffected
- **WHEN** a request arrives with no `Origin` header at all
- **THEN** the response status is unchanged from before CORS was configured

### Requirement: Responses carry security headers
The API SHALL send the security headers on every response, so that a browser is told how to treat our content before it is asked to render any of it.

#### Scenario: The headers are there
- **WHEN** any route is requested
- **THEN** the response carries a content security policy
- **AND** the response refuses to be framed

#### Scenario: The documentation still works over plain http
- **GIVEN** the API is not in production
- **WHEN** the documentation is requested
- **THEN** the policy does not tell the browser to upgrade its requests
- **AND** the documentation's own scripts are allowed to load
