import { useId } from 'react';
import type { ChecklistProps } from '../wardrobe.interfaces';

export function Checklist<Code extends string>({
  label,
  codes,
  labels,
  value,
  onChange,
}: ChecklistProps<Code>) {
  const id = useId();

  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {codes.map((code) => (
          <div key={code} className="field-row">
            <input
              id={`${id}-${code}`}
              type="checkbox"
              checked={value.includes(code)}
              onChange={(event) =>
                // Kept in the vocabulary's order, whatever order they were ticked in.
                onChange(
                  codes.filter((each) =>
                    each === code ? event.target.checked : value.includes(each),
                  ),
                )
              }
            />
            <label htmlFor={`${id}-${code}`}>{labels[code]}</label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
