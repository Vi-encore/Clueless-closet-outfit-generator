# Proposal

## Why

Step 4 closed every route by default and left the documentation unaware of it. Swagger UI therefore shows six routes that look alike, offers no way to carry a token, and answers 401 to the one route that is protected without ever saying why. Trying `GET /auth/me` by hand today means copying a token out of the sign-in response and reaching for curl, which is exactly the work the documentation page exists to save.

The document is also wrong as a description: it claims the API needs no credentials anywhere, which was true the day before authentication existed and has been false since.

## What Changes

- The OpenAPI document declares a bearer scheme, so Swagger UI shows an **Authorize** button with one field for an access token and sends it as `Authorization: Bearer …` on every request afterwards.
- Routes the global guard protects are marked as requiring it, and carry a padlock in the UI. Routes marked `@Public()` are marked as not requiring it, and carry none.

Out of scope:
- Letting Swagger UI perform the sign-in itself and pick the token up. That is an OAuth2 password flow, which means describing our routes as something they are not.
- The refresh cookie. It travels automatically and has nothing for a person to paste.

## Capabilities

### Modified Capabilities
- `api-documentation`: the document describes what a route needs, not only what it accepts.

## Impact

- `apps/api/src/docs/openapi.ts` registers the scheme and the default requirement.
- `apps/api/src/auth/public.decorator.ts` gains the exemption, so no controller changes at all.
- Requires step 4 (`add-auth`), done and archived.
