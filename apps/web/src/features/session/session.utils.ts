import { hasStatus, refusedField } from '../../shared/api/api-error';
import { uk } from '../../shared/i18n/uk';
import { RULES } from './session.constants';

export function describeSignUpFailure(error: unknown): string {
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

export function describeSignInFailure(error: unknown): string {
  return hasStatus(error, 401) ? uk.signIn.refused : uk.errors.unavailable;
}
