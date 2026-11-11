import { useId } from 'react';
import type { Registration } from './session.interfaces';
import { uk } from '../../shared/i18n/uk';
import { useSession } from './use-session';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { Field } from '../../shared/ui/field';
import { useFormSubmit } from '../../shared/hooks/use-form-submit';
import { Window } from '../../shared/ui/window';
import { MIN_PASSWORD_LENGTH, USERNAME } from './session.constants';
import { describeSignUpFailure } from './session.utils';

export function SignUp() {
  const session = useSession();
  const ruleId = useId();
  const { onSubmit, pending, failure, dismiss } = useFormSubmit<Registration>(
    session.signUp,
    describeSignUpFailure,
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
