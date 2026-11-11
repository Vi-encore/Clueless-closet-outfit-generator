# Proposal

## Why

`GET /conversations` lists every conversation a person is a member of, but the history behind an entry answered 404 unless the two were friends or the viewer was the one who blocked. So the list offered entries that opened onto the not-found window. It was seen with `friendcheck`, whom `formcheck` had blocked: the chat list showed `formcheck` with 8 unread, the desktop counted them, and opening it said "not found". For the person blocked, the entry also contradicted the 404: the history hides a block, while a list still counting unread messages says the person is there.

The same rule closed the history between former friends, which the author decided against: what two people said stays readable to both of them after a friendship ends, as it already does for whoever blocked.

## What Changes

- **A former friend can read the conversation.** The history and marking read answer 404 only when the two are not friends and have no conversation, or when the other person blocked the viewer. Writing still needs a friendship.
- **`GET /conversations` lists only the conversations whose history the viewer may read.** In practice that leaves out exactly the ones where the other person blocked the viewer. The unread count and the desktop total follow, since both are read from this list. Nothing is deleted.
- **The client shows a former friend's conversation read-only,** with its history, no field to write in, and a line saying they are no longer friends, as it already does for somebody the person blocked.

Out of scope:
- **What the blocked person's other devices show live** until they next fetch the list.
- **Hiding or archiving a conversation by hand.**

## Capabilities

### Modified Capabilities
- `chat`: a former friend may read the history; the list holds only conversations that open.
- `web-chat`: a conversation with a former friend is read-only.

## Impact

- `apps/api/src/chat/chat.service.ts` (`readableConversation`, `conversationsOf`) and `apps/api/test/chat.db-spec.ts`.
- `apps/web/src/features/chat/` (`use-conversation.ts`, `conversation.tsx`, `chat.interfaces.ts`, `chat.spec.tsx`), `features/friends/index.ts` (exports `listFriends`), `shared/i18n/uk.ts`, `test/server-data.spec.tsx`.
- No change to the database, the routes or the shape of any answer.
