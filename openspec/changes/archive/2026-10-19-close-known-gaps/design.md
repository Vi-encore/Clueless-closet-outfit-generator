# Design

## Context

Four unrelated repairs in one change, held together by when they are cheapest rather than by what they touch. Each is small; two of them have a trap that the obvious implementation walks straight into.

## Goals / Non-Goals

**Goals:** the four gaps closed, with the two traps named and tested.

**Non-Goals:** reuse detection, email confirmation, a scheduled sweep, pagination anywhere else.

## Decisions

### 1. The email schema validates after normalising, not before

The obvious line is `z.email().trim().toLowerCase()`. It half works, and the half it drops is the one a phone keyboard produces. Verified against zod 4.6.5:

| Input | `z.email().trim().toLowerCase()` | `z.string().trim().toLowerCase().pipe(z.email())` |
| --- | --- | --- |
| `Cher@Example.COM` | `cher@example.com` | `cher@example.com` |
| `  cher@example.com  ` | **fails** | `cher@example.com` |
| `not-an-email` | fails | fails |

Checks run in the order they are written, so the email check sees the raw string and rejects the padding before `.trim()` ever runs. `.pipe()` puts the validation after the transforms, where it belongs.

The schema lives in `src/auth/requests/email.ts` and is used by sign-up and sign-in both, for the same reason `usernameSchema` is shared: a normalisation applied in one place and not the other is worse than none, because sign-up would succeed and sign-in would fail.

There is no data to migrate - the database holds only test rows - but a deployed instance would need its existing addresses lowercased first, and the unique index rebuilt.

### 2. The cursor is an item's id, not an encoded position

Prisma takes `cursor: { id }` with `skip: 1`, so no composite value has to be encoded, passed around and parsed back. What it needs in exchange is a **total order**: `orderBy: { createdAt: 'desc' }` alone is not one, because two items created in the same millisecond can come back in either order and a page boundary could then repeat or skip a row. So the order is `[{ createdAt: 'desc' }, { id: 'desc' }]`, and the id is already unique.

Whether there is a next page is answered by asking for one row more than the page size and throwing it away:

```ts
const rows = await this.prisma.item.findMany({ take: limit + 1, ... });
const items = rows.slice(0, limit);
const nextCursor = rows.length > limit ? items.at(-1)!.id : null;
```

A `count` query would be a second round trip to answer a question nobody asked - the client needs "is there more", not "how many".

### 3. The page is an object, and that is the breaking part

`GET /items` answers `{ items, nextCursor }` rather than a bare array. Both list routes change together, and the existing tests that index into `response.body` change with them. This is the whole reason the repair is happening now rather than after step 8.

### 4. Clearing tokens happens where tokens are written

`issue()` already writes a row for this user. Deleting their expired ones in the same method costs one statement and no scheduler, no new process, nothing to notice has stopped.

**By `expiresAt`, never by `usedAt`** - the rule recorded in the roadmap. A spent but unexpired token is evidence: presenting one almost always means it was stolen, and deleting those rows would make a replayed token indistinguishable from an invented one, closing the door on reuse detection before it is built.

Abandoned accounts are never swept, because nobody signs in to them. That is the known limit of doing this here instead of in a scheduled job.

### 5. The limits are configuration, and so is trusting the proxy

A rate limiter counts per client address. Behind a proxy every request arrives from the proxy, so either the limiter counts the whole world as one caller and bans everybody together, or it reads `X-Forwarded-For` - which a client can forge unless something in front is known to rewrite it.

Express decides this with `trust proxy`, and guessing is wrong in both directions. So `TRUST_PROXY` is a setting: the number of proxy hops to trust, `0` by default, meaning the socket address is used and nothing is believed. A deployment behind one proxy sets `1`.

Four settings, all with defaults, so nothing new is required to run the app:

| Setting | Default | What it is |
| --- | --- | --- |
| `RATE_LIMIT_TTL` | 60 | the window, in seconds |
| `RATE_LIMIT_MAX` | 120 | requests per window, per address |
| `AUTH_RATE_LIMIT_MAX` | 10 | the same window, on routes that take a password |
| `TRUST_PROXY` | 0 | proxy hops to believe |

### 6. The tighter limit goes on the routes that take a password

Sign-up, sign-in and refresh. Those are the ones worth guessing at; listing a wardrobe is not. `@Throttle` carries the tighter allowance per route, so the general limit stays general.

### 7. The throttler guard is registered before the auth guard

Both are `APP_GUARD` providers and Nest runs them in registration order. Throttling first means a flood is refused before any work is done on it - including an argon2 verification, which is the most expensive thing a sign-in does and exactly what a flood would be aiming at.

## Common pitfalls

- **The existing suites will meet the limiter.** `auth.db-spec.ts` signs in many times in seconds, well past an allowance of ten. The limits are read from configuration, so the test setup raises them; one dedicated test lowers them on an application of its own and proves a 429 arrives.
- **`take: limit + 1` must not leak the extra row** into the response or the cursor.
- **The friend's wardrobe paginates too**, and its 404 for a stranger has to keep arriving before any paging happens.
- **A cursor pointing at an item that was archived or deleted** is not an error: Prisma answers from that position regardless, and a page may come back short.

## Risks / Trade-offs

- [Four unrelated repairs in one change] → accepted; each is small, and four separate proposals would be more ceremony than code.
- [`TRUST_PROXY` set wrong in a deployment still breaks the limiter] → it cannot be prevented from here, only made visible; the setting is documented in `.env.example` with what each value means.
- [Rate limiting counts in memory, so several instances each allow the full quota] → true, and the same note as the Socket.IO Redis adapter: one instance is enough to start.
