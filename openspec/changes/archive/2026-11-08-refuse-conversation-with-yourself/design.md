# Design

## Context

`readableConversation` began as "friends, or yourself" (`other.id !== viewerId && !areFriends`), copied from the items rule where reading your own wardrobe is the point. For a conversation it never was: a conversation is made by its first message, and `send` has refused yourself from the start. The two rules disagreed, and the history's was the one the client saw.

## Decisions

### 404 `No such person`, not 400

A refusal for yourself leaks nothing, so 400 would not be wrong in itself. But the client already treats a 404 on this route as "there is no such conversation" and shows `NotFound`; a 400 would be one more answer to handle for the same outcome. Answering exactly as for a stranger keeps one rule: a conversation exists only with somebody you may write to (or blocked).

Alternative: keep 400 on `message:send` and only close the history. Rejected, because the gateway would then have two refusals for "you cannot write here".

### The check sits beside the lookup

`ChatService` gets one private method that finds the other person and refuses the viewer's own name, used by `send` and `readableConversation`. That is the shape `FriendsService.request` has: look up, then compare ids, before anything else. `typingTo` stays as it is, since `areFriends(me, me)` is false.

### The client does not ask

`Conversation` compares the address with the signed-in account's username and renders `NotFound` before `ConversationWindow` mounts, so no history, person, blocked list or mark-read request goes out. Comparing names is enough: a username is unique and lower-case on both sides. The API rule stays the authority; this only spares the round trip and the flash of an empty window.

## Pitfalls

- The guard has to be outside `ConversationWindow`. A hook cannot be skipped by an early return, and `useConversation` starts its requests on mount.
- `useSession` is reached through `features/session`'s `index.ts`, as `use-conversation.ts` already does.
