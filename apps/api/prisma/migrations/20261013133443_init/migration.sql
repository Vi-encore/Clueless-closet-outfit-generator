-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Kyiv',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL,
    "name" TEXT,
    "slot" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "colors" JSONB,
    "pattern" TEXT,
    "fabricType" TEXT,
    "fit" TEXT,
    "length" TEXT,
    "rise" TEXT,
    "materials" JSONB,
    "seasons" TEXT[],
    "warmth" INTEGER,
    "formality" INTEGER,
    "styles" TEXT[],
    "occasions" TEXT[],
    "avoidOccasions" TEXT[],
    "brand" TEXT,
    "size" TEXT,
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'UAH',
    "purchasedAt" TIMESTAMPTZ(3),
    "photoOriginalKey" TEXT,
    "photoCutoutKey" TEXT,
    "dollFit" JSONB,
    "status" TEXT NOT NULL DEFAULT 'available',
    "archivedReason" TEXT,
    "archivedAt" TIMESTAMPTZ(3),
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "wearCount" INTEGER NOT NULL DEFAULT 0,
    "lastWornAt" TIMESTAMPTZ(3),
    "aiSuggestion" JSONB,
    "taggingVersion" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Item_ownerId_status_idx" ON "Item"("ownerId", "status");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
