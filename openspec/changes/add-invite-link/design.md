# Design

## Context

- **The friends screen** (`features/friends/friends.tsx`) asks for somebody by typing, through `askToBeFriends` and `useFormSubmit`. It answers a 404 or a 400 with `uk.friends.nobody`, which hides on purpose whether the name is unknown or its owner blocked the person asking.
- **`RequireSession`** keeps `pathname + search + hash` as `from`, and `RequireGuest` returns there after signing in or up. `SignIn` passes that state on to `SignUp`.
- **`GET /users/:username`** answers anybody, blocks or not. The offer does not use it (decision 3).
- **Platform wrappers.** [architecture.md](../../../docs/architecture.md) plans thin wrappers for platform features (`camera`, `tokenStore`, `share`, `notifications`). None exists for sharing yet.

See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- One press to send a link from a phone, and one press to act on one.
- A link reveals nothing a typed username would not.

**Non-Goals:**
- Expiring or revocable invitations, QR codes, and deep links into an installed app.

## Decisions

### 1. `shareLink` in `shared/platform/`

`shared/platform/platform.utils.ts` exports `shareLink(link: SharedLink): Promise<ShareOutcome>`:

- **`navigator.share` exists** (and `canShare` accepts the data, where it exists): it calls it and returns `'shared'`. An `AbortError`, the person closing the sheet, returns `'cancelled'`. Any other error falls through to the clipboard.
- **Otherwise `navigator.clipboard.writeText`:** it returns `'copied'`. The clipboard needs a secure context and a user gesture. Both hold here: the tunnel is HTTPS, and this runs from a press.
- **Otherwise:** it returns `'unavailable'`, and the screen shows the link in a read-only field.

`SharedLink` and `ShareOutcome` go in `shared/platform/platform.interfaces.ts`. This is the wrapper a native shell would swap. Nothing else in the client touches `navigator.share`.

### 2. The link

`inviteLinkFor(username, origin)` in `friends.utils.ts` builds `${origin}/friends?add=${encodeURIComponent(username)}`, with `origin` taken from `window.location.origin` by the component. On the tunnel that is the tunnel's address, so a link sent today stops working when the tunnel does. That is acceptable for a PoC, and it is the price of having no fixed address.

The button's text is "Поділитися посиланням на себе". The share sheet gets `title: 'Clueless Closet'`, `text: uk.friends.inviteText` ("Додай мене в друзі в Clueless Closet") and the `url`.

### 3. The offer, without asking the API who it is

- **`invite-offer.tsx`** reads `add` with `useSearchParams` and shows a sheet: "Запросити в друзі: <username>?" with "Надіслати запит" and "Не зараз".
- **Sending** uses `askToBeFriends` through a `useMutation`. On success it invalidates `friendKeys.all` and removes `add` with `setSearchParams(…, { replace: true })`, so that the back button does not reopen the offer. A 404 or a 400 shows `uk.friends.nobody` in the error dialog, as typing does.
- **No `GET /users/:username`** to show a display name first. That route answers somebody who blocked you as readily as anybody else, so asking it would let a link tell "blocked you" apart from "does not exist", which the search deliberately does not. The username in the link is what the person was sent, so it is enough to name them.
- **One's own username** shows `uk.friends.ownLink` and a "Зрозуміло" button that removes `add`.

*Alternative:* send the request automatically on opening. The roadmap rules it out: a link someone forwarded, or opened by mistake, must not ask on the person's behalf.

### 4. Signing in on the way

Nothing new: the guard keeps the query. One scenario proves it, because losing `?add=` there would quietly break every link sent to somebody signed out.

## Risks / Trade-offs

- **[Trade-off]** A link carries a username, so anybody it is forwarded to can ask that person. That is no more than knowing the username, which is what the search takes.
- **[Risk]** The clipboard is refused on some browsers even with a gesture. → `'unavailable'` shows the link to copy by hand.
- **[Trade-off]** A tunnel's link dies with the tunnel. A fixed address is a hosting question for later steps.

## Migration Plan

Nothing to migrate. Rollback is a revert.
