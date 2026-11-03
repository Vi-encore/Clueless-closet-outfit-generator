import { createContext } from 'react';
import type { Session } from './session.interfaces';

/**
 * In a file of its own, away from the provider, and that is not tidiness. Editing a file
 * during development re-runs it, and a re-run `createContext` is a different context:
 * the provider would fill the new one while every screen read the old one and crashed.
 */
export const SessionContext = createContext<Session | null>(null);
