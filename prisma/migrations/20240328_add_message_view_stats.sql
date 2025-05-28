-- CreateTable
CREATE TABLE "message_view_stats" (
    "id" SERIAL NOT NULL,
    "senderPhone" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOffset" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_view_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_view_stats_sender_phone_key" ON "message_view_stats"("senderPhone");

-- CreateIndex
CREATE INDEX "message_view_stats_sender_idx" ON "message_view_stats"("senderPhone"); 