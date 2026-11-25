# Design

## Context

- `sign-in.tsx` and `sign-up.tsx` each draw the password with `Field` (`shared/ui/field.tsx`, a labelled `<input>`) and `type="password"`.
- `Field` takes `FieldProps`, the input's attributes plus a `label`.
- The forms read their values through `useFormSubmit`, from the form's fields by name, so an input that changes its `type` keeps its value and its name.

See proposal.md for why.

## Decisions

### 1. A `PasswordField` in `shared/ui`

`password-field.tsx` takes `FieldProps` without `type`. It keeps `shown` in `useState(false)`, and draws:

- the labelled input, with `type={shown ? 'text' : 'password'}` and everything else passed through (`name`, `autoComplete`, `minLength`, `required`);
- under it, a 98.css checkbox row: an `<input type="checkbox">` with its own `useId` and a `<label>` "Показати пароль".

It lives in `shared/ui` because both forms use it, and a password field is nothing particular to a session.

*Alternative:* an eye icon button inside the field. 98.css has no such control, and a checkbox labelled in words is plainer, and the one Windows itself used.

### 2. What does not change

- **The input stays one element.** Only its `type` changes, so what was typed stays where it is, and a password manager that filled it still sees it.
- **`autoComplete` is passed as it was** (`current-password`, `new-password`). Browsers keep their hint even while the type is `text`.

### Pitfalls

- **The checkbox must not submit or reset anything.** It has no `name`, so `useFormSubmit` never reads it.
- **Tests read the type,** `toHaveAttribute('type', 'text')`, since jsdom does not draw dots.

## Risks / Trade-offs

- **[Trade-off]** A password shown on screen can be read over a shoulder. It is off by default, and only while ticked.

## Migration Plan

Client only. Rollback is a revert.
