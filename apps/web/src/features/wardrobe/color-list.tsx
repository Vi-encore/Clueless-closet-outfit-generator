import type { ColorListProps } from './wardrobe.interfaces';
import { uk } from '../../shared/i18n/uk';

/** The colors found in the photograph, each of which the person can take away. */
export function ColorList({ colors, onRemove }: ColorListProps) {
  if (colors.length === 0) {
    return null;
  }

  return (
    <div className="field-row-stacked">
      <span>{uk.newItem.colors}</span>
      <ul aria-label={uk.newItem.colors} className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <li key={color.family} className="flex items-center gap-1">
            <span className="swatch" style={{ backgroundColor: color.hex }} />
            {uk.colors[color.family]}
            <button
              type="button"
              className="min-w-0 px-1"
              aria-label={uk.newItem.removeColor(uk.colors[color.family])}
              onClick={() => onRemove(color)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
