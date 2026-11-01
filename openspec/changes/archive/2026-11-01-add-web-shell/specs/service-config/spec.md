# Spec Delta

## ADDED Requirements

### Requirement: The origins a browser may call from are configured
The application SHALL read the origins allowed to call it, and the refresh cookie's `SameSite` attribute, from its environment, SHALL refuse to start when an origin is not a valid origin, and SHALL default to allowing nothing cross-origin, so that a deployment opens the API to a client deliberately rather than by inheriting a permissive default.

#### Scenario: Origins are read as a list
- **WHEN** the environment names two origins separated by a comma
- **THEN** both are allowed

#### Scenario: Nothing is allowed by default
- **WHEN** the environment names no origins
- **THEN** no cross-origin request is allowed

#### Scenario: A nonsense origin stops the application
- **WHEN** the environment names an origin that is not a URL
- **THEN** the application does not start
