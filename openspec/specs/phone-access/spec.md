# phone-access Specification

## Purpose
Covers reaching the whole application from a phone through one HTTPS address: the client, its API calls, the chat's connection and the photographs, with the session kept across reloads.

## Requirements

### Requirement: The client can reach the API at a relative address
The client SHALL accept an API address that is a path on its own origin, SHALL send its requests there, and SHALL open the chat's connection on that origin under that path, so that one address serves the client and the API together.

#### Scenario: Requests go to the relative address
- **GIVEN** the API address is `/api`
- **WHEN** the client asks for the signed-in account
- **THEN** the request goes to `/api/auth/me` on the page's own origin

#### Scenario: The chat connects under the same path
- **GIVEN** the API address is `/api`
- **WHEN** the chat connects
- **THEN** it connects to the page's own origin with the Socket.IO path `/api/socket.io`

#### Scenario: An absolute address is used as it is
- **GIVEN** the API address is `http://localhost:3000`
- **WHEN** the chat connects
- **THEN** it connects to `http://localhost:3000` with the default Socket.IO path

### Requirement: One address serves the client, the API and the photos
The development server SHALL, in its phone mode, pass requests under `/api` to the API with the prefix removed, including the chat's WebSocket, SHALL pass requests under `/storage` to the object store with the prefix removed, SHALL accept the tunnel's hosts, and SHALL rewrite the refresh cookie's path so that the browser sends it back through the same address.

#### Scenario: The phone mode proxies the API and the store
- **WHEN** the development server's configuration is built for the phone mode
- **THEN** `/api` goes to the API with WebSockets allowed and the prefix removed
- **AND** `/storage` goes to the object store with the prefix removed
- **AND** hosts under `.trycloudflare.com` are allowed

#### Scenario: The refresh cookie keeps working through the proxy
- **WHEN** the development server's configuration is built for the phone mode
- **THEN** a cookie the API sets for `/auth/refresh` is passed on for `/api/auth/refresh`

#### Scenario: Ordinary development is unchanged
- **WHEN** the development server's configuration is built for development
- **THEN** it proxies nothing, and the client talks to the API across origins as before

#### Scenario: On a phone, the application works end to end
- **GIVEN** the API and the client in phone mode behind a Cloudflare Quick Tunnel
- **WHEN** a person opens the tunnel's address on a phone, signs in, reloads, opens the wardrobe, adds an item with the camera and writes in the chat
- **THEN** they stay signed in after the reload
- **AND** the photos are shown
- **AND** the new item is saved with its photograph
- **AND** the message arrives on another device
