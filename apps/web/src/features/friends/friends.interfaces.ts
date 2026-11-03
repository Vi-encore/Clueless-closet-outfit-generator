import type { ReactNode } from 'react';

import type { Person } from '../../shared/api/api.interfaces';

/** One relation, as seen by whoever asked. */
export interface Relation {
  user: Person;
  status: 'pending' | 'accepted' | 'blocked';
  requestedByMe: boolean;
}

/** What a person has been asked to confirm, and about whom. */
export interface Asking {
  kind: 'remove' | 'block';
  person: Person;
}

export interface RowProps {
  name: ReactNode;
  children: ReactNode;
}

export interface SheetProps {
  title: string;
  children: ReactNode;
}

export interface PeopleProps {
  children: ReactNode;
}

export interface FindPersonProps {
  onAsked: () => void;
}

export interface AskFields {
  username: string;
}
