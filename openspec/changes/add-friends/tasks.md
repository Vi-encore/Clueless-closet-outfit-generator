# Tasks

## 1. The record, and finding a person

- [x] 1.1 Claude writes the tests "Person found", "Nothing private is returned", "Case does not matter", "Nobody by that name", "One record per pair", "Who asked is kept" and "Removed with either person"
- [x] 1.2 Add the `Friendship` model with the sorted pair, `@@unique([userAId, userBId])`, `requestedById`, `blockedById` and cascading deletes, and generate the migration
- [x] 1.3 Add the users module with `GET /users/:username`, lowercasing the name before the lookup and returning a public view that carries no email
- [x] 1.4 Verify the 1.1 tests pass

## 2. Asking, and answering

- [x] 2.1 Claude writes the tests "Request recorded", "Asking back agrees", "Asking twice changes nothing", "Nobody befriends themselves", "Incoming request listed", "Your own asking is not waiting for you", "Request accepted" and "The asker cannot accept their own request"
- [x] 2.2 Add the friends service with the sorted-pair helper and `areFriends`, which `add-chat` will ask later
- [x] 2.3 Add `POST /friends/:username`, turning a crossing request into an accepted friendship and a unique violation into that same answer rather than a 500
- [x] 2.4 Add `GET /friends/requests` and `POST /friends/:username/accept`, refusing the asker's own acceptance; verify the 2.1 tests pass

## 3. Listing and ending

- [x] 3.1 Claude writes the tests "Friend listed", "A pending request is not a friend", "Friendship ended", "Request declined" and "Nothing to remove"
- [x] 3.2 Add `GET /friends`, mapping each record to whichever person is not the viewer
- [x] 3.3 Add `DELETE /friends/:username` as the one way to reach "not connected"; verify the 3.1 tests pass

## 4. Blocking

- [ ] 4.1 Claude writes the tests "Blocking ends a friendship", "A blocked person cannot ask again", "Only the blocker can lift the block" and "Unblocking leaves nothing behind"
- [ ] 4.2 Add `POST /friends/:username/block`, which overwrites whatever relation existed and records who blocked
- [ ] 4.3 Make `DELETE /friends/:username` refuse anybody but `blockedById` when the relation is blocked, and make a blocked pair refuse new requests; verify the 4.1 tests pass

## 5. A friend's wardrobe

- [ ] 5.1 Claude writes the tests "Friend sees a shared item", "Private items stay private", "A stranger is told nothing", "A friend still cannot read an item by id" and "Archived items are not shared"
- [ ] 5.2 Add `ItemsService.listVisibleTo`, answering 404 rather than an empty list when the two are not friends, and leaving `ownedOrNotFound` untouched
- [ ] 5.3 Add `GET /users/:username/items`; verify the 5.1 tests pass and the whole suite stays green
