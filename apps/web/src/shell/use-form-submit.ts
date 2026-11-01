import { useState, type SubmitEvent } from 'react';

/**
 * A form's values, named by its inputs' `name`s, which is the whole contract with `Fields`.
 *
 * A text control arrives as a string, and a file input as its `File` or null. Read from
 * the input, because `FormData` answers an empty one with an empty `File`, and "no photo"
 * should not look like a photo of no bytes.
 */
function fieldsOf(form: HTMLFormElement): Record<string, unknown> {
  const fields: Record<string, unknown> = Object.fromEntries(new FormData(form));

  for (const input of form.querySelectorAll<HTMLInputElement>('input[type="file"]')) {
    fields[input.name] = input.files?.[0] ?? null;
  }

  return fields;
}

/**
 * What a form does between pressing the button and hearing back: stays disabled so that
 * a double press is not two requests, and holds the message to show if it failed.
 *
 * `describe` turns a failure into words, because only the screen knows what a 401 means
 * to it.
 */
export function useFormSubmit<Fields>(
  submit: (fields: Fields) => Promise<void>,
  describe: (error: unknown) => string,
) {
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setFailure(null);

    submit(fieldsOf(event.currentTarget) as Fields)
      .catch((error: unknown) => {
        setFailure(describe(error));
      })
      .finally(() => {
        setPending(false);
      });
  };

  return { onSubmit, pending, failure, dismiss: () => setFailure(null) };
}
