# Design

## Context

The S3 API is the one interface every object store in the project's shortlist speaks, so the choice between Backblaze B2, Cloudflare R2 and anything else is a URL and a pair of keys. That is what makes the decision below possible: the tests need an object store, not that object store.

## Goals / Non-Goals

**Goals:** a photograph that goes straight to storage and comes back only to people allowed to see it; tests that exercise real presigned URLs; no account with anybody required to work on this.

**Non-Goals:** quotas, background removal, a Backblaze account, proving an object exists before its key is accepted.

## Decisions

### 1. The tests run against MinIO, not against Backblaze

A storage test that mocks the storage proves the mock. What is worth proving here — that a presigned URL really accepts a `PUT` from a client holding no credentials, and that the signature expires — can only be shown against something that checks signatures.

MinIO speaks the S3 API and runs in Compose beside PostgreSQL, which the project already requires for `test:db`. So the tests upload real bytes through a real signed URL and read them back, with no account, no network and no quota to burn. Backblaze is then what the settings point at in a deployment, which is the promise `docs/architecture.md` made when it chose an S3-compatible store in the first place.

**Which MinIO took finding out.** `minio/minio` was withdrawn from Docker Hub and quay.io in September 2026 and neither answers an anonymous pull. Three candidates were tried against the four behaviours the specification needs — a signed `PUT` accepted, an unsigned one refused, a signed `GET` returning the bytes, an unsigned one refused:

| Image | Pins | Presigned URLs |
| --- | --- | --- |
| `chrislusf/seaweedfs` | yes | **no** — `SignatureDoesNotMatch`; it verifies signed headers but not signed query strings |
| `dxflrs/garage` | yes | not reached |
| `cgr.dev/chainguard/minio` | **no, `:latest` only** | all four, exactly |

Chainguard's rebuild wins on the only axis that decides it, and loses on the one the rest of this project cares about: it is the single image here that is not pinned, because `:latest` is all their free tier publishes. Presigned-URL behaviour is about as stable as S3 gets, and Garage is the fallback that pins if a rebuild ever disagrees.

MinIO is AGPL, which matters to somebody shipping it. It is a development dependency in a Compose file here, run and not distributed.

One difference between the two has to be a setting rather than an assumption: MinIO addresses buckets by path (`host/bucket/key`) and B2 by host (`bucket.host/key`). `S3_FORCE_PATH_STYLE` says which.

### 2. The key carries its owner, and that is what makes it unstealable

The upload URL is issued before the item exists, so the key travels through the client and comes back on `POST /items`. A client could send any string.

So the key is not opaque: `items/<ownerId>/<uuid>.<ext>`, and accepting one means checking that the owner segment is the person asking. Somebody who captures another person's key cannot attach it to their own item, and somebody who invents a key gets a broken image of their own making.

The uuid is what keeps keys unguessable; the owner segment is what keeps them unusable by anybody else. Neither alone is enough.

### 3. A photo link is part of the item, not a route of its own

The tempting route is `GET /items/:id/photo` answering a redirect. It does not survive contact with a browser: `<img src>` sends no `Authorization` header, so such a route would need the token in a cookie or — worse — in the query string.

A presigned URL carries its own authorisation, so the item itself can hand one over:

```ts
{ ...item, photoUrl: 'https://…?X-Amz-Signature=…' }
```

and `<img src={item.photoUrl}>` works with no token anywhere. Signing is local arithmetic, not a request, so a page of fifty items costs fifty HMACs and no round trips.

The link is short-lived, which is what makes it safe to put in a list: a URL that leaks stops working in minutes.

### 4. Who may see the photo is a question already answered

A link is attached wherever an item is returned, and every one of those paths has already decided who may see it: `ownedOrNotFound` for your own, `listVisibleTo` for a friend's. Attaching the link at the edge rather than in a route of its own means there is no second place for that rule to be got wrong.

### 5. Replacing a photo removes the old object

A patch that changes `photoOriginalKey` leaves the previous object paid for and unreachable. The service deletes it after the row is updated — after, because a delete that succeeds before a write that fails would lose a photograph that is still referenced.

A failure to delete is logged and swallowed: the item is already correct, and an orphaned object costs a fraction of a cent, while a 500 here would tell the owner their edit failed when it did not.

## Module layout

```
apps/api/src/storage/
  storage.module.ts
  storage.service.ts         // uploadUrl, viewUrl, remove
  keys.ts                    // keyFor(ownerId, extension), ownerOf(key)
```

## Common pitfalls

- **The bucket has to exist, and the application must not be what creates it.** A Backblaze key scoped to one bucket — which is how such a key should be made — has no right to create buckets, so an API that made its own would work on a laptop and fail on its first deployment. It is `ensureBucket`, called by the test setup and by a `storage:init` script a person runs once, and never at startup.
- **A presigned URL signs the method and the content type.** A URL signed for `image/webp` refuses a `PUT` sending `image/png`, and the error is an opaque 403. The client must send exactly what was asked for.
- **The signature covers the host.** A URL signed against `localhost:9000` will not work from a phone on the same network, which matters at step 9; the endpoint is a setting for that reason too.
- **`@aws-sdk/client-s3` is large.** It is a server dependency only and never reaches the browser, but it is worth knowing before it appears in a bundle report.
- **Deleting the old photo must not run on the create path**, where there is no old photo and `undefined` would be passed to a delete.

## Risks / Trade-offs

- [Tests prove MinIO's behaviour, not Backblaze's] → true of any stand-in; the S3 API is the contract, and the first deployment is where the endpoint is proved. The alternative is credentials in CI for a service nobody has an account with yet.
- [A photo link in a list expires while the page is open] → short lives are the point; the client refetches the item, which it has to do anyway when anything else changes.
- [No quota] → stated as out of scope rather than half-built; the free tier is 10 GB and nothing is deployed.
