-- CreateIndex
CREATE INDEX "scheduled_messages_sender_status_idx" ON "scheduled_messages" ("senderPhone", "status");

-- CreateIndex
CREATE INDEX "scheduled_messages_scheduled_at_idx" ON "scheduled_messages" ("scheduledAt");

-- Note: These indexes will optimize:
-- 1. Filtering by senderPhone and status (composite index)
-- 2. Sorting by scheduledAt 