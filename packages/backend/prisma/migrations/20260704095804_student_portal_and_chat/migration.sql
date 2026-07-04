-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('STUDENT', 'TEACHER');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MESSAGE';

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "body" TEXT NOT NULL,
    "readByTeacher" BOOLEAN NOT NULL DEFAULT false,
    "readByStudent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_websiteId_idx" ON "Message"("websiteId");

-- CreateIndex
CREATE INDEX "Message_enrollmentId_idx" ON "Message"("enrollmentId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ClientEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
