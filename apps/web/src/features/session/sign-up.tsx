import { useId } from 'react';
import { hasStatus, refusedField } from '../../shared/api/api-error';
import type { Registration } from './session.interfaces';
import { uk } from '../../shared/i18n/uk';
import { useSession } from './use-session';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { Field } from '../../shared/ui/field';
import { useFormSubmit } from '../../shared/hooks/use-form-submit';
import { Window } from '../../shared/ui/window';

/** `MIN_PASSWORD_LENGTH` on the API: the browser can say so before anything is sent. */
const MIN_PASSWORD_LENGTH = 10;

/** `usernameSchema` on the API, which lowercases first, so either case is fine here. */
const USERNAME = { minLength: 3, maxLength: 30, pattern: '[A-Za-z0-9_]+' } as const;

/** What each field has to be, said only about the fields the API refused. */
const RULES = [
  ['email', uk.signUp.badEmail],
  ['username', uk.signUp.badUsername],
  ['password', uk.signUp.badPassword],
] as const;

function describe(error: unknown): string {
  if (hasStatus(error, 409)) {
    return uk.signUp.taken;
  }

  if (!hasStatus(error, 400)) {
    return uk.errors.unavailable;
  }

  const lines = RULES.filter(([field]) => refusedField(error, field)).map(([, rule]) => rule);

  // A 400 that names no field we know is still a refusal, so the sentence about all three.
  return lines.length === 0 ? uk.signUp.invalid : lines.join('\n');
}

export function SignUp() {
  const session = useSession();
  const ruleId = useId();
  const { onSubmit, pending, failure, dismiss } = useFormSubmit<Registration>(
    session.signUp,
    describe,
  );

  return (
    <Window title={uk.signUp.title}>
      <form className="flex flex-col gap-2" onSubmit={onSubmit}>
        <Field label={uk.signUp.email} name="email" type="email" autoComplete="email" required />
        <Field
          label={uk.signUp.username}
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          required
          {...USERNAME}
          aria-describedby={ruleId}
        />
        <p id={ruleId} className="-mt-1 text-sm">
          {uk.signUp.usernameRule}
        </p>
        <Field
          label={uk.signUp.password}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
        <button type="submit" className="self-end" disabled={pending}>
          {uk.signUp.submit}
        </button>
      </form>
      {failure !== null && <ErrorDialog message={failure} onClose={dismiss} />}
    </Window>
  );
}
