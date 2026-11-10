import { type Material, type TagSuggestion } from '@closet/core';
import type {
  ChecklistCodes,
  ChecklistEntry,
  ChoiceCodes,
  ChoiceEntry,
  FilledTags,
  MaterialRow,
  TagDraft,
} from '../wardrobe.interfaces';

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

export function aRow(material: Material | '' = '', percent = ''): MaterialRow {
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

/**
 * A `<select>` for one tag. Generic here, where the field and its vocabulary are known
 * together, so that a list of them can be drawn without the form knowing which is which.
 * A value that is not one of the codes, which a `<select>` cannot send, reads as none.
 */
export function choiceOf<Field extends keyof ChoiceCodes>(
  field: Field,
  label: string,
  codes: readonly ChoiceCodes[Field][],
  labels: Record<ChoiceCodes[Field], string>,
): ChoiceEntry {
  return {
    field,
    props: (draft, onChange) => ({
      label,
      codes,
      labels,
      value: draft[field],
      onChange: (value) =>
        onChange({ ...draft, [field]: codes.find((code) => code === value) ?? '' }),
    }),
  };
}

/** Checkboxes for one tag, by the same rules, with a button for all of them if asked for. */
export function checklistOf<Field extends keyof ChecklistCodes>(
  field: Field,
  label: string,
  codes: readonly ChecklistCodes[Field][],
  labels: Record<ChecklistCodes[Field], string>,
  everything: string | null = null,
): ChecklistEntry {
  return {
    field,
    everything,
    props: (draft, onChange) => ({
      label,
      codes,
      labels,
      value: draft[field],
      onChange: (value) =>
        onChange({ ...draft, [field]: codes.filter((code) => value.includes(code)) }),
    }),
  };
}
