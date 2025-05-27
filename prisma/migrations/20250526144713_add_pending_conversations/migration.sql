-- CreateTable
CREATE TABLE "pending_conversations" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "originalInput" TEXT NOT NULL,
    "partialContent" TEXT NOT NULL,
    "missing" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_conversations_pkey" PRIMARY KEY ("id")
);
