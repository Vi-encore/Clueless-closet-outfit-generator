import { uk } from '../i18n/uk';
import { Field } from '../shell/field';
import { Window } from '../shell/window';

export function SignUp() {
  return (
    <Window title={uk.signUp.title}>
      <form className="flex flex-col gap-2">
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
          required
        />
        <button type="submit" className="self-end">
          {uk.signUp.submit}
        </button>
      </form>
    </Window>
  );
}
