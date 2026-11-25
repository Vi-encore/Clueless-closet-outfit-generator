import { useId } from 'react';
import type { SheetProps } from './ui.interfaces';

/**
 * A raised panel a little lighter than the window, with its heading: one part of a screen
 * set apart from the next, as the friends' lists and the statistics' charts are.
 */
export function Sheet({ title, children }: SheetProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="sheet flex flex-col gap-2">
      <h2 id={titleId} className="font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}
