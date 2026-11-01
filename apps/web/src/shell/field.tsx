import { useId, type InputHTMLAttributes } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

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
