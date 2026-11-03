import { useCallback, useEffect, useState } from 'react';
import type { Load, Arrived } from './hooks.interfaces';

/**
 * One thing to load, by the same rules as `usePages`: `load` is stable, from
 * `useCallback`, a new one means start again, and an answer from an old one is dropped.
 *
 * `reload` asks again while what is on screen stays there, so that a list does not
 * blink away and back every time somebody presses something.
 */
export function useLoad<T>(load: Load<T>) {
  const [arrived, setArrived] = useState<Arrived<T> | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    const settle = (value: T | null, error: unknown) => {
      if (current) {
        setArrived({ source: load, value, error });
      }
    };

    load().then(
      (value) => settle(value, null),
      (error: unknown) => settle(null, error),
    );

    return () => {
      current = false;
    };
  }, [load, attempt]);

  const shown = arrived?.source === load ? arrived : null;

  const reload = useCallback(() => setAttempt((count) => count + 1), []);

  return { value: shown?.value ?? null, error: shown?.error ?? null, reload };
}
