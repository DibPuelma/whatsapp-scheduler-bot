import * as baileys from '@whiskeysockets/baileys';
import { createServer } from 'http';
import { isWhitelisted } from '@/config/whitelist';
import { 
  INVALID_MESSAGE, 
  MISSING_DATE_MESSAGE, 
  MISSING_PHONE_MESSAGE, 
  MISSING_TIME_MESSAGE,
  NO_MESSAGES,
  NO_MORE_MESSAGES
} from '@/constants/messages';
import { handleViewMessages } from './handlers/viewMessages';
import { parseViewMessageRequest } from '@/utils/messageViewParser';
import fetch from 'node-fetch';

// Constants
const BOT_PORT = 3001;
const DEV_SERVER_BASE_URL = 'http://localhost:3000';
const CONNECTION_STATE_ENDPOINT = `${DEV_SERVER_BASE_URL}/api/trpc/whatsapp.getConnectionStatus?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D`;
const SEND_MESSAGE_ENDPOINT = `${DEV_SERVER_BASE_URL}/api/trpc/whatsapp.sendMessage?batch=1`;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get connection state via HTTP API
async function getConnectionStateFromAPI() {
  try {
    const response = await fetch(CONNECTION_STATE_ENDPOINT);
    
    if (!response.ok) {
      console.error(`API returned status ${response.status}`);
      return { isConnected: false, isConnecting: false, hasQRCode: false, lastError: `API error: ${response.status}` };
    }
    
    const data = await response.json() as { 
      result: { 
        data: { 
          json: {
            success: boolean;
            isConnected: boolean;
            isConnecting: boolean;
            hasQRCode: boolean;
            lastError: string | null;
            error?: string;
          }
        } 
      } 
    }[];
    
    console.log('Raw API response:', JSON.stringify(data, null, 2));
    
    // Handle TRPC response format
    const result = data[0]?.result?.data?.json;
    if (result && result.success) {
      return {
        isConnected: result.isConnected || false,
        isConnecting: result.isConnecting || false,
        hasQRCode: result.hasQRCode || false,
        lastError: result.lastError || null
      };
    } else {
      console.error('API returned error:', result?.error || 'Unknown error');
      console.error('Full result:', JSON.stringify(result, null, 2));
      return { isConnected: false, isConnecting: false, hasQRCode: false, lastError: result?.error || 'API error' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to get connection state from API:', errorMessage);
    if (error instanceof Error && error.stack) {
      console.error('Error stack:', error.stack);
    }
    return { isConnected: false, isConnecting: false, hasQRCode: false, lastError: 'API call failed' };
  }
}

// Helper function to send a message via the dev server
async function sendMessageViaAPI(targetJid: string, content: string, retries = MAX_RETRIES): Promise<boolean> {
  try {
    console.log(`Sending message to ${targetJid}:`, {
      content: content.substring(0, 50) + '...',
      retries
    });
    
    const response = await fetch(SEND_MESSAGE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "0": {
          "json": {
            targetJid,
            content
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const data = result[0]?.result?.data?.json;
    
    if (data && data.success) {
      console.log(`Successfully sent message to ${targetJid}`);
      return true;
    } else {
      throw new Error(data?.error || 'Send failed');
    }
  } catch (error) {
    console.error(`Send attempt failed (${MAX_RETRIES - retries + 1}/${MAX_RETRIES}):`, error);
    
    if (retries > 1) {
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await delay(RETRY_DELAY);
      return sendMessageViaAPI(targetJid, content, retries - 1);
    }
    
    throw error;
  }
}

// Message handler function
const handleMessage = async (message: baileys.WAMessage) => {
  const senderPhone = message.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
  const messageText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
  
  // List of supported commands
  const supportedCommands = ['/schedule', '/list', '/cancel', '/help', '/status'];
  
  // Skip messages sent by the bot itself, UNLESS they contain a command
  if (message.key.fromMe) {
    const isCommand = supportedCommands.some(cmd => messageText.startsWith(cmd));
    if (!isCommand) {
      console.log('Skipping non-command message from bot itself:', messageText.substring(0, 50));
      return;
    } else {
      console.log('Processing command message from bot itself:', messageText);
    }
  }

  console.log('Raw message details:', {
    senderPhone,
    messageText,
    messageType: message.message ? Object.keys(message.message) : 'no message object',
    fullMessage: JSON.stringify(message, null, 2)
  });

  if (
    [
      MISSING_TIME_MESSAGE,
      MISSING_DATE_MESSAGE,
      MISSING_PHONE_MESSAGE,
      INVALID_MESSAGE,
      NO_MESSAGES,
      NO_MORE_MESSAGES
    ].includes(messageText)
    || messageText.includes('¡Mensaje programado con éxito!')
  ) {
    console.log('Skipping system message:', messageText);
    return;
  }

  const senderPhoneWithPrefix = '+' + senderPhone;
  
  console.log('Processing message:', {
    from: senderPhoneWithPrefix,
    text: messageText,
    isWhitelisted: isWhitelisted(senderPhoneWithPrefix),
    isFromOwner: message.key.fromMe,
    securityLevel: message.key.fromMe ? '👑 Owner (can schedule)' : 
                   isWhitelisted(senderPhoneWithPrefix) ? '✅ Whitelisted (can view)' : 
                   '❌ Not authorized'
  });

  // Skip processing if sender is not whitelisted
  if (!isWhitelisted(senderPhoneWithPrefix)) {
    console.log('Ignoring message from non-whitelisted number:', senderPhoneWithPrefix);
    return;
  }

  try {
    // Check if this is a schedule command - ONLY allow from user themselves (fromMe: true)
    if (messageText.startsWith('/schedule')) {
      if (!message.key.fromMe) {
        console.log('🚫 Schedule command denied - only the account owner can schedule messages');
        try {
          await sendMessageViaAPI(message.key.remoteJid!, 
            '🚫 Solo el propietario de la cuenta puede programar mensajes. Otros usuarios solo pueden ver mensajes programados.');
        } catch (sendError) {
          console.error('Failed to send schedule denial message:', sendError);
        }
        return;
      }
      
      console.log('Processing schedule command from account owner:', messageText);
      
      // Process the schedule command and get the response
      let responseMessage = '';
      try {
        // Import the dependencies locally to avoid the whatsappSender context issue
        const { parseScheduleCommand } = await import('@/lib/scheduler/commandParser');
        const { resolveRecipient } = await import('@/lib/scheduler/recipientResolver');
        const { parseDateTimeToUTC } = await import('@/lib/scheduler/dateTimeParser');
        const { createScheduledMessage } = await import('@/lib/scheduler/schedulerService');
        const { formatMessage } = await import('@/utils/messageFormatter');
        const { isValidMessageContent } = await import('@/lib/scheduler/validation');

        // Parse the command
        const parseResult = parseScheduleCommand(messageText);
        if (!parseResult.success) {
          const messageType = 
            parseResult.error.type === 'MISSING_RECIPIENT' ? 'ERROR_MISSING_RECIPIENT' :
            parseResult.error.type === 'MISSING_DATETIME' ? 'ERROR_MISSING_DATETIME' :
            parseResult.error.type === 'MISSING_MESSAGE' ? 'ERROR_MISSING_MESSAGE' :
            'ERROR_INTERNAL';
          
          responseMessage = formatMessage(messageType);
        } else {
          // Resolve recipient
          const recipientResult = resolveRecipient(parseResult.data.recipient);
          if (!recipientResult.success) {
            responseMessage = formatMessage('ERROR_INVALID_PHONE', {
              recipientPhone: parseResult.data.recipient
            });
          } else {
            // Parse date and time
            const dateTimeResult = parseDateTimeToUTC(parseResult.data.dateTimeString, message);
            if (!dateTimeResult.success) {
              const messageType = 
                dateTimeResult.error.type === 'PAST_DATE' ? 'ERROR_PAST_DATETIME' :
                dateTimeResult.error.type === 'AMBIGUOUS' ? 'ERROR_AMBIGUOUS_DATETIME' :
                'ERROR_INVALID_DATETIME';
              
              responseMessage = formatMessage(messageType);
            } else {
              // Validate message content
              if (!isValidMessageContent(parseResult.data.messageContent)) {
                responseMessage = formatMessage('ERROR_INVALID_MESSAGE', {
                  messageContent: parseResult.data.messageContent
                });
              } else {
                // Create scheduled message
                const createResult = await createScheduledMessage({
                  userId: senderPhoneWithPrefix,
                  recipient: recipientResult.data,
                  dateTime: dateTimeResult.data,
                  messageContent: parseResult.data.messageContent
                });

                if (!createResult.success) {
                  responseMessage = formatMessage('ERROR_LIMIT_REACHED', {
                    limit: createResult.error.maxAllowed
                  });
                } else {
                  // Convert UTC time back to Chile time for display
                  const chileTime = new Date(createResult.data.scheduledTimestampUTC.getTime() + (4 * 60 * 60 * 1000));
                  
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
                  responseMessage = formatMessage('SUCCESS_SCHEDULE', {
                    dateTime: formattedDate
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing schedule command:', error);
        const { formatMessage } = await import('@/utils/messageFormatter');
        responseMessage = formatMessage('ERROR_INTERNAL', {
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }

      // Send the response message via bot's API
      if (responseMessage) {
        try {
          await sendMessageViaAPI(message.key.remoteJid!, responseMessage);
          console.log('Schedule command response sent successfully');
        } catch (sendError) {
          console.error('Failed to send schedule command response:', sendError);
        }
      }

      return;
    }

    // First check if this is a view messages request
    const viewRequest = parseViewMessageRequest(messageText);
    if (viewRequest.isValid) {
      console.log('Processing view messages request:', messageText);
      const result = await handleViewMessages({
        message,
        senderPhone: senderPhoneWithPrefix,
        offset: 0
      });

      let replyMessage = '';
      switch (result.type) {
        case 'SHOW_MESSAGES':
          replyMessage = `${result.data.header}\n\n${result.data.messages.map((msg: { date: string; recipient: string; content: string }) => 
            `📅 ${msg.date}\n📱 ${msg.recipient}\n💬 ${msg.content}`
          ).join('\n\n')}${result.data.footer ? `\n\n${result.data.footer}` : ''}`;
          break;
        case 'NO_MESSAGES':
          replyMessage = 'No tienes mensajes programados.';
          break;
        case 'ERROR':
          replyMessage = result.error;
          break;
      }

      // Send response back to user via API
      try {
        await sendMessageViaAPI(message.key.remoteJid!, replyMessage);
      } catch (sendError) {
        console.error('Failed to send view messages response:', sendError);
      }
      return;
    }

    // If we get here, it's an unknown command or message
    console.log('Unknown command or message:', messageText);
  } catch (error) {
    console.error('Error processing message:', error);
    
    // Send error message back to user via API
    try {
      await sendMessageViaAPI(message.key.remoteJid!, 
        'Lo siento, hubo un error procesando tu mensaje. Por favor, intenta nuevamente.');
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
};

// Create HTTP server to receive messages from dev server
function createMessageServer() {
  const server = createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/messages') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { messages } = JSON.parse(body);
          console.log('📨 Bot received messages from dev server:', messages.length);
          
          for (const message of messages) {
            await handleMessage(message);
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          console.error('Error processing messages:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to process messages' }));
        }
      });
    } else if (req.method === 'POST' && req.url === '/send-message') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { recipientPhone, content } = JSON.parse(body);
          console.log('📤 Bot received send-message request:', { recipientPhone, content: content.substring(0, 50) + '...' });
          
          // Format phone number to JID
          const recipientJID = `${recipientPhone.replace('+', '')}@s.whatsapp.net`;
          
          // Send message via API
          await sendMessageViaAPI(recipientJID, content);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          console.error('Error sending message:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to send message' 
          }));
        }
      });
    } else if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'whatsapp-bot' }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(BOT_PORT, () => {
    console.log(`🤖 Bot message server listening on port ${BOT_PORT}`);
  });

  return server;
}

// Main connection monitoring function
async function monitorConnection() {
  console.log('🔄 Starting connection monitor...');
  
  let lastConnectionState = false;
  let consecutiveFailures = 0;
  
  const checkConnection = setInterval(async () => {
    try {
      const state = await getConnectionStateFromAPI();
      
      // Reset failure count on successful API call
      if (consecutiveFailures > 0) {
        console.log('✅ API connection restored');
        consecutiveFailures = 0;
      }
      
      // Handle connection state changes
      if (state.isConnected && !lastConnectionState) {
        console.log('🟢 WhatsApp connection detected - bot ready to process messages');
        lastConnectionState = true;
        
      } else if (!state.isConnected && lastConnectionState) {
        console.log('🔴 WhatsApp connection lost');
        lastConnectionState = false;
        
      } else if (state.hasQRCode && !lastConnectionState) {
        console.log('🔍 QR code available for scanning at http://localhost:3000/link-whatsapp');
      }
      
      // Log current state periodically (every minute)
      if (Date.now() % 60000 < 5000) {
        const status = state.isConnected ? '🟢 Connected' : 
                      state.isConnecting ? '🟡 Connecting' : 
                      state.hasQRCode ? '🔍 QR Available' : '🔴 Disconnected';
        console.log(`📊 Status: ${status} | Bot: ${lastConnectionState ? 'Ready' : 'Waiting'}`);
      }
      
    } catch (error) {
      consecutiveFailures++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error in connection check:', errorMessage);
      
      // Only log waiting message every 30 seconds to avoid spam
      if (Date.now() % 30000 < 5000) {
        console.log(`⏳ Waiting for dev server... (${consecutiveFailures} consecutive failures)`);
      }
    }
  }, 5000); // Increased from 2000ms to 5000ms
  
  return checkConnection;
}

// Start the bot
async function startBot() {
  console.log('🚀 Starting WhatsApp Scheduler Bot...');
  console.log('📱 The bot will automatically process messages when WhatsApp is connected');
  console.log('🌐 Visit http://localhost:3000/link-whatsapp to scan QR code');
  console.log('ℹ️  Make sure the dev server (npm run dev) is running');
  console.log('');
  
  // Create message server
  const server = createMessageServer();
  
  // Start connection monitoring
  const connectionMonitor = await monitorConnection();
  
  // Cleanup on exit
  process.on('SIGINT', () => {
    console.log('🛑 Bot shutting down...');
    clearInterval(connectionMonitor);
    server.close();
    process.exit(0);
  });
}

startBot().catch(console.error); 