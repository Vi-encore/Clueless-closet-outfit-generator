# Spec Delta

## ADDED Requirements

### Requirement: A component, hook or class has its file to itself
Every package SHALL declare each component, each hook and each class in a file that declares nothing else at its top level, and SHALL keep the helper functions such a file uses in a `*.utils.ts` file, their constants in a `*.constants.ts` file, and any other component or hook in a file of its own. Tests and their fixtures, declaration files and generated code are exempt.

#### Scenario: No component, hook or class shares its file
- **WHEN** a package's source is examined
- **THEN** no file outside tests that declares a component, a hook or a class declares anything else at its top level

#### Scenario: A helper beside a component is found
- **GIVEN** a file that declares a component and a helper function
- **WHEN** it is checked
- **THEN** the helper is reported

#### Scenario: A file of one class passes
- **GIVEN** a file that declares one decorated class and its imports
- **WHEN** it is checked
- **THEN** nothing is reported

### Requirement: Exported constants live apart from logic
Every package SHALL keep each exported constant in a file that exports no function, class or component, and SHALL import it from there. A `const` whose value is a function counts as a function. Tests and their fixtures, declaration files and generated code are exempt.

#### Scenario: No file exports constants beside logic
- **WHEN** a package's source is examined
- **THEN** no file outside tests both exports a constant and exports a function, a class or a function-valued constant

#### Scenario: The check knows a constant from a function
- **GIVEN** a file that exports a list and a function written as `export const name = () => …`
- **WHEN** it is checked
- **THEN** the list is reported as an exported constant beside logic

#### Scenario: A constants file passes
- **GIVEN** a file that exports only values, such as lists, schemas and a context
- **WHEN** it is checked
- **THEN** nothing is reported
