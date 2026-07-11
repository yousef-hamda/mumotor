-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "trialExpiredNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "websiteQuota" INTEGER NOT NULL DEFAULT 1;

-- ---------------------------------------------------------------------------
-- Backfill so the new free-trial gate never freezes an existing live site the
-- moment it deploys. Paid accounts (PRO/STUDIO) are left completely untouched.
-- ---------------------------------------------------------------------------

-- 1) Any existing FREE subscription with no trial window gets a fresh 30-day
--    grace period from deploy.
UPDATE "Subscription"
SET "trialEndsAt" = NOW() + INTERVAL '30 days',
    "status" = 'TRIALING'
WHERE "plan" = 'FREE' AND "trialEndsAt" IS NULL;

-- 2) Every existing user without a subscription row at all gets one, on a
--    30-day trial (mirrors what registration now does for new signups).
INSERT INTO "Subscription" ("id", "userId", "plan", "status", "websiteQuota", "trialEndsAt", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", 'FREE', 'TRIALING', 1, NOW() + INTERVAL '30 days', NOW(), NOW()
FROM "User" u
LEFT JOIN "Subscription" s ON s."userId" = u."id"
WHERE s."id" IS NULL;
