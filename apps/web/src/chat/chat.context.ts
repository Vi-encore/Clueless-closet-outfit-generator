import { createContext } from 'react';
import type { Chat } from './chat.interfaces';

/** Alone in its file for the reason `SessionContext` is: a re-run file is a new context. */
export const ChatContext = createContext<Chat | null>(null);
