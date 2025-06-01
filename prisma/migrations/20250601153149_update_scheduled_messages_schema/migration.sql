/*
  Warnings:

  - The primary key for the `scheduled_messages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `content` on the `scheduled_messages` table. All the data in the column will be lost.
  - You are about to drop the column `error` on the `scheduled_messages` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `scheduled_messages` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `scheduled_messages` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledAt` on the `scheduled_messages` table. All the data in the column will be lost.
  - You are about to drop the column `senderPhone` on the `scheduled_messages` table. All the data in the column will be lost.
  - You are about to drop the column `sentAt` on the `scheduled_messages` table. All the data in the column will be lost.
  - The required column `jobId` was added to the `scheduled_messages` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `messageContent` to the `scheduled_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalRecipientString` to the `scheduled_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalUserDateTimeString` to the `scheduled_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientIdentifier` to the `scheduled_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledTimestampUTC` to the `scheduled_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `scheduled_messages` table without a default value. This is not possible if the table is not empty.

*/
-- First, add new columns as nullable
ALTER TABLE "scheduled_messages" 
ADD COLUMN "jobId" TEXT,
ADD COLUMN "messageContent" TEXT,
ADD COLUMN "originalRecipientString" TEXT,
ADD COLUMN "originalUserDateTimeString" TEXT,
ADD COLUMN "recipientIdentifier" TEXT,
ADD COLUMN "scheduledTimestampUTC" TIMESTAMP(3),
ADD COLUMN "userId" TEXT,
ADD COLUMN "userTimeZoneOffset" INTEGER;

-- Migrate existing data
UPDATE "scheduled_messages"
SET 
  "jobId" = 'legacy_' || id::text,
  "messageContent" = content,
  "originalRecipientString" = phone,
  "recipientIdentifier" = phone,
  "scheduledTimestampUTC" = "scheduledAt",
  "originalUserDateTimeString" = "scheduledAt"::text,
  "userId" = "senderPhone";

-- Now make the required columns non-nullable
ALTER TABLE "scheduled_messages" 
ALTER COLUMN "jobId" SET NOT NULL,
ALTER COLUMN "messageContent" SET NOT NULL,
ALTER COLUMN "originalRecipientString" SET NOT NULL,
ALTER COLUMN "originalUserDateTimeString" SET NOT NULL,
ALTER COLUMN "recipientIdentifier" SET NOT NULL,
ALTER COLUMN "scheduledTimestampUTC" SET NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- Drop old columns and constraints
ALTER TABLE "scheduled_messages" DROP CONSTRAINT "scheduled_messages_pkey";
DROP INDEX "scheduled_messages_scheduled_at_idx";
DROP INDEX "scheduled_messages_sender_status_idx";

ALTER TABLE "scheduled_messages"
DROP COLUMN "content",
DROP COLUMN "error",
DROP COLUMN "id",
DROP COLUMN "phone",
DROP COLUMN "scheduledAt",
DROP COLUMN "senderPhone",
DROP COLUMN "sentAt";

-- Add new primary key and indexes
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_pkey" PRIMARY KEY ("jobId");
CREATE INDEX "scheduled_messages_user_status_idx" ON "scheduled_messages"("userId", "status");
CREATE INDEX "scheduled_messages_timestamp_idx" ON "scheduled_messages"("scheduledTimestampUTC");
