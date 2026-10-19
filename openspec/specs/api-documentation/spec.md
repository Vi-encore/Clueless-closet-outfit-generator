# api-documentation Specification

## Purpose
Lets a person open the API in a browser, see every route it offers and try a request by hand, with request bodies described by the same schemas that validate them.

## Requirements

### Requirement: Interactive API documentation
The API SHALL serve a Swagger UI page at `/docs` and an OpenAPI document at `/docs-json` that lists every route, describing each request body with the same zod schema that validates it, except when the environment is `production`, where neither is served at all.

#### Scenario: Documentation page is served
- **WHEN** a client requests `GET /docs`
- **THEN** the response status is 200
- **AND** the response is an HTML page

#### Scenario: Document lists the health route
- **WHEN** a client requests `GET /docs-json`
- **THEN** the response status is 200
- **AND** `paths` contains an entry for `/health`

#### Scenario: Posted body appears as a schema
- **WHEN** a client requests `GET /docs-json`
- **THEN** the request body schema of `POST /outfits/score` requires `occasion` and `items`

#### Scenario: Nothing is served in production
- **GIVEN** the environment is `production`
- **WHEN** a client requests `GET /docs` or `GET /docs-json`
- **THEN** the response status is 404

### Requirement: The documentation says what a route needs
The OpenAPI document SHALL declare a bearer scheme named `access-token`, SHALL require it of every route by default so that Swagger UI offers one field for the token and marks those routes with a padlock, and SHALL exempt every route the global guard lets through unauthenticated.

#### Scenario: A token can be supplied
- **WHEN** a client requests `GET /docs-json`
- **THEN** `components.securitySchemes` contains `access-token`
- **AND** it describes an HTTP bearer scheme

#### Scenario: A protected route requires the token
- **WHEN** a client requests `GET /docs-json`
- **THEN** the document requires `access-token` of every operation by default
- **AND** the operation `GET /auth/me` does not exempt itself

#### Scenario: A public route requires nothing
- **WHEN** a client requests `GET /docs-json`
- **THEN** the operations `POST /auth/sign-up`, `POST /auth/sign-in`, `POST /auth/refresh` and `GET /health` each carry a security requirement that is satisfied by presenting nothing
