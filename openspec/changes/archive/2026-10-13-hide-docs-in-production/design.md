# Design

## Context

Step 2 built the documentation and mounted it unconditionally. Nothing is deployed yet, so this changes nothing today and everything on the first day the app is online.

## Goals / Non-Goals

**Goals:** the documentation exists wherever it is useful and nowhere else, decided in one place.

**Non-Goals:** serving it in production behind a password, which is a different decision with its own protection to design.

## Decisions

### 1. The check lives inside `setupOpenApi`, not in `main.ts`

`main.ts` is never run by the tests, so a condition written there could not be tested at all - the same trap that put the validation pipe behind `APP_PIPE` and the cookie parser into the test application factory. Inside `setupOpenApi` the rule is reached by every caller, including the tests.

### 2. Absent rather than forbidden

Returning early means the routes are never mounted, so a request gets the ordinary 404 of a path that does not exist. A 401 or 403 would confirm that documentation is there and merely closed, which is half of what hiding it was for.

### 3. `NODE_ENV`, not a separate setting

A new `DOCS_ENABLED` flag would be one more thing to get wrong in a deployment, and it would let the two settings disagree. The environment already says what kind of place this is.

## Common pitfalls

- **A test for this cannot import `AppModule` at the top of the file.** Configuration is validated the moment that module is imported, so `NODE_ENV` has to be set first and the imports have to be dynamic.

## Risks / Trade-offs

- [Nobody can check the deployed API's documentation] → that is the point; the same document is one command away in any other environment.
