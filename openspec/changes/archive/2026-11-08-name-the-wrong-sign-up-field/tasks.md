# Tasks

## 1. Naming the field

- [x] 1.1 Claude writes the tests for "A refused registration names the field" in `apps/web/src/features/session/session.spec.tsx`; verify they fail
- [x] 1.2 Keep the paths of a 400's `errors` on `ApiError`, read in `parsed` in `client.ts`; a body that is not the validation shape leaves them empty
- [x] 1.3 In `sign-up.tsx`, answer a 400 with a line per refused field, falling back to the current sentence when no field is named; add the username's hint, `pattern`, `minLength` and `maxLength`; verify `pnpm --filter @closet/web test` passes and the author registers with a wrong username in a browser
