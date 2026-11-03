## ADDED Requirements

### Requirement: Shapes are named in interfaces files
Every package SHALL declare each interface, each type alias written out by hand, and each object type that would otherwise be spelled inline in a parameter, an assertion or a type argument, in a file named `*.interfaces.ts`, and SHALL import it from there. A type computed from a value with `typeof` MAY stay beside that value. Declaration files (`*.d.ts`) and generated code are exempt.

#### Scenario: A shape is declared in an interfaces file
- **WHEN** a package's source and tests are examined
- **THEN** every interface and every type alias that is not computed with `typeof` is in a `*.interfaces.ts` file

#### Scenario: No object type is written inline
- **WHEN** a package's source and tests are examined
- **THEN** no file outside an interfaces file types a destructured parameter, an assertion or a type argument with an object type written in place

### Requirement: Nothing is typed any
Every package SHALL type its values without `any`, and the linter SHALL refuse an explicit `any`.

#### Scenario: No source says any
- **WHEN** a package's source and tests are examined
- **THEN** no type annotation, assertion, type argument or array type is `any`
