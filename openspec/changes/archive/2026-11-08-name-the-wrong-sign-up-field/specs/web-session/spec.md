## ADDED Requirements

### Requirement: A refused registration names the field
The client SHALL say, when the API refuses a registration's details, which field it refused and what that field has to be, one line per refused field, SHALL say nothing about a field the API accepted, and SHALL tell a person what a username may contain before they send it.

#### Scenario: A wrong username is named
- **GIVEN** an API that refuses the username
- **WHEN** a person registers
- **THEN** the message says what a username has to be
- **AND** it says nothing about the password

#### Scenario: A short password is named
- **GIVEN** an API that refuses the password
- **WHEN** a person registers
- **THEN** the message says the password needs at least 10 characters
- **AND** it says nothing about the username

#### Scenario: Two refused fields are both named
- **GIVEN** an API that refuses the email and the username
- **WHEN** a person registers
- **THEN** the message names both

#### Scenario: The username's rule is shown before sending
- **WHEN** the registration form is opened
- **THEN** the username field says which characters it accepts and how many
