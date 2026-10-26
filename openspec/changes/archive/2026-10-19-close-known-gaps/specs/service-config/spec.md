# Spec Delta

## ADDED Requirements

### Requirement: The limits and the proxy are settings
The API SHALL read `RATE_LIMIT_TTL`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX` and `TRUST_PROXY` from the environment, SHALL apply a working default to each so that the application runs with none of them given, and SHALL refuse to start when one of them is not a number it can use.

#### Scenario: Limits default
- **WHEN** the application starts with none of the limits given
- **THEN** the window is 60 seconds, the general allowance is 120 and the allowance on routes taking a password is 10

#### Scenario: Nothing is trusted by default
- **WHEN** the application starts with no `TRUST_PROXY` given
- **THEN** no proxy hops are trusted

#### Scenario: A limit that is not a number stops the application
- **WHEN** the application starts with `RATE_LIMIT_MAX` set to `plenty`
- **THEN** startup fails with a message naming `RATE_LIMIT_MAX`
