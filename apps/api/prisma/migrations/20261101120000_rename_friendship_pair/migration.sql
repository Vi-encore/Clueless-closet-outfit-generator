-- Renames rather than drops and adds.
--
-- `prisma migrate dev` would have offered to recreate these columns, which
-- keeps the schema right and loses every friendship in the table. There is
-- nothing but development data here, and the habit is worth having before
-- there is.
--
-- Postgres does not carry a column's name into the indexes and constraints
-- built on it, so those are renamed too: left alone they keep the old names,
-- Prisma expects the new ones, and the next `migrate dev` reports drift that
-- nobody can explain.
ALTER TABLE "Friendship" RENAME COLUMN "userAId" TO "lowerUserId";
ALTER TABLE "Friendship" RENAME COLUMN "userBId" TO "higherUserId";

ALTER INDEX "Friendship_userAId_status_idx" RENAME TO "Friendship_lowerUserId_status_idx";
ALTER INDEX "Friendship_userBId_status_idx" RENAME TO "Friendship_higherUserId_status_idx";
ALTER INDEX "Friendship_userAId_userBId_key" RENAME TO "Friendship_lowerUserId_higherUserId_key";

ALTER TABLE "Friendship" RENAME CONSTRAINT "Friendship_userAId_fkey" TO "Friendship_lowerUserId_fkey";
ALTER TABLE "Friendship" RENAME CONSTRAINT "Friendship_userBId_fkey" TO "Friendship_higherUserId_fkey";
