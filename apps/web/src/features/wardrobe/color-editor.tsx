import { COLOR_FAMILIES, type ColorFamily } from '@closet/core';
import { uk } from '../../shared/i18n/uk';
import type { ColorEditorProps } from './wardrobe.interfaces';
import { withAdded, withFamily, withoutColor } from './wardrobe.utils';

/**
 * An item's colours as the person says they are: each one can be named another family or
 * taken away, and a family not yet listed can be added. A camera in a dim room sees a
 * white top as grey; this is where the person says it is white.
 *
 * Its selects have no `name`, so a form around it never sends them: the colours travel in
 * the list `onChange` hands back.
 */
export function ColorEditor({ colors, onChange }: ColorEditorProps) {
  const missing = COLOR_FAMILIES.filter(
    (family) => !colors.some((color) => color.family === family),
  );
  const familyFrom = (value: string) => COLOR_FAMILIES.find((family) => family === value);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend>{uk.newItem.colors}</legend>
      {colors.length > 0 && (
        <ul aria-label={uk.newItem.colors} className="m-0 flex list-none flex-col gap-2 p-0">
          {colors.map((color, index) => (
            <li key={color.family} className="flex items-center gap-2">
              <span className="swatch" style={{ backgroundColor: color.hex }} />
              <select
                aria-label={uk.newItem.colorFamily(uk.colors[color.family])}
                value={color.family}
                onChange={(event) => {
                  const family = familyFrom(event.target.value);
                  if (family !== undefined) {
                    onChange(withFamily(colors, index, family));
                  }
                }}
              >
                {COLOR_FAMILIES.map((family) => (
                  <option key={family} value={family}>
                    {uk.colors[family]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="min-w-0 px-2"
                aria-label={uk.newItem.removeColor(uk.colors[color.family])}
                onClick={() => onChange(withoutColor(colors, index))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {missing.length > 0 && (
        <select
          aria-label={uk.newItem.addColor}
          className="self-start"
          value=""
          onChange={(event) => {
            const family: ColorFamily | undefined = familyFrom(event.target.value);
            if (family !== undefined) {
              onChange(withAdded(colors, family));
            }
          }}
        >
          <option value="">{uk.newItem.addColor}</option>
          {missing.map((family) => (
            <option key={family} value={family}>
              {uk.colors[family]}
            </option>
          ))}
        </select>
      )}
    </fieldset>
  );
}
