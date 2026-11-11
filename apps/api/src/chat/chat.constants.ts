export const publicFields = { id: true, username: true, displayName: true } as const;

export const messageFields = {
  id: true,
  conversationId: true,
  senderId: true,
  body: true,
  createdAt: true,
} as const;
