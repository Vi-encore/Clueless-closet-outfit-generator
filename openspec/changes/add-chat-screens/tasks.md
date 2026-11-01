# Tasks

## 1. What the API lacks

- [x] 1.1 Claude writes the tests "A known origin may connect", "An unknown origin may not", "New messages are unread", "Your own messages are not unread", "Reading clears the count", "A later message is unread again", "Reading is one person's", "A stranger marks nothing", "A friend sees it" and "A stranger hears nothing"
- [x] 1.2 Give the socket the configured origins through an adapter, in `setupBrowserAccess`
- [x] 1.3 Add unread counts to `GET /conversations` in one query, and `POST /conversations/with/:username/read`
- [x] 1.4 Add `typing` to the gateway and the broadcaster; verify the 1.1 tests pass

## 2. A connection that lives with the session

- [x] 2.1 Claude sets up the socket test server and writes the tests "Signing in connects", "Signing out disconnects" and "An expired token is renewed"
- [x] 2.2 Add `socket.io-client` and `platform/chat-socket.ts`
- [x] 2.3 Add the chat context and provider, with the renewal on a refused handshake; verify the 2.1 tests pass, and explain the connection's life in the report

## 3. The list

- [x] 3.1 Claude writes the tests "A conversation shows what is unread", "The desktop shows the total", "No conversations says so", "A friend leads to a conversation" and "A message arriving moves the list"
- [x] 3.2 Add `api/chat.ts`, the chat screen, the shortcut with its count, and the way in from a friend; verify the 3.1 tests pass, then show it to the author in a browser

## 4. A conversation

- [x] 4.1 Claude writes the tests "Messages are in order", "Earlier messages can be asked for", "Opening marks it read", "A message appears at once", "The acknowledgement settles it" and "A refused message can be tried again"
- [x] 4.2 Add `use-conversation.ts` and the conversation screen; verify the 4.1 tests pass, explain the two lives of a message in the report, and show it to the author in a browser

## 5. Live, and after a drop

- [ ] 5.1 Claude writes the tests "A message from the other person appears", "A message for another conversation stays out", "Your own message is not shown twice", "A lost connection says so" and "Coming back fetches what was missed"
- [ ] 5.2 Merge live messages by id, and catch up on reconnecting; verify the 5.1 tests pass, and explain delivery and catching up in the report

## 6. Typing

- [ ] 6.1 Claude writes the tests "Typing is announced, but not on every key", "Their typing is shown", "It goes away on its own" and "Their message ends it"
- [ ] 6.2 Add sending and showing it; verify the 6.1 tests pass

## 7. Together

- [ ] 7.1 Run both suites, the type check, the linter and the formatter
- [ ] 7.2 With two accounts in two browsers: a first message, a reply, "typing…", unread on the list and the shortcut, the API restarted mid-conversation to prove catching up, and a block stopping the conversation. Then the same at phone width
- [ ] 7.3 Tick what step 8 now satisfies in the roadmap, and write down what the chat decided about data fetching
