# Spec Delta

## ADDED Requirements

### Requirement: Phone mode can serve a build
The client SHALL offer, in its phone mode, to build itself and serve that build with the same proxy, the same refresh-cookie rewrite and the same allowed hosts as the development server, so that a phone through the tunnel sees the installable app with its service worker.

#### Scenario: The preview proxies as the server does
- **WHEN** the preview's configuration is built for the phone mode
- **THEN** `/api` and `/storage` are proxied as in the development server
- **AND** hosts under `.trycloudflare.com` are allowed

#### Scenario: Installed from a phone through the tunnel
- **GIVEN** the phone-mode build served behind the tunnel
- **WHEN** a person installs it on Android with the offer, and on an iPhone with the hint
- **THEN** it opens from the home screen without the browser's bars, with its own icon
- **AND** a person who signs in stays signed in after closing and reopening it
