import { WAMessage } from '@whiskeysockets/baileys';
import { parseScheduleCommand } from './commandParser';
import { resolveRecipient } from './recipientResolver';
import { parseDateTimeToUTC } from './dateTimeParser';
import { createScheduledMessage } from './schedulerService';
import { sendResponseToUser } from '@/utils/whatsappSender';
import { formatMessage, MessageType } from '@/utils/messageFormatter';
import { isValidMessageContent } from './validation';

interface ScheduleCommandHandlerParams {
  message: WAMessage;
  senderPhone: string;
}

export async function handleScheduleCommand({ message, senderPhone }: ScheduleCommandHandlerParams): Promise<void> {
  const messageText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';

  try {
    // Parse the command
    const parseResult = parseScheduleCommand(messageText);
    if (!parseResult.success) {
      const messageType: MessageType = 
        parseResult.error.type === 'MISSING_RECIPIENT' ? 'ERROR_MISSING_RECIPIENT' :
        parseResult.error.type === 'MISSING_DATETIME' ? 'ERROR_MISSING_DATETIME' :
        parseResult.error.type === 'MISSING_MESSAGE' ? 'ERROR_MISSING_MESSAGE' :
        'ERROR_INTERNAL';
      
      await sendResponseToUser(senderPhone, formatMessage(messageType));
      return;
    }

    // Resolve recipient
    const recipientResult = resolveRecipient(parseResult.data.recipient);
    if (!recipientResult.success) {
      await sendResponseToUser(senderPhone, formatMessage('ERROR_INVALID_PHONE', {
        recipientPhone: parseResult.data.recipient
      }));
      return;
    }

    // Parse date and time
    const dateTimeResult = parseDateTimeToUTC(parseResult.data.dateTimeString, message);
    if (!dateTimeResult.success) {
      const messageType: MessageType = 
        dateTimeResult.error.type === 'PAST_DATE' ? 'ERROR_PAST_DATETIME' :
        dateTimeResult.error.type === 'AMBIGUOUS' ? 'ERROR_AMBIGUOUS_DATETIME' :
        'ERROR_INVALID_DATETIME';
      
      await sendResponseToUser(senderPhone, formatMessage(messageType));
      return;
    }

    // Validate message content
    if (!isValidMessageContent(parseResult.data.messageContent)) {
      await sendResponseToUser(senderPhone, formatMessage('ERROR_INVALID_MESSAGE', {
        messageContent: parseResult.data.messageContent
      }));
      return;
    }

    // Create scheduled message
    const createResult = await createScheduledMessage({
      userId: senderPhone,
      recipient: recipientResult.data,
      dateTime: dateTimeResult.data,
      messageContent: parseResult.data.messageContent
    });

    if (!createResult.success) {
      await sendResponseToUser(senderPhone, formatMessage('ERROR_LIMIT_REACHED', {
        limit: createResult.error.maxAllowed
      }));
      return;
    }

    // Convert UTC time back to Chile time for display
    const chileTime = new Date(createResult.data.scheduledTimestampUTC.getTime() + (4 * 60 * 60 * 1000)); // Add 4 hours to convert from UTC to Chile time
    
    // Format the date in Spanish Chile locale
    const formattedDate = chileTime.toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Send success message
    await sendResponseToUser(senderPhone, formatMessage('SUCCESS_SCHEDULE', {
      dateTime: formattedDate
    }));
  } catch (error) {
    // Handle any unexpected errors
    await sendResponseToUser(senderPhone, formatMessage('ERROR_INTERNAL', {
      error: error instanceof Error ? error.message : 'Error desconocido'
    }));
  }
} 