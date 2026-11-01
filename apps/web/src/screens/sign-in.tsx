import { Link, useLocation } from 'react-router';
import { hasStatus } from '../api/api-error';
import type { Credentials } from '../api/api.interfaces';
import { uk } from '../i18n/uk';
import { useSession } from '../session/use-session';
import { Field } from '../shell/field';
import { useFormSubmit } from '../shell/use-form-submit';
import { Window } from '../shell/window';

function describe(error: unknown): string {
  return hasStatus(error, 401) ? uk.signIn.refused : uk.errors.unavailable;
}

export function SignIn() {
  const session = useSession();
  const location = useLocation();
  const { onSubmit, pending, failure } = useFormSubmit<Credentials>(session.signIn, describe);

  return (
    <Window title={uk.signIn.title} closable={false}>
      <form className="flex flex-col gap-2" onSubmit={onSubmit}>
        <Field label={uk.signIn.email} name="email" type="email" autoComplete="email" required />
        <Field
          label={uk.signIn.password}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {failure !== null && <p role="alert">{failure}</p>}
        <button type="submit" className="self-end" disabled={pending}>
          {uk.signIn.submit}
        </button>
      </form>
      <p className="mt-4">
        {uk.signIn.noAccount}{' '}
        {/* The state travels along: somebody interrupted on the way to a screen and with
            no account yet should still arrive there once they have one. */}
        <Link to="/sign-up" state={location.state}>
          {uk.signIn.toSignUp}
        </Link>
      </p>
    </Window>
  );
}
