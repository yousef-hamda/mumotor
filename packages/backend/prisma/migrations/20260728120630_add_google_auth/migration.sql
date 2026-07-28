-- Google sign-in: allow password-less accounts + link a Google identity.
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- CreateIndex (one Google identity -> one account)
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
