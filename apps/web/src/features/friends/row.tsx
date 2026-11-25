import type { RowProps } from './friends.interfaces';

/**
 * A person as a card of their own: the name on the left, and on the right, two to a row,
 * what can be done about them. A grid rather than a wrapping line, so the buttons of every
 * card stand in the same places.
 */
export function Row({ name, children }: RowProps) {
  return (
    <li className="person-card">
      <span className="font-bold break-words">{name}</span>
      <span className="grid grid-cols-2 gap-2">{children}</span>
    </li>
  );
}
