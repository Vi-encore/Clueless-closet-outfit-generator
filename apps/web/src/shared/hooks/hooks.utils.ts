/**
 * A form's values, named by its inputs' `name`s, which is the whole contract with `Fields`.
 *
 * A text control arrives as a string, and a file input as its `File` or null. Read from
 * the input, because `FormData` answers an empty one with an empty `File`, and "no photo"
 * should not look like a photo of no bytes.
 */
export function fieldsOf(form: HTMLFormElement): Record<string, unknown> {
  const fields: Record<string, unknown> = Object.fromEntries(new FormData(form));

  for (const input of form.querySelectorAll<HTMLInputElement>('input[type="file"]')) {
    fields[input.name] = input.files?.[0] ?? null;
  }

  return fields;
}
