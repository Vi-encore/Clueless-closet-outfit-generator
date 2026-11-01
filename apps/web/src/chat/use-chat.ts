import { useContext } from 'react';
import { ChatContext } from './chat.context';
import type { Chat } from './chat.interfaces';

export function useChat(): Chat {
  const chat = useContext(ChatContext);

  if (chat === null) {
    throw new Error('useChat needs a ChatProvider above it');
  }

  return chat;
}
