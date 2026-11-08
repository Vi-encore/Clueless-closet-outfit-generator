import {
  FABRIC_TYPES,
  FITS,
  LENGTHS,
  MATERIALS,
  OCCASIONS,
  PATTERNS,
  RISES,
  SCALE_MAX,
  SCALE_MIN,
  SEASONS,
  STYLES,
  type Material,
  type TagSuggestion,
} from '@closet/core';
import { useId } from 'react';
import type {
  ChecklistProps,
  ChoiceProps,
  FilledTags,
  MaterialRow,
  MaterialRowsProps,
  ScaleProps,
  TagDraft,
  TagFormProps,
} from './wardrobe.interfaces';
import { uk } from '../../shared/i18n/uk';

const SCALE = Array.from({ length: SCALE_MAX - SCALE_MIN + 1 }, (_, at) => SCALE_MIN + at);

/** A form with nothing said yet. */
export function emptyDraft(): TagDraft {
  return {
    colors: [],
    pattern: '',
    fabricType: '',
    fit: '',
    length: '',
    rise: '',
    seasons: [],
    styles: [],
    occasions: [],
    avoidOccasions: [],
    warmth: null,
    formality: null,
    materials: [],
    brand: '',
    size: '',
    price: '',
    notes: '',
  };
}

let nextRowId = 0;

function aRow(material: Material | '' = '', percent = ''): MaterialRow {
  nextRowId += 1;

  return { id: nextRowId, material, percent };
}

/**
 * The draft with whatever a suggestion is sure enough to say laid over it.
 *
 * A null in the suggestion means "cannot tell", which is not the same as "nothing", so
 * it leaves the field as the person had it. Today the colors read from the photograph
 * come this way; in step 15 the tagger's answer will, through the same door.
 */
export function withSuggestion(draft: TagDraft, suggestion: TagSuggestion): TagDraft {
  return {
    ...draft,
    colors: suggestion.colors ?? draft.colors,
    pattern: suggestion.pattern ?? draft.pattern,
    fabricType: suggestion.fabricType ?? draft.fabricType,
    fit: suggestion.fit ?? draft.fit,
    length: suggestion.length ?? draft.length,
    rise: suggestion.rise ?? draft.rise,
    seasons: suggestion.seasons ?? draft.seasons,
    styles: suggestion.styles ?? draft.styles,
    occasions: suggestion.occasions ?? draft.occasions,
    avoidOccasions: suggestion.avoidOccasions ?? draft.avoidOccasions,
    warmth: suggestion.warmth ?? draft.warmth,
    formality: suggestion.formality ?? draft.formality,
    materials:
      suggestion.materials?.map(({ material, percent }) =>
        aRow(material, percent === undefined ? '' : String(percent)),
      ) ?? draft.materials,
  };
}

/**
 * Only what was filled in, as the API takes it. An empty field is not sent at all
 * rather than sent empty: the API would refuse an empty string, and an empty list says
 * something ("worn in no season") the person never said.
 */
export function tagsFromDraft(draft: TagDraft): FilledTags {
  const materials = draft.materials.flatMap(({ material, percent }) =>
    material === '' ? [] : [{ material, ...(percent === '' ? {} : { percent: Number(percent) }) }],
  );
  const text = (value: string) => value.trim();

  return {
    ...(draft.colors.length > 0 && { colors: draft.colors }),
    ...(draft.pattern !== '' && { pattern: draft.pattern }),
    ...(draft.fabricType !== '' && { fabricType: draft.fabricType }),
    ...(draft.fit !== '' && { fit: draft.fit }),
    ...(draft.length !== '' && { length: draft.length }),
    ...(draft.rise !== '' && { rise: draft.rise }),
    ...(draft.seasons.length > 0 && { seasons: draft.seasons }),
    ...(draft.styles.length > 0 && { styles: draft.styles }),
    ...(draft.occasions.length > 0 && { occasions: draft.occasions }),
    ...(draft.avoidOccasions.length > 0 && { avoidOccasions: draft.avoidOccasions }),
    ...(draft.warmth !== null && { warmth: draft.warmth }),
    ...(draft.formality !== null && { formality: draft.formality }),
    ...(materials.length > 0 && { materials }),
    ...(text(draft.brand) !== '' && { brand: text(draft.brand) }),
    ...(text(draft.size) !== '' && { size: text(draft.size) }),
    ...(draft.price !== '' && { price: Number(draft.price) }),
    ...(text(draft.notes) !== '' && { notes: text(draft.notes) }),
  };
}

function Choice<Code extends string>({ label, codes, labels, value, onChange }: ChoiceProps<Code>) {
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

function Checklist<Code extends string>({
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

function Scale({ label, value, onChange }: ScaleProps) {
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

function MaterialRows({ rows, onChange }: MaterialRowsProps) {
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
        <Choice
          label={uk.tags.pattern}
          codes={PATTERNS}
          labels={uk.patterns}
          value={draft.pattern}
          onChange={(pattern) => set({ pattern })}
        />
        <Choice
          label={uk.tags.fabricType}
          codes={FABRIC_TYPES}
          labels={uk.fabricTypes}
          value={draft.fabricType}
          onChange={(fabricType) => set({ fabricType })}
        />
        <Choice
          label={uk.tags.fit}
          codes={FITS}
          labels={uk.fits}
          value={draft.fit}
          onChange={(fit) => set({ fit })}
        />
        <Choice
          label={uk.tags.length}
          codes={LENGTHS}
          labels={uk.lengths}
          value={draft.length}
          onChange={(length) => set({ length })}
        />
        <Choice
          label={uk.tags.rise}
          codes={RISES}
          labels={uk.rises}
          value={draft.rise}
          onChange={(rise) => set({ rise })}
        />
        <div className="flex flex-col gap-1">
          <Checklist
            label={uk.tags.seasons}
            codes={SEASONS}
            labels={uk.seasons}
            value={draft.seasons}
            onChange={(seasons) => set({ seasons })}
          />
          <button
            type="button"
            className="self-start"
            onClick={() => set({ seasons: [...SEASONS] })}
          >
            {uk.tags.allSeasons}
          </button>
        </div>
        <Scale label={uk.tags.warmth} value={draft.warmth} onChange={(warmth) => set({ warmth })} />
        <Scale
          label={uk.tags.formality}
          value={draft.formality}
          onChange={(formality) => set({ formality })}
        />
        <Checklist
          label={uk.tags.styles}
          codes={STYLES}
          labels={uk.styles}
          value={draft.styles}
          onChange={(styles) => set({ styles })}
        />
        <Checklist
          label={uk.tags.occasions}
          codes={OCCASIONS}
          labels={uk.occasions}
          value={draft.occasions}
          onChange={(occasions) => set({ occasions })}
        />
        <Checklist
          label={uk.tags.avoidOccasions}
          codes={OCCASIONS}
          labels={uk.occasions}
          value={draft.avoidOccasions}
          onChange={(avoidOccasions) => set({ avoidOccasions })}
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
