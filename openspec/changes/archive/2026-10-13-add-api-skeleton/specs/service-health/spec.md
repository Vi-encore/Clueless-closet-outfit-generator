# Spec Delta

## Purpose

Lets people and tools check that the API process is running and able to answer requests.

## ADDED Requirements

### Requirement: Health check
The API SHALL answer `GET /health` with status 200 and the body `{ "status": "ok" }` while it is running.

#### Scenario: Service is up
- **WHEN** a client requests `GET /health`
- **THEN** the response status is 200
- **AND** the body is `{ "status": "ok" }`
