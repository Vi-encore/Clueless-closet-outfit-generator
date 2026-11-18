# web-install Specification

## Purpose
Covers installing the client as an app on a phone or a computer: what it declares about itself, what its service worker keeps and never keeps, how it offers to be installed where the browser allows and explains how where it does not, and how the installed app sits around a notch.

## Requirements

### Requirement: The client declares itself installable
The client SHALL publish a web app manifest naming it "Clueless Closet", short "Closet", opening standalone at `/` with the theme's colours, and with icons of 192 and 512 pixels, including a maskable one. Its page SHALL link the manifest and an Apple touch icon, and SHALL state the theme colour.

#### Scenario: The manifest says what the app is
- **WHEN** the client's manifest is read
- **THEN** its name is "Clueless Closet" and its short name "Closet"
- **AND** it opens standalone at `/`
- **AND** it has a 192-pixel icon, a 512-pixel icon and a maskable icon

#### Scenario: The page points at the manifest and the Apple icon
- **WHEN** the built page is read
- **THEN** it links the manifest, an Apple touch icon and a theme colour

### Requirement: The shell is cached and server data never is
The client's service worker SHALL precache the built client so that the app opens from it, SHALL answer a navigation with the cached page, and SHALL leave every request under `/api` and `/storage` to the network, untouched and uncached.

#### Scenario: The built client is precached
- **WHEN** the service worker's configuration is read
- **THEN** it precaches the built scripts, styles, page and icons

#### Scenario: The API and the photos go to the network
- **WHEN** the service worker's configuration is read
- **THEN** navigations under `/api` and `/storage` are not answered from the cache
- **AND** no runtime cache covers `/api` or `/storage`

### Requirement: Where the browser offers installing, the app does too
The client SHALL keep the browser's install event when one arrives, SHALL then offer to install on the desktop window, SHALL open the browser's own prompt when the offer is pressed, and SHALL stop offering once the prompt has been answered or the app runs installed.

#### Scenario: The offer appears with the browser's event
- **GIVEN** a browser that fires its install event
- **WHEN** the desktop is shown
- **THEN** a button offers to install the app

#### Scenario: Pressing it opens the browser's prompt
- **GIVEN** the offer on the desktop
- **WHEN** the person presses it
- **THEN** the browser's install prompt is opened
- **AND** the offer is gone

#### Scenario: Without the event there is no button
- **GIVEN** a browser that never fires an install event
- **WHEN** the desktop is shown
- **THEN** no install button is shown

### Requirement: An iPhone is told how to install
The client SHALL show, in Safari on an iPhone or an iPad that is not running the installed app, a short hint on adding the app to the home screen, SHALL let the person dismiss it, and SHALL not show it again in that browser once dismissed.

#### Scenario: The hint is shown in Safari on an iPhone
- **GIVEN** an iPhone's Safari, not running installed
- **WHEN** the desktop is shown
- **THEN** the hint on adding to the home screen is shown

#### Scenario: A dismissed hint stays dismissed
- **GIVEN** a person who dismissed the hint
- **WHEN** the desktop is shown again
- **THEN** the hint is not shown

#### Scenario: The installed app shows no hint
- **GIVEN** the app running installed on an iPhone
- **WHEN** the desktop is shown
- **THEN** neither the hint nor an install button is shown

### Requirement: The installed app keeps clear of the notch
The client SHALL keep its windows below the top safe area and its taskbar above the bottom one, so that an installed app with no browser bars is not covered by a notch or a home indicator.

#### Scenario: Installed on an iPhone, nothing hides under the notch
- **GIVEN** the app installed on an iPhone with a notch
- **WHEN** it is opened
- **THEN** the top of the window and the taskbar are fully visible
