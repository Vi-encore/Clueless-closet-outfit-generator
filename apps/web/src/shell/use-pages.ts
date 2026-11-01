import { useEffect, useState } from 'react';
import type { Page } from '../api/api.interfaces';

type Load<T> = (cursor?: string) => Promise<Page<T>>;

/** What has arrived, and which `load` it came from. */
interface Arrived<T> extends Page<T> {
  source: Load<T>;
  failed: boolean;
}

/**
 * A list read a page at a time.
 *
 * `load` has to be stable, from `useCallback`: a new one is what means "start again", and
 * that is how a changed filter arrives here. What has arrived remembers its `load`, so
 * pages from an earlier one stop counting the moment it changes, with nothing to reset:
 * "loading" is simply having nothing from the current one. The cleanup drops an answer
 * still on its way, because a slow response to a filter the person has already left would
 * otherwise replace the list they are looking at.
 */
export function usePages<T>(load: Load<T>) {
  const [arrived, setArrived] = useState<Arrived<T> | null>(null);
  const [askingForMore, setAskingForMore] = useState(false);

  useEffect(() => {
    let current = true;
    const settle = (page: Page<T>, failed: boolean) => {
      if (current) {
        setArrived({ ...page, source: load, failed });
      }
    };

    load().then(
      (page) => settle(page, false),
      () => settle({ items: [], nextCursor: null }, true),
    );

    return () => {
      current = false;
    };
  }, [load]);

  const shown = arrived?.source === load ? arrived : null;

  const more = () => {
    if (!shown?.nextCursor) {
      return;
    }

    // Against whatever has arrived by then, and only if it is still this list.
    const add = (change: (now: Arrived<T>) => Arrived<T>) => {
      setArrived((now) => (now?.source === load ? change(now) : now));
    };

    setAskingForMore(true);
    load(shown.nextCursor)
      .then(
        ({ items, nextCursor }) =>
          add((now) => ({ ...now, items: [...now.items, ...items], nextCursor, failed: false })),
        // What is already on screen stays: only the next page failed.
        () => add((now) => ({ ...now, failed: true })),
      )
      .finally(() => setAskingForMore(false));
  };

  return {
    items: shown?.items ?? [],
    nextCursor: shown?.nextCursor ?? null,
    failed: shown?.failed ?? false,
    loading: shown === null || askingForMore,
    more,
  };
}
