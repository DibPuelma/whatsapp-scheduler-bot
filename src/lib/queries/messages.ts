import { prisma } from '../prisma';

interface GetScheduledMessagesOptions {
  senderPhone: string;
  limit?: number;
  offset?: number;
}

interface ScheduledMessagesResult {
  messages: Array<{
    id: number;
    phone: string;
    content: string;
    scheduledAt: Date;
  }>;
  total: number;
  hasMore: boolean;
}

/**
 * Retrieves pending scheduled messages for a specific sender
 * @param options Query options including sender phone, limit, and offset
 * @returns Messages, total count, and whether there are more messages
 */
export async function getScheduledMessages({
  senderPhone,
  limit = 10,
  offset = 0,
}: GetScheduledMessagesOptions): Promise<ScheduledMessagesResult> {
  // Get total count of pending messages for this sender
  const total = await prisma.scheduledMessage.count({
    where: {
      senderPhone,
      status: 'pending',
    },
  });

  // Get the messages with pagination
  const messages = await prisma.scheduledMessage.findMany({
    where: {
      senderPhone,
      status: 'pending',
    },
    select: {
      id: true,
      phone: true,
      content: true,
      scheduledAt: true,
    },
    orderBy: {
      scheduledAt: 'asc',
    },
    take: limit,
    skip: offset,
  });

  return {
    messages,
    total,
    hasMore: offset + messages.length < total,
  };
}

/**
 * Checks if a user has any pending scheduled messages
 * @param senderPhone The phone number of the sender
 * @returns True if there are pending messages, false otherwise
 */
export async function hasPendingMessages(senderPhone: string): Promise<boolean> {
  const count = await prisma.scheduledMessage.count({
    where: {
      senderPhone,
      status: 'pending',
    },
  });

  return count > 0;
} 