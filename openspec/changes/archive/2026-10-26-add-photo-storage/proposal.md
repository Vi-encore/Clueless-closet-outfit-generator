# Proposal

## Why

An item has carried `photoOriginalKey` since step 3 and nothing has ever written it. Step 7 is where a photograph of a blouse becomes something the application can hold, and it is the first time the project depends on a service that is not ours.

`docs/architecture.md` settled the shape already: files never pass through the API. The client uploads straight to storage with a presigned URL, and the API hands out short-lived links for reading. That keeps a wardrobe's worth of images off the API's bandwidth, and it is also the only arrangement that stays affordable on a free tier.

## What Changes

- A `StorageService` over the S3 API, with the endpoint, bucket and credentials as settings — so the same code talks to MinIO on a laptop and to Backblaze B2 in a deployment.
- MinIO in `docker-compose.yml` beside PostgreSQL, so the tests upload and download real bytes through real presigned URLs without an account anywhere.
- `POST /items/upload-url` answers with a key and a presigned `PUT` URL, valid for minutes.
- Item responses carry a short-lived `photoUrl` when the item has a photo, so a browser can render `<img src>` without sending a token.
- Creating or patching an item accepts `photoOriginalKey`, and refuses a key issued to somebody else.
- Replacing a photo removes the one it replaced.

Out of scope:
- **Quotas.** `docs/architecture.md` says the upload route checks limits; nothing is deployed, nothing accumulates, and a quota that is never reached is untested code pretending to be a guard. It belongs with the deployment that can hit it.
- **`photoCutoutKey` and the background removal.** The client does that work (step 9), and the column waits as it has been.
- **Checking the object is really there** before accepting its key. The prefix check below is what keeps a key from being stolen; a missing object is a broken image, not a breach.
- **An account with Backblaze.** The settings make it a deployment detail; the free tier is 10 GB with no card, and the buckets here are private, which is the arrangement that stays free.

## Capabilities

### New Capabilities
- `photo-storage`: getting a photograph in, and handing out the right to look at it.

### Modified Capabilities
- `wardrobe-items`: an item answers with a link to its photograph.
- `service-config`: the settings the storage needs.

## Impact

- New `apps/api/src/storage/` — the service, its settings and the key rule.
- `apps/api/src/items/` — one new route, a field on two request schemas, and a link on the responses.
- New dependencies: `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`, both 3.1156.0.
- `docker-compose.yml` gains MinIO; `.env.example` gains the storage settings.
- No migration: step 3 made the column.
- Requires step 5 (`add-wardrobe-items`), done and archived.
