-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "reviewRequestSent" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Booking_reviewRequestSent_idx" ON "Booking"("reviewRequestSent");

-- Backfill: never review-request historical lessons (would email every past student on first cron tick)
UPDATE "Booking" SET "reviewRequestSent" = true WHERE "bookingDate" < CURRENT_DATE;
