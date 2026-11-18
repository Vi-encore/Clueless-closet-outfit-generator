# Proposal

## Why

Finding a friend today means typing their exact username, which is awkward on a phone and easy to get wrong. [Roadmap step 11](../../../docs/roadmap.md#step-11--pwa-and-phone-test) plans an invitation link instead.

A person sends a link to themselves through the phone's share sheet. Whoever opens it is offered to send a friend request, and nothing is sent until they press. People stay findable only by somebody who was told, as [data-model.md](../../../docs/data-model.md) asks.

The link is worth sending now: the app has an address a phone can open (`reach-from-a-phone`) and installs as an app (`add-pwa`). This is the last of step 11's three changes.

## What Changes

- **"Поділитися посиланням на себе" on the friends screen.** It builds `<the app's origin>/friends?add=<username>` and hands it on in the best way the device allows:
  - the system share sheet where there is one (`navigator.share`);
  - otherwise the clipboard, with a line saying so;
  - and where neither works, the link shown in a field to copy by hand.

  Cancelling the share sheet says nothing.
- **A thin `share` wrapper in `shared/platform/`,** as [architecture.md](../../../docs/architecture.md) planned for platform features. A native shell would later replace only it.
- **Opening a link offers to ask.** `/friends?add=<username>` shows, on top of the friends screen, an offer naming the person with two buttons:
  - "Надіслати запит" sends the request, refreshes the lists and removes `add` from the address;
  - "Не зараз" removes `add` and sends nothing.
- **The offer never asks the API who that is.** It shows the name from the link. Somebody unknown, or somebody who blocked the person, is answered after pressing with the same "nobody by that name" as typing the name would give, so a link reveals no more than the search does.
- **One's own link** says it is one's own, with nothing to send.
- **Signed out,** the link survives signing in or signing up. The session guard already returns to the address that was interrupted, query included.

Out of scope:

- **Links that expire or can be revoked,** and invitation codes. A username is already what the search takes.
- **Deep links into an installed app from other apps.** The link opens wherever the phone opens links.
- **QR codes.**

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `web-friends`: adds sharing a link to oneself, and the offer an invitation link opens.

## Impact

- **`apps/web`:**
  - `shared/platform/platform.utils.ts` (`shareLink`) and its interfaces;
  - in `features/friends/`, `invite-link.tsx` (the button and its outcome), `invite-offer.tsx` (the offer) and `friends.utils.ts` (`inviteLinkFor`);
  - the friends screen shows both;
  - new words in `uk.ts`.
- **No API change:** asking goes through `POST /friends/:username` as typing does.
- **Docs:** `docs/social.md` (finding friends), `docs/roadmap.md` (step 11 done, apart from the checks that need hosting), `openspec/config.yaml`.
