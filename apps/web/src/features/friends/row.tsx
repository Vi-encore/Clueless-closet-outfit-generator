import type { RowProps } from './friends.interfaces';

/** A person on the left and what can be done about them on the right. */
export function Row({ name, children }: RowProps) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2">
      <span>{name}</span>
      <span className="flex flex-wrap gap-2">{children}</span>
    </li>
  );
}
