import { useEffect, useState } from 'react';

type Load<T> = () => Promise<T>;

interface Arrived<T> {
  source: Load<T>;
  value: T | null;
  error: unknown;
}

/**
 * One thing to load, by the same rules as `usePages`: `load` is stable, from
 * `useCallback`, a new one means start again, and an answer from an old one is dropped.
 */
export function useLoad<T>(load: Load<T>) {
  const [arrived, setArrived] = useState<Arrived<T> | null>(null);

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
  }, [load]);

  const shown = arrived?.source === load ? arrived : null;

  return { value: shown?.value ?? null, error: shown?.error ?? null };
}
