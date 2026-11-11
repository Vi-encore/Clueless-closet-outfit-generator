# Design

## Decisions

### Who may read a conversation

Friends, said or not; somebody who blocked the other; and a former friend, where a conversation exists. Closed only to the person blocked, who gets the 404 a stranger gets, since anything else would announce the block.

"A conversation exists and they are not friends" is exactly "a former friend", because `send` only ever makes a conversation between friends. So the rule needs no record of a past friendship: the conversation is the record. Removing a friend deletes both `Friendship` records, so a former friend has no record at all, and the check that remains is the other person's block (`hasBlocked(other, viewer)`).

Alternative: hide the conversation from former friends, as the first draft of this change did. Rejected by the author: what was said stays with both people.

### One rule for the list and the history

Every conversation in the list exists, so for the list the rule comes down to: the viewer blocked the other person, or the other person has not blocked the viewer. It goes into the `members` filter of the existing `findMany`, and a conversation with nobody readable left comes back with no members and is skipped by the `flatMap` that already skips such rows. No extra query.

### The client learns why it cannot write from the friends list

`useConversation` already reads the blocked list to tell "you blocked them". It now reads `listFriends` as well (through `features/friends`'s `index.ts`): somebody the API let it read who is neither blocked nor a friend is a former friend. One `ClosedBecause` (`'blocked' | 'former-friend'`) replaces the `blocked` flag, so the screen has one reason or none. A pending request after a removal also counts as not a friend, which is right: nobody can write until it is accepted.

## Pitfalls

- In the list filter, the viewer's block is read from `friendshipsAboutMe` on the other user (records about them, held by the viewer), and the other person's block from their own `friendships` about the viewer. Mixing the two up would hide the conversation from whoever blocked.
- Mutual blocks: the viewer's own block wins, so both keep reading, as before this change.
