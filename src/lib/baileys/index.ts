import * as baileys from '@whiskeysockets/baileys';
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys;
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { Boom } from '@hapi/boom';
import { isWhitelisted } from '@/config/whitelist';
import { 
  INVALID_MESSAGE, 
  MISSING_DATE_MESSAGE, 
  MISSING_PHONE_MESSAGE, 
  MISSING_TIME_MESSAGE 
} from '@/constants/messages';
import { prisma } from '@/lib/prisma';

// Path for auth files
const AUTH_FOLDER_PATH = join(process.cwd(), '.auth');

// API endpoints
const API_BASE_URL = 'http://localhost:3000/api';
const SCHEDULE_ENDPOINT = `${API_BASE_URL}/nlp-schedule`;

// Constants for message sending
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds
const BATCH_SIZE = 5; // Process 5 messages at a time

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to send a message with retries
async function sendMessageWithRetry(
  sock: baileys.WASocket, 
  targetJid: string, 
  content: string, 
  retries = MAX_RETRIES
): Promise<boolean> {
  try {
    console.log(`Sending message to ${targetJid}:`, {
      content: content.substring(0, 50) + '...',
      retries
    });
    await sock.sendMessage(targetJid, { text: content });
    return true;
  } catch (error) {
    console.error(`Send attempt failed (${MAX_RETRIES - retries + 1}/${MAX_RETRIES}):`, error);
    
    if (retries > 1) {
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await delay(RETRY_DELAY);
      return sendMessageWithRetry(sock, targetJid, content, retries - 1);
    }
    
    throw error;
  }
}

// Initialize WhatsApp connection
export async function connectToWhatsApp() {
  try {
    // Create auth folder if it doesn't exist
    await mkdir(AUTH_FOLDER_PATH, { recursive: true });

    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER_PATH);

    // Create socket connection
    const sock = makeWASocket({
      printQRInTerminal: true,
      auth: state,
      // Browser info
      browser: ['Chrome (Linux)', '', ''],
    });

    // Handle connection updates
    sock.ev.on('connection.update', (update: Partial<baileys.ConnectionState>) => {
      const { connection, lastDisconnect } = update;
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
        
        // Reconnect if not logged out
        if (shouldReconnect) {
          connectToWhatsApp();
        }
      } else if (connection === 'open') {
        console.log('opened connection');
        
        // Set up scheduled message processor
        setInterval(async () => {
          try {
            console.log('Checking for scheduled messages...');
            
            // Find all pending messages that should be sent now
            const pendingMessages = await prisma.scheduledMessage.findMany({
              where: {
                status: 'pending',
                scheduledAt: {
                  lte: new Date()
                }
              },
              take: BATCH_SIZE, // Process messages in batches
              orderBy: {
                scheduledAt: 'asc' // Process oldest messages first
              }
            });

            console.log(`Found ${pendingMessages.length} messages to send`);

            // Process each message
            for (const message of pendingMessages) {
              try {
                console.log(`Processing message ${message.id}:`, {
                  to: message.phone,
                  scheduledAt: message.scheduledAt,
                  content: message.content.substring(0, 50) + '...' // Log truncated content
                });

                // Mark message as processing to prevent duplicate sends
                await prisma.scheduledMessage.update({
                  where: { id: message.id },
                  data: { status: 'processing' }
                });

                // Add WhatsApp suffix if not present
                const phoneWithoutPlus = message.phone.startsWith('+') ? message.phone.slice(1) : message.phone;
                const targetJid = phoneWithoutPlus.includes('@s.whatsapp.net') 
                  ? phoneWithoutPlus 
                  : `${phoneWithoutPlus}@s.whatsapp.net`;
                

                // Send the message with retry logic
                await sendMessageWithRetry(sock, targetJid, message.content);

                // Update message status to sent
                await prisma.scheduledMessage.update({
                  where: { id: message.id },
                  data: { 
                    status: 'sent',
                    sentAt: new Date()
                  }
                });

                console.log(`Successfully sent and updated message ${message.id}`);
                
                // Add a small delay between messages to prevent rate limiting
                await delay(1000);
              } catch (error) {
                console.error(`Error processing message ${message.id}:`, error);
                
                const errorMessage = error instanceof Error 
                  ? error.message 
                  : error instanceof Boom 
                    ? error.output?.payload?.message || 'Unknown Boom error'
                    : 'Unknown error';
                
                // Update message status to failed
                await prisma.scheduledMessage.update({
                  where: { id: message.id },
                  data: { 
                    status: 'failed',
                    error: errorMessage
                  }
                });
              }
            }
          } catch (error) {
            console.error('Error in scheduled message processor:', error);
          }
        }, 30000); // Run every 30 seconds
      }
    });

    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);

    // Handle messages
    sock.ev.on('messages.upsert', async ({ messages }: { messages: baileys.WAMessage[] }) => {
      console.log('Got messages:', messages);
      
      for (const message of messages) {

        const senderPhone = message.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
        const messageText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        if (
          [
            MISSING_TIME_MESSAGE,
            MISSING_DATE_MESSAGE,
            MISSING_PHONE_MESSAGE,
            INVALID_MESSAGE
          ].includes(messageText)
          || messageText.includes('¡Mensaje programado con éxito!')
        ) continue;

        const senderPhoneWithPrefix = '+' + senderPhone;
        
        console.log('Processing message:', {
          from: senderPhoneWithPrefix,
          text: messageText
        });

        // Skip processing if sender is not whitelisted
        if (!isWhitelisted(senderPhoneWithPrefix)) {
          console.log('Ignoring message from non-whitelisted number:', senderPhoneWithPrefix);
          continue;
        }

        try {
          // Call the NLP scheduling API
          const response = await fetch(SCHEDULE_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              input: messageText,
              senderPhone: senderPhoneWithPrefix,
            }),
          });

          const result = await response.json();

          // Send response back to the user
          if (response.ok) {
            let replyMessage = '';
            
            if (result.message) {
              // This is a follow-up request
              replyMessage = result.message;
            } else {
              // This is a successful scheduling
              const scheduledDate = new Date(result.scheduledAt).toLocaleString('es-ES', {
                dateStyle: 'full',
                timeStyle: 'short',
              });
              replyMessage = `¡Mensaje programado con éxito!\nPara: ${result.phone}\nFecha: ${scheduledDate}\nContenido: ${result.content}`;
            }

            await sock.sendMessage(message.key.remoteJid!, {
              text: replyMessage
            });
          } else {
            // Handle error
            const errorMessage = result.error || 'Lo siento, hubo un error al procesar tu mensaje.';
            await sock.sendMessage(message.key.remoteJid!, {
              text: errorMessage
            });
          }
        } catch (error) {
          console.error('Error processing message:', error);
          await sock.sendMessage(message.key.remoteJid!, {
            text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.'
          });
        }
      }
    });

    return sock;
  } catch (err) {
    console.error('Error in initWhatsApp:', err);
    throw err;
  }
}

// Run in main file
connectToWhatsApp().catch(err => console.error('Error in initialization:', err)); 