import { WAMessage } from '@whiskeysockets/baileys';
import { MessageViewResult, FormattedScheduledMessage } from '../../../types/messages';
import { parseViewMessageRequest } from '../../../utils/messageViewParser';
import { getScheduledMessages } from '../../../lib/queries/messages';
import { isWhitelisted } from '../../../config/whitelist';
import { Prisma } from '../../../generated/prisma';
import { prisma } from '../../../lib/prisma';
import {
  INVALID_VIEW_REQUEST,
  ERROR_FETCHING_MESSAGES,
  NO_MESSAGES,
  NO_MORE_MESSAGES,
  MORE_MESSAGES_AVAILABLE,
  SHOWING_MESSAGES_HEADER,
  SHOWING_MORE_MESSAGES_HEADER,
  UNAUTHORIZED_NUMBER,
  DATABASE_CONNECTION_ERROR,
  DATABASE_QUERY_ERROR,
  TOTAL_MESSAGES_SUMMARY,
} from '../../../constants/messages';

interface ViewMessagesHandlerParams {
  message: WAMessage;
  senderPhone: string;
  offset?: number;
}

const MESSAGES_PER_PAGE = 10;

/**
 * Updates message viewing statistics for a user
 * @param senderPhone The phone number of the user viewing messages
 * @param offset The current pagination offset
 */
async function updateViewStats(senderPhone: string, offset: number): Promise<void> {
  try {
    await prisma.messageViewStats.upsert({
      where: {
        senderPhone,
      },
      create: {
        senderPhone,
        totalViews: 1,
        lastOffset: offset,
        lastViewedAt: new Date(),
      },
      update: {
        totalViews: { increment: 1 },
        lastOffset: offset,
        lastViewedAt: new Date(),
      },
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('Error updating message view stats:', {
      error,
      senderPhone,
      offset,
    });
  }
}

/**
 * Validates a phone number format
 * @param phone Phone number to validate
 * @returns true if the phone number is valid
 */
function isValidPhoneNumber(phone: string): boolean {
  return /^\+\d+$/.test(phone.trim());
}

/**
 * Formats a date in Spanish locale
 */
function formatDateInSpanish(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats messages for display
 */
function formatMessages(messages: Array<{
  scheduledAt: Date;
  phone: string;
  content: string;
}>): FormattedScheduledMessage[] {
  return messages.map(msg => ({
    date: formatDateInSpanish(msg.scheduledAt),
    recipient: msg.phone,
    content: msg.content,
  }));
}

/**
 * Handler for viewing scheduled messages
 * This is the main entry point for the message viewing feature
 */
export async function handleViewMessages({
  message,
  senderPhone,
  offset = 0,
}: ViewMessagesHandlerParams): Promise<MessageViewResult> {
  try {
    // Validate sender phone number format
    if (!isValidPhoneNumber(senderPhone)) {
      return {
        type: 'ERROR',
        error: INVALID_VIEW_REQUEST,
      };
    }

    // Add + prefix if missing
    const normalizedPhone = senderPhone.startsWith('+') ? senderPhone : `+${senderPhone}`;

    // Check if the sender is whitelisted
    if (!isWhitelisted(normalizedPhone)) {
      return {
        type: 'ERROR',
        error: UNAUTHORIZED_NUMBER,
      };
    }

    // Get the message text
    const messageText = message.message?.conversation || 
                       message.message?.extendedTextMessage?.text || 
                       '';

    // Parse the view request
    const viewRequest = parseViewMessageRequest(messageText);

    // If the request is invalid, return error
    if (!viewRequest.isValid) {
      return {
        type: 'ERROR',
        error: viewRequest.error || INVALID_VIEW_REQUEST,
      };
    }

    try {
      // Get messages from database
      const result = await getScheduledMessages({
        senderPhone: normalizedPhone, // Use normalized phone number
        limit: MESSAGES_PER_PAGE,
        offset: viewRequest.isMoreRequest ? offset : 0,
      });

      // Update view statistics
      await updateViewStats(normalizedPhone, offset);

      // Handle no messages case
      if (result.total === 0) {
        return {
          type: 'NO_MESSAGES',
        };
      }

      // Handle "ver más" when no more messages
      if (viewRequest.isMoreRequest && result.messages.length === 0) {
        return {
          type: 'NO_MORE_MESSAGES',
        };
      }

      // Format messages and prepare response
      const formattedMessages = formatMessages(result.messages);
      const remainingCount = result.total - (offset + result.messages.length);

      return {
        type: 'SHOW_MESSAGES',
        data: {
          messages: formattedMessages,
          remainingCount,
          hasMore: result.hasMore,
          header: viewRequest.isMoreRequest ? 
            SHOWING_MORE_MESSAGES_HEADER :
            `${SHOWING_MESSAGES_HEADER}\n${TOTAL_MESSAGES_SUMMARY.replace('{count}', result.total.toString())}`,
          footer: result.hasMore ? 
            MORE_MESSAGES_AVAILABLE.replace('{count}', remainingCount.toString()) :
            undefined,
        },
      };
    } catch (dbError) {
      // Log the database error with details
      console.error('Database error in handleViewMessages:', {
        error: dbError,
        senderPhone: normalizedPhone,
        offset,
        isMoreRequest: viewRequest.isMoreRequest,
      });

      // Handle specific Prisma errors
      if (dbError instanceof Prisma.PrismaClientInitializationError) {
        return {
          type: 'ERROR',
          error: DATABASE_CONNECTION_ERROR,
        };
      }

      if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
        // Log specific Prisma error details
        console.error('Prisma known request error:', {
          code: dbError.code,
          meta: dbError.meta,
          message: dbError.message,
        });
        return {
          type: 'ERROR',
          error: DATABASE_QUERY_ERROR,
        };
      }

      // For any other database errors
      return {
        type: 'ERROR',
        error: ERROR_FETCHING_MESSAGES,
      };
    }
  } catch (error) {
    // Log any other unexpected errors
    console.error('Unexpected error in handleViewMessages:', error);
    return {
      type: 'ERROR',
      error: ERROR_FETCHING_MESSAGES,
    };
  }
} 