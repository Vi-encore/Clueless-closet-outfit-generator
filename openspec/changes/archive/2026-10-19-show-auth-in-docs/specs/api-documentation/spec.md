# Spec Delta

## ADDED Requirements

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
