import { useId } from 'react';
import type { ScaleProps } from '../wardrobe.interfaces';
import { uk } from '../../../shared/i18n/uk';
import { SCALE } from './tag-form.constants';

export function Scale({ label, value, onChange }: ScaleProps) {
  const id = useId();

  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {SCALE.map((point) => (
          <div key={point} className="field-row">
            <input
              id={`${id}-${point}`}
              type="radio"
              name={id}
              checked={value === point}
              onChange={() => onChange(point)}
            />
            <label htmlFor={`${id}-${point}`}>{point}</label>
          </div>
        ))}
        <div className="field-row">
          <input
            id={`${id}-none`}
            type="radio"
            name={id}
            checked={value === null}
            onChange={() => onChange(null)}
          />
          <label htmlFor={`${id}-none`}>{uk.tags.notSet}</label>
        </div>
      </div>
    </fieldset>
  );
}
