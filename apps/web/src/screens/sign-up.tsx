import { hasStatus } from '../api/api-error';
import type { Registration } from '../api/api.interfaces';
import { uk } from '../i18n/uk';
import { useSession } from '../session/use-session';
import { Field } from '../shell/field';
import { useFormSubmit } from '../shell/use-form-submit';
import { Window } from '../shell/window';

/** `MIN_PASSWORD_LENGTH` on the API: the browser can say so before anything is sent. */
const MIN_PASSWORD_LENGTH = 10;

function describe(error: unknown): string {
  if (hasStatus(error, 409)) {
    return uk.signUp.taken;
  }

  return hasStatus(error, 400) ? uk.signUp.invalid : uk.errors.unavailable;
}

export function SignUp() {
  const session = useSession();
  const { onSubmit, pending, failure } = useFormSubmit<Registration>(session.signUp, describe);

  return (
    <Window title={uk.signUp.title}>
      <form className="flex flex-col gap-2" onSubmit={onSubmit}>
        <Field label={uk.signUp.email} name="email" type="email" autoComplete="email" required />
        <Field
          label={uk.signUp.username}
          name="username"
          type="text"
          autoComplete="username"
          required
        />
        <Field
          label={uk.signUp.password}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
        {failure !== null && <p role="alert">{failure}</p>}
        <button type="submit" className="self-end" disabled={pending}>
          {uk.signUp.submit}
        </button>
      </form>
    </Window>
  );
}
