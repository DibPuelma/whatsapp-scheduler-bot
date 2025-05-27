/*
  Warnings:

  - Added the required column `senderPhone` to the `pending_conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderPhone` to the `scheduled_messages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pending_conversations" ADD COLUMN     "senderPhone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "scheduled_messages" ADD COLUMN     "senderPhone" TEXT NOT NULL;
