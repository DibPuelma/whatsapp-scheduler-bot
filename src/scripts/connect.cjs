const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const { join } = require('path');
const { mkdir } = require('fs/promises');

// Path for auth files
const AUTH_FOLDER_PATH = join(process.cwd(), '.auth');
let sock = null;

async function connectToWhatsApp() {
  try {
    // Create auth folder if it doesn't exist
    await mkdir(AUTH_FOLDER_PATH, { recursive: true });

    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER_PATH);

    // Create socket connection
    sock = makeWASocket({
      printQRInTerminal: true,
      auth: state,
    });

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error instanceof Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        console.log(
          'Connection closed due to ',
          lastDisconnect?.error,
          ', reconnecting ',
          shouldReconnect
        );

        // Reconnect if not logged out
        if (shouldReconnect) {
          await connectToWhatsApp();
        }
      }

      console.log('Connection update:', update);
    });

    // Handle credentials updates
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0];

      if (!msg.key.fromMe && m.type === 'notify') {
        console.log('Received message:', {
          from: msg.key.remoteJid,
          message: msg.message,
          messageType: Object.keys(msg.message || {})[0], // Get the message type
          timestamp: new Date(msg.messageTimestamp * 1000),
        });
      }
    });

    return sock;
  } catch (error) {
    console.error('Error in connectToWhatsApp:', error);
    throw error;
  }
}

console.log('Starting WhatsApp connection...');
console.log('Please wait for the QR code to appear...');

connectToWhatsApp().catch((err) => console.error('Error in initialization:', err)); 