import { useState, type SubmitEvent } from 'react';

/**
 * What a form does between pressing the button and hearing back: stays disabled so that
 * a double press is not two requests, and holds the message to show if it failed.
 *
 * `describe` turns a failure into words, because only the screen knows what a 401 means
 * to it. Nothing is cleared on success: a successful form is about to be replaced.
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

    // Named by the inputs' `name`s, which is the whole contract with `Fields`. Every
    // control so far is text; a file input would not be a string, and would have to change this.
    const fields = Object.fromEntries(new FormData(event.currentTarget)) as Fields;

    submit(fields).catch((error: unknown) => {
      setFailure(describe(error));
      setPending(false);
    });
  };

  return { onSubmit, pending, failure };
}
