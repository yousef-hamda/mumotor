-- CreateTable
CREATE TABLE "WizardDraft" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WizardDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WizardDraft_userId_key" ON "WizardDraft"("userId");

-- AddForeignKey
ALTER TABLE "WizardDraft" ADD CONSTRAINT "WizardDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
