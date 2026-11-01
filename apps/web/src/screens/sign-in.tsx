import { Link } from 'react-router';
import { uk } from '../i18n/uk';
import { Field } from '../shell/field';
import { Window } from '../shell/window';

export function SignIn() {
  return (
    <Window title={uk.signIn.title} closable={false}>
      <form className="flex flex-col gap-2">
        <Field label={uk.signIn.email} name="email" type="email" autoComplete="email" required />
        <Field
          label={uk.signIn.password}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <button type="submit" className="self-end">
          {uk.signIn.submit}
        </button>
      </form>
      <p className="mt-4">
        {uk.signIn.noAccount} <Link to="/sign-up">{uk.signIn.toSignUp}</Link>
      </p>
    </Window>
  );
}
