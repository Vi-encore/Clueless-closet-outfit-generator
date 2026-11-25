# Spec Delta

## ADDED Requirements

### Requirement: A password can be shown while it is typed
The client SHALL offer, under the password field of the sign-in and the sign-up forms, a "Показати пароль" checkbox, unticked by default, that shows the password as text while ticked and hides it again when unticked, without changing what the form sends.

#### Scenario: Hidden by default
- **WHEN** the sign-in form is shown
- **THEN** the password field hides what is typed

#### Scenario: Shown, then hidden again
- **GIVEN** a password typed on the sign-in form
- **WHEN** the person ticks "Показати пароль"
- **THEN** the password field shows what was typed
- **WHEN** they untick it
- **THEN** it hides it again

#### Scenario: On the sign-up form too
- **WHEN** the person ticks "Показати пароль" on the sign-up form
- **THEN** its password field shows what is typed

#### Scenario: Shown or not, the same password is sent
- **GIVEN** a password typed with the checkbox ticked
- **WHEN** the person signs in
- **THEN** the API is sent that password
