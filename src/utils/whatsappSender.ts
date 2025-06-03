import { WhatsAppManager } from '@/lib/whatsapp';
import { logger } from '@/lib/logger';

// Configuration for API-based sending (when running as bot)
const DEV_SERVER_BASE_URL = 'http://localhost:3000';
const SEND_MESSAGE_ENDPOINT = `${DEV_SERVER_BASE_URL}/api/trpc/whatsapp.sendMessage?batch=1`;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

/**
 * Helper function to add delay
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Detects if we're running in bot context (port 3001) vs dev server context (port 3000)
 */
function isBotContext(): boolean {
  // Check multiple indicators that we're in bot context
  const portCheck = process.env.PORT === '3001';
  const argvCheck = process.argv.some(arg => arg.includes('bot') || arg.includes('src/lib/baileys/index.ts'));
  const processCheck = process.title?.includes('tsx') && process.argv.some(arg => arg.includes('baileys'));
  
  return portCheck || argvCheck || processCheck;
}

/**
 * Sends message via dev server API (for bot context)
 */
async function sendMessageViaAPI(targetJid: string, content: string, retries = MAX_RETRIES): Promise<void> {
  try {
    logger.info(`Sending message via API to ${targetJid}`);
    
    const requestBody = {
      "0": {
        "json": {
          targetJid,
          content
        }
      }
    };
    
    const response = await fetch(SEND_MESSAGE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`API HTTP error: ${response.status} - ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const data = result[0]?.result?.data?.json;
    
    if (!data || !data.success) {
      logger.error(`API returned failure:`, { data, fullResult: result });
      throw new Error(data?.error || 'Send failed');
    }

    logger.info(`Successfully sent message via API to ${targetJid}`);
  } catch (error) {
    logger.error(`API send attempt failed (${MAX_RETRIES - retries + 1}/${MAX_RETRIES}):`, error);
    
    if (retries > 1) {
      logger.info(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await delay(RETRY_DELAY);
      return sendMessageViaAPI(targetJid, content, retries - 1);
    }
    
    throw new Error(`Failed to send message via API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Formats a phone number to WhatsApp JID format
 * @param phoneNumber Phone number in international format (e.g., +56912345678)
 * @returns WhatsApp JID (e.g., 56912345678@s.whatsapp.net)
 */
export function formatToJID(phoneNumber: string): string {
  // Remove the '+' prefix and append the WhatsApp suffix
  return `${phoneNumber.replace('+', '')}@s.whatsapp.net`;
}

/**
 * Sends a message to a WhatsApp user
 * @param recipientPhone Recipient's phone number in international format (e.g., +56912345678)
 * @param content Message content
 * @throws Error if WhatsApp is not connected or if sending fails
 */
export async function sendWhatsAppMessage(recipientPhone: string, content: string): Promise<void> {
  const recipientJID = formatToJID(recipientPhone);
  
  try {
    if (isBotContext()) {
      // We're running in bot context - use API to send via dev server
      await sendMessageViaAPI(recipientJID, content);
    } else {
      // We're running in dev server context - use direct WhatsApp connection
      const whatsapp = WhatsAppManager.getInstance();
      if (!whatsapp.getConnectionState().isConnected) {
        throw new Error('WhatsApp is not connected');
      }

      // Log the attempt
      logger.info(`Sending WhatsApp message to ${recipientPhone}`);

      // Send the message
      await whatsapp.sendMessage(recipientJID, content);
      
      // Log success
      logger.info(`Successfully sent WhatsApp message to ${recipientPhone}`);
    }
  } catch (error) {
    // Log the error with details
    logger.error(`Failed to send WhatsApp message to ${recipientPhone}:`, error);
    
    // Rethrow with a user-friendly message
    throw new Error(`Failed to send WhatsApp message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Sends a message to the user who sent a command
 * @param senderPhone Sender's phone number in international format
 * @param content Message content
 */
export async function sendResponseToUser(senderPhone: string, content: string): Promise<void> {
  try {
    await sendWhatsAppMessage(senderPhone, content);
  } catch (error) {
    logger.error(`Failed to send response to user ${senderPhone}:`, error);
    // Don't rethrow here as this is a response to the user
    // and we don't want to trigger additional error handling
  }
} 