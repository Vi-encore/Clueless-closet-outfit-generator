import type { Message, ShownMessage } from './chat.interfaces';

/** A message as stored, shown as one that has arrived. */
export const settled = (message: Message): ShownMessage => ({ ...message, state: 'sent' });
