import { MATERIALS } from '@closet/core';
import { useId } from 'react';
import type { MaterialRow, MaterialRowsProps } from '../wardrobe.interfaces';
import { uk } from '../../../shared/i18n/uk';
import { aRow } from './tag-form.utils';

export function MaterialRows({ rows, onChange }: MaterialRowsProps) {
  const id = useId();
  const change = (row: MaterialRow) =>
    onChange(rows.map((each) => (each.id === row.id ? row : each)));

  return (
    <fieldset className="flex flex-col gap-2">
      <legend>{uk.tags.materials}</legend>
      {rows.map((row) => (
        <div key={row.id} className="flex flex-wrap items-end gap-2">
          <div className="field-row-stacked">
            <label htmlFor={`${id}-${row.id}-material`}>{uk.tags.material}</label>
            <select
              id={`${id}-${row.id}-material`}
              value={row.material}
              onChange={(event) =>
                change({
                  ...row,
                  material: MATERIALS.find((code) => code === event.target.value) ?? '',
                })
              }
            >
              <option value="">{uk.tags.notSet}</option>
              {MATERIALS.map((code) => (
                <option key={code} value={code}>
                  {uk.materials[code]}
                </option>
              ))}
            </select>
          </div>
          <div className="field-row-stacked w-24">
            <label htmlFor={`${id}-${row.id}-percent`}>{uk.tags.percent}</label>
            <input
              id={`${id}-${row.id}-percent`}
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={row.percent}
              onChange={(event) => change({ ...row, percent: event.target.value })}
            />
          </div>
          <button type="button" onClick={() => onChange(rows.filter((each) => each.id !== row.id))}>
            {uk.tags.removeMaterial}
          </button>
        </div>
      ))}
      <button type="button" className="self-start" onClick={() => onChange([...rows, aRow()])}>
        {uk.tags.addMaterial}
      </button>
    </fieldset>
  );
}
