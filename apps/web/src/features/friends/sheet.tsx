import { useId } from 'react';
import type { SheetProps } from './friends.interfaces';

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
