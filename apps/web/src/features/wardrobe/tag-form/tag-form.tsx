import { useId } from 'react';
import type { TagDraft, TagFormProps } from '../wardrobe.interfaces';
import { uk } from '../../../shared/i18n/uk';
import { Choice } from './choice';
import { Checklist } from './checklist';
import { Scale } from './scale';
import { MaterialRows } from './material-rows';
import { CHECKLISTS, CHOICES } from './tag-form.constants';

/**
 * Everything about an item but its slot, type and name, built from the vocabularies so
 * that a code added to `@closet/core` appears here without this file changing.
 *
 * Folded away by default: on a phone in a shop, slot and type are what a person has
 * time for, and the rest can wait for a quieter moment.
 */
export function TagForm({ draft, onChange }: TagFormProps) {
  const set = (patch: Partial<TagDraft>) => onChange({ ...draft, ...patch });
  const ids = { brand: useId(), size: useId(), price: useId(), notes: useId() };

  return (
    <details className="tag-form">
      <summary>{uk.tags.more}</summary>
      <div className="flex flex-col gap-3 pt-2">
        {CHOICES.map(({ field, props }) => (
          <Choice key={field} {...props(draft, onChange)} />
        ))}
        {CHECKLISTS.map(({ field, props, everything }) => {
          const checklist = props(draft, onChange);

          return everything === null ? (
            <Checklist key={field} {...checklist} />
          ) : (
            <div key={field} className="flex flex-col gap-1">
              <Checklist {...checklist} />
              <button
                type="button"
                className="self-start"
                onClick={() => checklist.onChange([...checklist.codes])}
              >
                {everything}
              </button>
            </div>
          );
        })}
        <Scale label={uk.tags.warmth} value={draft.warmth} onChange={(warmth) => set({ warmth })} />
        <Scale
          label={uk.tags.formality}
          value={draft.formality}
          onChange={(formality) => set({ formality })}
        />
        <MaterialRows rows={draft.materials} onChange={(materials) => set({ materials })} />
        <div className="field-row-stacked">
          <label htmlFor={ids.brand}>{uk.tags.brand}</label>
          <input
            id={ids.brand}
            type="text"
            maxLength={80}
            value={draft.brand}
            onChange={(event) => set({ brand: event.target.value })}
          />
        </div>
        <div className="field-row-stacked">
          <label htmlFor={ids.size}>{uk.tags.size}</label>
          <input
            id={ids.size}
            type="text"
            maxLength={20}
            value={draft.size}
            onChange={(event) => set({ size: event.target.value })}
          />
        </div>
        <div className="field-row-stacked">
          <label htmlFor={ids.price}>{uk.tags.price}</label>
          <input
            id={ids.price}
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={draft.price}
            onChange={(event) => set({ price: event.target.value })}
          />
        </div>
        <div className="field-row-stacked">
          <label htmlFor={ids.notes}>{uk.tags.notes}</label>
          <textarea
            id={ids.notes}
            maxLength={2000}
            rows={3}
            value={draft.notes}
            onChange={(event) => set({ notes: event.target.value })}
          />
        </div>
      </div>
    </details>
  );
}
