import { useId, useState } from 'react';
import { uk } from '../i18n/uk';
import type { PasswordFieldProps } from './ui.interfaces';

/**
 * A labelled password input with a checkbox under it that shows what is typed, for a
 * phone where every letter is a dot. Only the input's type changes: it stays one element,
 * so what was typed, its name and a password manager's fill all stay where they are. The
 * checkbox has no name, so a form never sends it.
 */
export function PasswordField({ label, ...input }: PasswordFieldProps) {
  const id = useId();
  const toggleId = useId();
  const [shown, setShown] = useState(false);

  return (
    <div className="field-row-stacked">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...input} type={shown ? 'text' : 'password'} />
      <div className="field-row">
        <input
          id={toggleId}
          type="checkbox"
          checked={shown}
          onChange={(event) => setShown(event.target.checked)}
        />
        <label htmlFor={toggleId}>{uk.session.showPassword}</label>
      </div>
    </div>
  );
}
