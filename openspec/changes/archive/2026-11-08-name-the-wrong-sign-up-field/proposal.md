# Proposal

## Why

The author registered with a ten-character password and was told to check the email, the username and the password, "at least 10 characters in the password". The password was fine; the username was not. Registration answers every refusal with one sentence about all three fields, so a person has to guess which one to change, and the sentence points at the password.

The API already knows which field it refused: a 400 from the validation pipe carries `errors`, each with a `path` (`username`, `password`, `email`). The client throws that body away and keeps only the status.

## What Changes

- **A refused registration names the field it refused,** with what that field has to be: a username of 3 to 30 Latin letters, digits and underscores; a password of at least 10 characters; an email address. Two fields refused are two lines.
- **`ApiError` keeps the paths of a 400's `errors`,** so any screen can tell which field the API refused. Sign-up is the first to use it.
- **The username field says what it accepts before anything is sent:** a hint under it, and `pattern`, `minLength` and `maxLength` so the browser stops an impossible name itself.

Out of scope:
- **A taken email or username** (409) keeps its one message, which does not say which: telling a stranger whether an email has an account is what the API avoids.
- **Other forms.** The new item form makes its own requests from controls that cannot hold a wrong value; the friend invitation answers 404 for a name that does not exist.
- **Messages beside each field** rather than in the error window: the window is how every form here says something went wrong.

## Capabilities

### Modified Capabilities
- `web-session`: a refused registration names the field.

## Impact

- `apps/web/src/shared/api/api-error.ts`, `client.ts`.
- `apps/web/src/features/session/sign-up.tsx`, `session.spec.tsx`; `shared/i18n/uk.ts`.
- No change to the API.
