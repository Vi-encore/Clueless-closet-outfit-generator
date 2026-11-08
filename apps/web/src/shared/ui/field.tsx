import { useId } from 'react';
import type { FieldProps } from './ui.interfaces';

/** A labelled input. The id is generated so that no screen has to invent one. */
export function Field({ label, ...input }: FieldProps) {
  const id = useId();

  return (
    <div className="field-row-stacked">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...input} />
    </div>
  );
}
