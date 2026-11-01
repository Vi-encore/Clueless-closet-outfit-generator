# Spec Delta

## ADDED Requirements

### Requirement: A refused form opens a dialog
The client SHALL answer a form it could not complete with a small error window that interrupts the screen, names the problem, and can be dismissed with its button or with Escape, returning the person to the form as they left it.

#### Scenario: A refused form opens a dialog
- **WHEN** a form cannot be completed
- **THEN** an error window naming the problem is shown

#### Scenario: The dialog is dismissed with OK
- **GIVEN** an error window on a form
- **WHEN** the person presses OK
- **THEN** the window is gone
- **AND** the form still holds what they entered

#### Scenario: Escape dismisses the dialog
- **GIVEN** an error window on a form
- **WHEN** the person presses Escape
- **THEN** the window is gone
