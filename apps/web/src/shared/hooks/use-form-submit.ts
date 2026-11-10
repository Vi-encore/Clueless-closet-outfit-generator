import { useState, type SubmitEvent } from 'react';
import { fieldsOf } from './hooks.utils';

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
