# Proposal

## Why

On a phone a password is typed blind: each letter becomes a dot, and a slip is found only when signing in fails. The author asked for a way to see the password while typing it.

Seeing a password already saved is not possible and not wanted. The API keeps only an argon2 hash, from which no password can be read back.

This is not a roadmap step. It is small and stands on its own.

## What Changes

- **A "Показати пароль" checkbox under the password field**, on the sign-in and the sign-up forms.
  - It is unticked by default, and the password is dots.
  - Ticked, the password shows as text. Unticked again, it is dots again.
- **The field stays the same field.** Its name, its autocomplete hint and its rules are unchanged, so a password manager still fills it and the form still sends it.

Out of scope:

- **Changing a password,** and recovering a forgotten one.
- **Showing a password anywhere else.** There is no other password field.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `web-session`: the password fields can be shown while they are typed.

## Impact

- **`apps/web`:**
  - a `PasswordField` in `shared/ui`, used by `sign-in.tsx` and `sign-up.tsx` instead of `Field` with `type="password"`;
  - `uk.ts` gets the words.
- **Docs:** `openspec/config.yaml`.
