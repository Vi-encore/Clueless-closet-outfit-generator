import { useId } from 'react';
import type { ChoiceProps } from '../wardrobe.interfaces';
import { uk } from '../../../shared/i18n/uk';

export function Choice<Code extends string>({
  label,
  codes,
  labels,
  value,
  onChange,
}: ChoiceProps<Code>) {
  const id = useId();

  return (
    <div className="field-row-stacked">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(codes.find((code) => code === event.target.value) ?? '')}
      >
        <option value="">{uk.tags.notSet}</option>
        {codes.map((code) => (
          <option key={code} value={code}>
            {labels[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
