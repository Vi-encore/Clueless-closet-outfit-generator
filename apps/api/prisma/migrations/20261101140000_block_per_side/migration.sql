-- Each side of a pair now holds its own block, so that two people can have blocked
-- each other and neither loses theirs when the other lets go. Written by hand so that
-- the existing blocks are carried across before the column they live in goes.
ALTER TABLE "Friendship"
  ADD COLUMN "blockedByLower" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "blockedByHigher" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Friendship"
SET "blockedByLower" = ("blockedById" = "lowerUserId"),
    "blockedByHigher" = ("blockedById" = "higherUserId")
WHERE "blockedById" IS NOT NULL;

ALTER TABLE "Friendship" DROP COLUMN "blockedById";
