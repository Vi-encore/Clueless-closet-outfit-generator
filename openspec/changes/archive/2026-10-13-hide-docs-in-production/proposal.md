# Proposal

## Why

The documentation describes every route, every field and every rule the API enforces — which is exactly the map somebody probing a deployed service would like to have. It is invaluable while building and gratuitous once the app is public: nobody using Clueless Closet reads its OpenAPI document, and the only strangers who would are looking for a way in.

Nothing is deployed yet, so this costs nothing today. It is cheaper to decide now than to remember on the day the app goes online.

## What Changes

- Swagger UI and the OpenAPI document are not mounted when `NODE_ENV` is `production`. In every other environment they behave exactly as before.

Out of scope:
- Serving the documentation in production behind authentication. If it is ever wanted there, that is a different decision with its own protection to design.

## Capabilities

### Modified Capabilities
- `api-documentation`: the documentation is a development tool rather than part of the running service.

## Impact

- `apps/api/src/docs/openapi.ts` decides; `main.ts` and the tests keep calling it the same way.
- Requires step 2 (`add-api-skeleton`), done and archived.
