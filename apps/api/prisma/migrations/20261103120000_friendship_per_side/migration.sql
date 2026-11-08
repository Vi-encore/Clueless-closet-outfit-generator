-- A relation between two people becomes two records, one held by each and naming the
-- other, so that what belongs to one side - who asked, who blocked - is a plain column.
-- Written by hand: Prisma would drop the old columns, and every relation with them.
-- Each old row is set aside, the table is made again, and each row comes back as two.
CREATE TEMP TABLE "old_friendship" AS SELECT * FROM "Friendship";

DROP TABLE "Friendship";

CREATE TABLE "Friendship" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "otherUserId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedByMe" BOOLEAN NOT NULL DEFAULT false,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Friendship_userId_status_idx" ON "Friendship"("userId", "status");

CREATE UNIQUE INDEX "Friendship_userId_otherUserId_key" ON "Friendship"("userId", "otherUserId");

ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_otherUserId_fkey" FOREIGN KEY ("otherUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The lower side of each old pair, then the higher side, each with its own block.
INSERT INTO "Friendship" ("userId", "otherUserId", "status", "requestedByMe", "blocked", "createdAt", "updatedAt")
SELECT "lowerUserId", "higherUserId", "status", "requestedById" = "lowerUserId", "blockedByLower", "createdAt", "updatedAt"
FROM "old_friendship"
UNION ALL
SELECT "higherUserId", "lowerUserId", "status", "requestedById" = "higherUserId", "blockedByHigher", "createdAt", "updatedAt"
FROM "old_friendship";

DROP TABLE "old_friendship";
