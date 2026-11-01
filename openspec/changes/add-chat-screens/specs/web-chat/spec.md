# Spec Delta

## ADDED Requirements

### Requirement: The connection lives with the session
The client SHALL connect the socket when a session starts, SHALL close it when the session ends, and SHALL renew an expired access token and connect again when the handshake is refused.

#### Scenario: Signing in connects
- **WHEN** a person signs in
- **THEN** the socket connects with their access token

#### Scenario: Signing out disconnects
- **GIVEN** a person with a connected socket
- **WHEN** they sign out
- **THEN** the socket is closed

#### Scenario: An expired token is renewed
- **GIVEN** a handshake refused as unauthorized
- **WHEN** the client tries again
- **THEN** it connects with a renewed token

### Requirement: Conversations are listed by the last word
The client SHALL show the signed-in person's conversations, most recent first, with how many messages are unread, SHALL show the total on the desktop's shortcut, and SHALL offer a way into a conversation from a friend.

#### Scenario: A conversation shows what is unread
- **GIVEN** a conversation with two unread messages
- **WHEN** the chat screen is opened
- **THEN** the other person's name and the count are shown

#### Scenario: The desktop shows the total
- **GIVEN** conversations with three unread messages between them
- **WHEN** the desktop is shown
- **THEN** the chat shortcut says three

#### Scenario: No conversations says so
- **GIVEN** a person with no conversations
- **WHEN** the chat screen is opened
- **THEN** a message is shown instead of a list

#### Scenario: A friend leads to a conversation
- **GIVEN** a person with a friend
- **WHEN** they choose to write to the friend
- **THEN** the conversation with that friend is shown

#### Scenario: A message arriving moves the list
- **GIVEN** the chat screen open
- **WHEN** a message arrives on the socket
- **THEN** that conversation shows one more unread

### Requirement: A conversation is read a page at a time
The client SHALL show a conversation's messages oldest to newest, SHALL offer earlier ones while there are any, and SHALL mark the conversation as read when it is opened and while it is open, but only while a person can see it.

#### Scenario: Messages are in order
- **GIVEN** a conversation with three messages
- **WHEN** it is opened
- **THEN** they are shown oldest first

#### Scenario: Earlier messages can be asked for
- **GIVEN** a conversation longer than a page
- **WHEN** the person asks for earlier messages
- **THEN** they appear above the others

#### Scenario: Opening marks it read
- **WHEN** a conversation is opened
- **THEN** the API is told it was read

#### Scenario: A hidden tab reads nothing
- **GIVEN** a conversation open in a tab nobody is looking at
- **WHEN** a message arrives
- **THEN** the API is not told it was read

#### Scenario: Looking at it again reads it
- **GIVEN** a conversation open in a tab nobody is looking at
- **WHEN** the person returns to the tab
- **THEN** the API is told it was read

### Requirement: A message appears at once and settles when acknowledged
The client SHALL show a sent message immediately as waiting, SHALL mark it sent when the gateway acknowledges it, and SHALL offer to send it again under the same id when no acknowledgement comes or the gateway refuses it.

#### Scenario: A message appears at once
- **WHEN** a person sends a message
- **THEN** it is shown as waiting before any answer arrives

#### Scenario: The acknowledgement settles it
- **GIVEN** a message waiting
- **WHEN** the gateway acknowledges it
- **THEN** it is shown as sent

#### Scenario: A refused message can be tried again
- **GIVEN** a message the gateway refused
- **WHEN** the person tries again
- **THEN** it is sent under the same id

### Requirement: Messages arrive live
The client SHALL show a message arriving on the socket in the conversation it belongs to, once, whether it came from the other person or from the sender's own other device.

#### Scenario: A message from the other person appears
- **GIVEN** a conversation open
- **WHEN** a message for it arrives on the socket
- **THEN** it is shown

#### Scenario: A message for another conversation stays out
- **GIVEN** a conversation open
- **WHEN** a message for a different one arrives
- **THEN** it is not shown

#### Scenario: Your own message is not shown twice
- **GIVEN** a message the person sent, already shown
- **WHEN** the same message arrives on the socket
- **THEN** it is shown once

### Requirement: A dropped connection catches up
The client SHALL say when the connection is lost, and SHALL fetch what it missed when it returns, without reading again what it already has.

#### Scenario: A lost connection says so
- **GIVEN** a conversation open
- **WHEN** the connection drops
- **THEN** a message says so

#### Scenario: Coming back fetches what was missed
- **GIVEN** a conversation open whose connection dropped
- **WHEN** it reconnects
- **THEN** the API is asked for what came after the last message shown
- **AND** those messages are shown

### Requirement: Typing is shown
The client SHALL tell the other person it is typing, no more than once in a few seconds, and SHALL show when they are, for a few seconds or until their message arrives.

#### Scenario: Typing is announced, but not on every key
- **WHEN** a person types several characters quickly
- **THEN** the other person is told once

#### Scenario: Their typing is shown
- **GIVEN** a conversation open
- **WHEN** the other person is typing
- **THEN** it is shown

#### Scenario: It goes away on its own
- **GIVEN** the other person shown as typing
- **WHEN** a few seconds pass with nothing more
- **THEN** it is no longer shown

#### Scenario: Their message ends it
- **GIVEN** the other person shown as typing
- **WHEN** their message arrives
- **THEN** it is no longer shown
