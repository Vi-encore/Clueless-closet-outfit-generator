# Spec Delta

## ADDED Requirements

### Requirement: A new version takes over at once
The client's service worker SHALL take over as soon as a new version of the client is installed, without waiting for every tab of the app to close, so that a person who opens the app again after an update sees that update.

#### Scenario: An update is not left waiting
- **GIVEN** the app was built with a newer version than the one a phone has cached
- **WHEN** the phone opens the app
- **THEN** the new service worker skips waiting and claims the open pages
