import { Link, useLocation } from 'react-router';
import type { Credentials } from './session.interfaces';
import { uk } from '../../shared/i18n/uk';
import { useSession } from './use-session';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { Field } from '../../shared/ui/field';
import { useFormSubmit } from '../../shared/hooks/use-form-submit';
import { Window } from '../../shared/ui/window';
import { describeSignInFailure } from './session.utils';

export function SignIn() {
  const session = useSession();
  const location = useLocation();
  const { onSubmit, pending, failure, dismiss } = useFormSubmit<Credentials>(
    session.signIn,
    describeSignInFailure,
  );

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
        <button type="submit" className="self-end" disabled={pending}>
          {uk.signIn.submit}
        </button>
      </form>
      {failure !== null && <ErrorDialog message={failure} onClose={dismiss} />}
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
