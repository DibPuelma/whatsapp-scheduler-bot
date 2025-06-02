import { PrismaClient } from '../../generated/prisma';
import { ParsedDateTime } from './dateTimeParser';
import { ResolvedRecipient } from './recipientResolver';

const prisma = new PrismaClient();

// Maximum number of pending messages allowed per user
export const MAX_PENDING_MESSAGES = 10;

// Maximum number of messages to fetch in one batch
export const MAX_BATCH_SIZE = 50;

export interface CreateScheduledMessageParams {
  userId: string;  // WhatsApp ID of the user scheduling the message
  recipient: ResolvedRecipient;
  dateTime: ParsedDateTime;
  messageContent: string;
}

export interface ScheduledMessage {
  jobId: string;
  userId: string;
  recipientIdentifier: string;
  originalRecipientString: string;
  messageContent: string;
  scheduledTimestampUTC: Date;
  originalUserDateTimeString: string;
  userTimeZoneOffset: number | null;
  status: 'PENDING' | 'SENT' | 'FAILED_TO_SEND' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingLimitError {
  type: 'LIMIT_REACHED';
  message: string;
  currentCount: number;
  maxAllowed: number;
}

export type CreateScheduledMessageResult = 
  | { success: true; data: ScheduledMessage }
  | { success: false; error: PendingLimitError };

export type MessageStatus = 'PENDING' | 'SENT' | 'FAILED_TO_SEND' | 'CANCELLED';

/**
 * Creates a new scheduled message in the database
 * @param params The parameters for creating a scheduled message
 * @returns The created scheduled message or an error if the pending limit is reached
 */
export async function createScheduledMessage(params: CreateScheduledMessageParams): Promise<CreateScheduledMessageResult> {
  const { userId, recipient, dateTime, messageContent } = params;

  // Check pending message limit
  const pendingCount = await countPendingMessages(userId);
  if (pendingCount >= MAX_PENDING_MESSAGES) {
    return {
      success: false,
      error: {
        type: 'LIMIT_REACHED',
        message: `Has alcanzado el límite de ${MAX_PENDING_MESSAGES} mensajes pendientes. Por favor, espera a que algunos mensajes sean enviados antes de programar más.`,
        currentCount: pendingCount,
        maxAllowed: MAX_PENDING_MESSAGES
      }
    };
  }

  const message = await prisma.scheduledMessage.create({
    data: {
      userId,
      recipientIdentifier: recipient.phoneNumber,
      originalRecipientString: recipient.originalInput,
      messageContent,
      scheduledTimestampUTC: dateTime.utcTimestamp,
      originalUserDateTimeString: dateTime.originalString,
      userTimeZoneOffset: dateTime.userTimeZoneOffset,
      status: 'PENDING'
    }
  });

  return {
    success: true,
    data: message
  };
}

/**
 * Counts the number of pending messages for a given user
 * @param userId The WhatsApp ID of the user
 * @returns The number of pending messages
 */
export async function countPendingMessages(userId: string): Promise<number> {
  return await prisma.scheduledMessage.count({
    where: {
      userId,
      status: 'PENDING'
    }
  });
}

/**
 * Gets all pending messages that are due for sending
 * @returns Array of scheduled messages that are due
 */
export async function getDueMessages(): Promise<ScheduledMessage[]> {
  const now = new Date();

  return await prisma.scheduledMessage.findMany({
    where: {
      status: 'PENDING',
      scheduledTimestampUTC: {
        lte: now
      }
    },
    orderBy: {
      scheduledTimestampUTC: 'asc'
    },
    take: MAX_BATCH_SIZE
  });
}

/**
 * Updates the status of a scheduled message
 * @param jobId The ID of the scheduled message
 * @param status The new status to set
 * @returns The updated scheduled message
 * @throws Error if the message is not found
 */
export async function updateMessageStatus(jobId: string, status: MessageStatus): Promise<ScheduledMessage> {
  const message = await prisma.scheduledMessage.update({
    where: { jobId },
    data: { status }
  });

  if (!message) {
    throw new Error(`Message with jobId ${jobId} not found`);
  }

  return message;
} 