import type { PeopleProps } from './friends.interfaces';

export function People({ children }: PeopleProps) {
  return <ul className="flex flex-col gap-2">{children}</ul>;
}
