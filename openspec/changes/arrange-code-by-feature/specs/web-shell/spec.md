## ADDED Requirements

### Requirement: The client's code is grouped by feature
The client SHALL keep each feature's code (its API calls, interfaces, hooks, screens, styles and tests) in a folder of its own under `features/`, SHALL keep what several features use under `shared/`, SHALL let one feature reach another only through that feature's `index.ts`, and SHALL load every stylesheet into the `components` cascade layer, so that a feature can be read, changed or removed in one place without Tailwind's utilities losing to it.

#### Scenario: A feature is reached through its index
- **WHEN** the client's source is examined
- **THEN** no file in one feature imports a file inside another feature other than its `index.ts`

#### Scenario: Shared code knows no feature
- **WHEN** the client's source is examined
- **THEN** no file under `shared/` imports from `features/` or `app/`

#### Scenario: Every stylesheet is in the components layer
- **WHEN** the client's source is examined
- **THEN** every stylesheet under `src/` is imported by `index.css` into the `components` layer, and no component imports a stylesheet
