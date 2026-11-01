-- Nullable, so existing conversations need no backfill: null sorts last, which
-- is where a conversation with nothing in it belongs.
ALTER TABLE "Conversation" ADD COLUMN "lastMessageAt" TIMESTAMPTZ(3);
