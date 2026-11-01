# Design

## The shape of it

Eight requirements are screens, and they are ordinary. The two that are not are why this change is planned against the real bucket: a browser's upload depends on rules that only exist on Backblaze, and on a URL the SDK makes wrong by default.

## Decisions

### The bucket's rules are a script a person runs

`storage:cors`, beside `storage:init`, and for the same reason: changing a bucket is something a person does to a deployment, and an API that did it at startup would need a key with rights it should not have.

The rules are built by a pure function from `WEB_ORIGINS`, and that function is what the tests cover. The script around it has no logic worth testing, and running it is proved by the bucket's own answer.

A bucket rule allows `PUT` and `Content-Type` and nothing else. Reading needs no rule: an `<img>` is not a CORS request. If a screen ever reads a photograph's pixels from a canvas, as step 9 might, that adds `GET` then, for a reason that exists then.

**No test here can prove the rules work**, and that is worth being plain about. MinIO allows every origin by default, so the upload succeeds with or without them. What proves it is a real preflight against the real bucket, from a real browser, which is a task and not a scenario.

Asked read-only before planning, Backblaze answered `GetBucketCors` with `NoSuchCorsConfiguration`. The key scoped to the bucket turned out to be allowed to write them too, so the script is enough. MinIO answers 501, having no rules per bucket, and the script says so rather than failing.

Four real preflights at the bucket settle it: the configured origin with `PUT` and `content-type` gets 200 and the right headers; another origin, a `DELETE`, and an extra header each get 403.

### The upload URL carries no checksum

Since version 3.729 the S3 client adds a checksum to `PutObject` by default, and when presigning it can sign in a checksum computed over no body at all. A browser then uploads real bytes that do not match what was signed. Step 7's round trip passed on MinIO, which is exactly why this has to be a test about the URL rather than about the upload: `requestChecksumCalculation: 'WHEN_REQUIRED'` on the client in `s3.ts`, and a scenario that reads the URL.

### The client imports the vocabularies rather than copying them

`@closet/core` as a workspace dependency, so the form's options are the arrays the API validates against, and [ADR-0009](../../../docs/adr/0009-vocabularies-live-in-the-domain-package.md) keeps holding. Labels live in `i18n/uk.ts` with every other word, since the rule that no other file holds Cyrillic has no exceptions, typed as `Record<Slot, string>` and so on, so a new code fails the type check before it reaches a screen. The scenario checks the same thing at runtime for the part a type cannot see: that a label is really Ukrainian and not a pasted code.

The cost is that the client now needs the package built, as the API already does, and that importing it brings zod along. The build's size is checked in the last group. If it hurts, the vocabularies can get their own entry point in `@closet/core`, which is one line in its `exports`.

### No data-fetching library

`add-web-shell` predicted the data router would earn its place here. It does not, quite. A loader would need the access token and the retry rule, which all live happily in `request`, and the three screens here each load one thing.

The alternative worth taking seriously is TanStack Query, which would give caching and invalidation for free. Nothing here needs either: the list is reloaded when you return to it, which is also what keeps its fifteen-minute photo links fresh. Two small hooks, `use-pages.ts` and `use-load.ts`, hold loading, failure and the rule that a late answer is ignored. The chat in `add-social-screens` is the likely place this changes, since live data and a cache are a different problem, and that change should decide it rather than inherit this.

### The filter lives in the URL

`?slot=shoes`, through `useSearchParams`, rather than in state. A reload keeps it, the back button undoes it, and a link to it works, all for no code. It also means the list's only input is the address.

### Upload first, then create

The order matters, and the alternatives are worse. Creating first leaves an item pointing at a photograph that may never arrive. Uploading first leaves, at worst, an object nothing points at, if the second step fails. That is storage wasted rather than data wrong, and it is accepted: cleaning up orphans needs a sweep, and nothing has accumulated yet.

The `PUT` goes through plain `fetch`, not `request`. It is not our API, a 401 from it is not an expired token, and the access token must never be sent to storage. `credentials: 'omit'` keeps it that way.

## Where the code goes

```
apps/api/src/storage/
  s3.ts                 gains the checksum settings
  cors-rules.ts         the pure rules, from the origins
  apply-cors.ts         the script, as init-bucket.ts is
apps/web/src/
  api/items.ts          the item routes, and the upload
  api/api.interfaces.ts gains Item and Page
  i18n/uk.ts            gains code to Ukrainian
  shell/use-pages.ts    a list a page at a time, ignoring a late answer
  shell/use-load.ts     the same for one thing
  screens/
    wardrobe.tsx        the list, the filter, more
    item-card.tsx       one item, sharing and archiving
    new-item.tsx        the form
```

## Signatures, as orientation

```ts
// storage/cors-rules.ts
export function corsRulesFor(origins: readonly string[]): CORSRule[];

// api/items.ts
export function listItems(query: ItemQuery): Promise<Page<Item>>;
export function findItem(id: string): Promise<Item>;
export function createItem(item: NewItem): Promise<Item>;
export function setVisibility(id: string, visibility: Visibility): Promise<Item>;
export function archiveItem(id: string, reason: ArchiveReason): Promise<Item>;
export function uploadPhoto(file: File): Promise<string>; // the key

// shell/use-load.ts
export function usePages<T>(load: (cursor?: string) => Promise<Page<T>>): PagesState<T> & { more(): void };
export function useLoad<T>(load: () => Promise<T>): LoadState<T>;
```

## What to read

- [MDN on CORS preflight](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#preflighted_requests), for why a `PUT` with a `Content-Type` is one.
- [Backblaze's CORS rules](https://www.backblaze.com/docs/cloud-storage-cross-origin-resource-sharing-rules), for what its side of this looks like.
- [`useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams).

## Pitfalls

- **A preflight failure shows no status.** The browser reports a network error, and the page sees `TypeError: Failed to fetch`. That is why the failure message cannot say more than "it did not work", and why the real check reads the browser's console.
- **The signed `Content-Type` must match exactly.** `file.type` is what is asked for and what is sent. A file with an empty type, or a HEIC from an iPhone, is refused by the API's list of content types, so the input's `accept` and that list have to agree.
- **A photo link dies in fifteen minutes.** A tab left open shows broken images until the list is reloaded. Accepted for now.
- **MinIO cannot show a missing rule.** Green tests and a working laptop say nothing about Backblaze.
- **Local photographs need the API on MinIO, and the check on Backblaze needs it on Backblaze.** `apps/api/.env` holds both blocks, and the database stays local either way.
- **`<input type="file">` is uncontrolled**, and `FormData` already carries the `File`, so `useFormSubmit`'s comment about every control being text stops being true and has to change.
- **A `<select>` that depends on another** keeps a stale value when the first changes. Reset the type when the slot does.
