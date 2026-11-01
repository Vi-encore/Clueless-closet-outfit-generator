# web-shell Specification

## Purpose
Covers the frame every screen is drawn into and how a URL picks one: the window, the taskbar, the routes, and the single dictionary that holds every word a person reads, so that a screen added later inherits all of it instead of inventing it.

## Requirements

### Requirement: Every screen is a window
The client SHALL draw each screen inside a window frame carrying that screen's name, SHALL treat the frame's close control as going back, and SHALL show the taskbar on every screen, so that a screen added later inherits the frame instead of inventing one.

#### Scenario: The frame names the screen
- **WHEN** a screen is shown
- **THEN** its name is in the window's title bar

#### Scenario: Closing goes back
- **GIVEN** a person who has opened a screen from another one
- **WHEN** they use the window's close control
- **THEN** the screen they came from is shown

#### Scenario: The taskbar is always there
- **WHEN** any screen is shown
- **THEN** the taskbar is shown with it

### Requirement: The URL decides the screen
The client SHALL route by URL, SHALL answer a path it does not know with a window saying so, SHALL send somebody who is not signed in to the sign-in screen when they ask for a screen that needs a session, and SHALL take them on to where they were going once they have signed in.

#### Scenario: An unknown path says so
- **WHEN** a path nothing matches is opened
- **THEN** a window saying the screen was not found is shown

#### Scenario: A screen that needs a session asks for one
- **GIVEN** nobody is signed in
- **WHEN** a screen that needs a session is opened
- **THEN** the sign-in screen is shown

#### Scenario: Signing in continues where it was interrupted
- **GIVEN** somebody was sent to the sign-in screen from another screen
- **WHEN** they sign in
- **THEN** the screen they asked for is shown

### Requirement: Ukrainian text comes from one dictionary
The client SHALL take every word a person reads from a single dictionary module, and SHALL hold no such text in a component, so that the interface language stays in one file while the code around it is English.

#### Scenario: A label reads its text from the dictionary
- **WHEN** a screen with a labelled control is shown
- **THEN** the label is the dictionary's text for it

#### Scenario: No component holds its own
- **WHEN** the client's source is examined
- **THEN** no file outside the dictionary contains Cyrillic text

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
