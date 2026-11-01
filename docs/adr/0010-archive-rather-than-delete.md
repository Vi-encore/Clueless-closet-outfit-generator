# 10. Things are archived, not deleted

- **Status:** accepted
- **Decided in:** `add-wardrobe-items`, roadmap step 5
- **Date:** 2026-10-19

## Context

An item leaves a wardrobe — worn out, given away, sold. The outfit history and
the statistics that follow it keep pointing at that item, and a row that goes
away takes them with it.

## Decision

`DELETE /items/:id` sets a status, records a reason from a fixed vocabulary and
the moment, and keeps the row. The verb is what a client means; archiving is
what happens.

Archiving an already archived item answers 200 and changes nothing, including
the moment. Archiving states something about the world rather than recording an
event, so a client retrying a request whose answer it never saw is right rather
than wrong, and the moment the item actually left is the first one.

Real deletion is an explicit act that does not exist yet.

## Consequences

- History and statistics cannot be broken from underneath.
- The table only grows, and "delete forever" will have to be built — for a
  person who asks, and for an account that closes.
- Reads have to say what they mean. A wardrobe excludes archived items unless
  asked, because the wardrobe somebody means is the part they can still wear.
- A fixed set of reasons makes them countable later, and `other` keeps nobody
  having to invent one.
