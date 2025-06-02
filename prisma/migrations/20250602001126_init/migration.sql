-- CreateTable
CREATE TABLE "scheduled_messages" (
    "jobId" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "recipientIdentifier" TEXT NOT NULL,
    "originalRecipientString" TEXT NOT NULL,
    "messageContent" TEXT NOT NULL,
    "scheduledTimestampUTC" DATETIME NOT NULL,
    "originalUserDateTimeString" TEXT NOT NULL,
    "userTimeZoneOffset" INTEGER,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pending_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "senderPhone" TEXT NOT NULL,
    "originalInput" TEXT NOT NULL,
    "partialContent" TEXT NOT NULL,
    "missing" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "message_view_stats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "senderPhone" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOffset" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "whatsapp_links" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phoneNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "scheduled_messages_user_status_idx" ON "scheduled_messages"("userId", "status");

-- CreateIndex
CREATE INDEX "scheduled_messages_timestamp_idx" ON "scheduled_messages"("scheduledTimestampUTC");

-- CreateIndex
CREATE UNIQUE INDEX "message_view_stats_senderPhone_key" ON "message_view_stats"("senderPhone");

-- CreateIndex
CREATE INDEX "message_view_stats_sender_idx" ON "message_view_stats"("senderPhone");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_links_phoneNumber_key" ON "whatsapp_links"("phoneNumber");

-- CreateIndex
CREATE INDEX "whatsapp_link_phone_idx" ON "whatsapp_links"("phoneNumber");

-- CreateIndex
CREATE INDEX "whatsapp_link_status_idx" ON "whatsapp_links"("status");
