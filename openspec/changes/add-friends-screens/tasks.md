# Tasks

## 1. The two lists the API lacks

- [x] 1.1 Claude writes the tests "A sent request is listed", "A request waiting for you is not one you sent", "An answered request leaves the list", "A block is listed", "Being blocked is not listed", "Two people can block each other", "A block cannot be lifted from under it", "Blocking back does not take a block over" and "Lifting both leaves nothing between them"
- [x] 1.2 Add `GET /friends/requests/sent` and `GET /friends/blocked`, and give each side of a pair its own block, by a hand-written migration that carries existing blocks across; verify the 1.1 tests pass

## 2. Your friends, and finding somebody

- [x] 2.1 Claude writes the tests "The desktop opens the friends screen", "A friend is named", "A friend without a display name goes by their username", "No friends says so", "A request is sent" and "Nobody by that name"
- [x] 2.2 Add `api/friends.ts`, `reload` on `useLoad`, and the labels
- [x] 2.3 Add the friends screen with the friends and sent-request sheets and the search form; verify the 2.1 tests pass
- [x] 2.5 Claude writes the test "The wardrobe leads back to the desktop", and the wardrobe gets the back button the card has, at the author's asking
- [x] 2.4 Make the desktop's choices stand out, the wardrobe and friends alike, since the author found them flat: pressable shortcuts rather than a blue link on grey. Show the screens to the author in a browser

## 3. Answering

- [x] 3.1 Claude writes the tests "Accepting makes a friend", "Declining removes the request" and "Withdrawing a request"
- [x] 3.2 Add the waiting-requests sheet and the withdraw button; verify the 3.1 tests pass

## 4. Ending things

- [ ] 4.1 Claude writes the tests "Removing a friend", "Changing one's mind", "Blocking a friend" and "Unblocking"
- [ ] 4.2 Add `ConfirmDialog`, with focus starting on Cancel
- [ ] 4.3 Add removing and blocking, and the blocked sheet; verify the 4.1 tests pass, then show it to the author in a browser

## 5. A friend's wardrobe

- [ ] 5.1 Claude writes the tests "A friend's shared items are shown", "Nothing shared says so" and "A stranger's wardrobe is simply not there"
- [ ] 5.2 Move `ItemTile` to `shell/`, and add the friend's wardrobe screen; verify the 5.1 tests pass

## 6. Together

- [ ] 6.1 Run both suites, the type check, the linter and the formatter
- [ ] 6.2 With two accounts in two browser tabs: ask, accept, see a shared item with its photograph, block, and confirm the blocked side sees only "nobody by that name"
- [ ] 6.3 Record what the screens decided in the roadmap
