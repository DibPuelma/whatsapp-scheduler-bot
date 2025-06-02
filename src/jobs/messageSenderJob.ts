import { getDueMessages, updateMessageStatus } from '../lib/scheduler/schedulerService';
import { logger } from '@/lib/logger';

export type MessageStatus = 'PENDING' | 'SENT' | 'FAILED_TO_SEND';

/**
 * Sends message via bot API (for cron job context)
 */
async function sendMessageViaBotAPI(recipientPhone: string, content: string): Promise<void> {
  try {
    logger.info(`Sending message via bot API to ${recipientPhone}`);
    
    const response = await fetch('http://localhost:3001/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        recipientPhone,
        content 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Bot API HTTP error: ${response.status} - ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      logger.error(`Bot API returned failure:`, result);
      throw new Error(result.error || 'Send failed');
    }

    logger.info(`Successfully sent message via bot API to ${recipientPhone}`);
  } catch (error) {
    logger.error(`Bot API send failed:`, error);
    throw new Error(`Failed to send message via bot API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function processScheduledMessages() {
  try {
    logger.info('Starting scheduled message processing');
    
    // Get all messages that are due to be sent
    const dueMessages = await getDueMessages();
    
    if (dueMessages.length === 0) {
      logger.info('No messages due for sending');
      return;
    }

    logger.info(`Found ${dueMessages.length} messages to process`);

    // Process each due message
    for (const message of dueMessages) {
      try {
        // Attempt to send the message via bot API
        await sendMessageViaBotAPI(message.recipientIdentifier, message.messageContent);
        
        // If successful, mark as sent
        await updateMessageStatus(message.jobId, 'SENT');
        
        logger.info(`Successfully sent message ${message.jobId} to ${message.recipientIdentifier}`);
      } catch (error) {
        // If failed, mark as failed and log the error
        await updateMessageStatus(message.jobId, 'FAILED_TO_SEND');
        
        logger.error(`Failed to send message ${message.jobId}:`, error);
      }
    }

    logger.info('Completed scheduled message processing');
  } catch (error) {
    logger.error('Error processing scheduled messages:', error);
    throw error; // Let the Vercel cron job know there was an error
  }
} 