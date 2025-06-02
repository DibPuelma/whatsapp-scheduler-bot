import { default as makeWASocket, DisconnectReason, WAConnectionState } from '@whiskeysockets/baileys';
import { useMultiFileAuthState } from '@whiskeysockets/baileys/lib/Utils/use-multi-file-auth-state';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { Boom } from '@hapi/boom';

interface WhatsAppState {
  socket: ReturnType<typeof makeWASocket> | null;
  qrCode: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  lastError: string | null;
}

export class WhatsAppManager {
  private static instance: WhatsAppManager;
  private state: WhatsAppState = {
    socket: null,
    qrCode: null,
    isConnecting: false,
    isConnected: false,
    lastError: null,
  };
  private qrCodePromise: Promise<string> | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): WhatsAppManager {
    if (!WhatsAppManager.instance) {
      WhatsAppManager.instance = new WhatsAppManager();
    }
    return WhatsAppManager.instance;
  }

  private async createSocket(): Promise<ReturnType<typeof makeWASocket>> {
    // Create auth folder if it doesn't exist
    const AUTH_FOLDER_PATH = join(process.cwd(), '.auth');
    await mkdir(AUTH_FOLDER_PATH, { recursive: true });

    // Load auth state
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER_PATH);

    // Create socket connection with better configuration
    const sock = makeWASocket({
      printQRInTerminal: false,
      auth: state,
      browser: ['WhatsApp Scheduler Bot', 'Chrome', '1.0.0'],
      connectTimeoutMs: 60000, // Increase timeout
      defaultQueryTimeoutMs: 20000,
      retryRequestDelayMs: 250,
      maxMsgRetryCount: 5,
      qrTimeout: 40000, // 40 seconds for QR generation
    });

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
      this.handleConnectionUpdate(update).catch(console.error);
    });
    
    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);

    // Handle messages and forward to bot (with filtering to prevent server overload)
    sock.ev.on('messages.upsert', async ({ messages }) => {
      // Import whitelist function
      const { isWhitelisted } = await import('@/config/whitelist');
      
      // Filter messages to only process relevant ones
      const relevantMessages = messages.filter(message => {
        // Skip messages without text content (media, system messages, etc.)
        const messageText = message.message?.conversation || message.message?.extendedTextMessage?.text;
        if (!messageText) {
          return false;
        }
        
        // Skip messages sent by the bot itself to prevent feedback loops
        // Only process user commands sent by the account owner (fromMe) if they start with /
        if (message.key.fromMe) {
          const supportedCommands = ['/schedule', '/list', '/cancel', '/help', '/status'];
          const isCommand = supportedCommands.some(cmd => messageText.startsWith(cmd));
          if (!isCommand) {
            console.log('Skipping non-command message from bot itself to prevent feedback loop:', messageText.substring(0, 50));
            return false;
          }
          console.log('Processing command message from account owner:', messageText);
        }
        
        // Check if message is from a whitelisted number
        const senderPhone = message.key.remoteJid?.replace('@s.whatsapp.net', '');
        if (senderPhone) {
          const senderPhoneWithPrefix = '+' + senderPhone;
          if (isWhitelisted(senderPhoneWithPrefix)) {
            return true;
          }
        }
        
        // Skip all other messages to prevent server overload
        return false;
      });
      
      // Only forward if we have relevant messages
      if (relevantMessages.length > 0) {
        console.log(`📨 Dev server forwarding ${relevantMessages.length}/${messages.length} relevant messages to bot...`);
        try {
          const response = await fetch('http://localhost:3001/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: relevantMessages }),
          });
          if (!response.ok) {
            console.log('Bot not available for message processing (this is normal if bot is not running)');
          }
        } catch {
          // Bot might not be running, which is fine
          console.log('Bot not available for message processing');
        }
      } else if (messages.length > 0) {
        console.log(`📨 Filtered out ${messages.length} irrelevant messages (not from user or whitelisted numbers)`);
      }
    });

    return sock;
  }

  private async handleConnectionUpdate(update: {
    connection?: WAConnectionState;
    lastDisconnect?: { error?: Error };
    qr?: string;
    isNewLogin?: boolean;
  }) {
    const { connection, lastDisconnect, qr } = update;
    
    console.log('Connection update:', { connection, qr: !!qr });

    if (qr) {
      this.state.qrCode = qr;
      console.log('QR code generated successfully');
    }

    if (connection === 'connecting') {
      this.state.isConnecting = true;
      this.state.isConnected = false;
      this.state.lastError = null;
    } else if (connection === 'open') {
      console.log('WhatsApp connection opened');
      this.state.isConnecting = false;
      this.state.isConnected = true;
      this.state.qrCode = null; // Clear QR code once connected
      this.state.lastError = null;
    } else if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed due to:', lastDisconnect?.error, ', should reconnect:', shouldReconnect);
      
      this.state.isConnecting = false;
      this.state.isConnected = false;
      this.state.socket = null;
      this.state.qrCode = null;
      this.initPromise = null;
      this.qrCodePromise = null;
      
      if (lastDisconnect?.error) {
        this.state.lastError = lastDisconnect.error.message;
      }
      
      // Only auto-reconnect for specific cases, not for general connection failures
      if (shouldReconnect && lastDisconnect?.error?.message !== 'Connection Failure') {
        console.log('Scheduling automatic reconnection in 3 seconds...');
        setTimeout(() => {
          this.initialize().catch((error) => {
            console.error('Auto-reconnection failed:', error);
            this.state.lastError = error.message;
          });
        }, 3000);
      } else {
        console.log('Not auto-reconnecting. User can request new QR code.');
      }
    }
  }

  async initialize(): Promise<void> {
    // If already initializing, wait for that to complete
    if (this.initPromise) {
      return this.initPromise;
    }

    // If already connected, no need to initialize
    if (this.state.isConnected && this.state.socket) {
      return;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    if (this.state.isConnecting) {
      return;
    }

    try {
      console.log('Initializing WhatsApp connection...');
      this.state.isConnecting = true;
      this.state.lastError = null;
      
      const socket = await this.createSocket();
      this.state.socket = socket;
      
      console.log('WhatsApp socket created successfully');
    } catch (error) {
      console.error('Error initializing WhatsApp:', error);
      this.state.isConnecting = false;
      this.state.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.initPromise = null;
      throw error;
    }
  }

  async getQRCode(): Promise<string> {
    // If we have a cached QR code, return it
    if (this.state.qrCode) {
      return this.state.qrCode;
    }

    // If already connected, no QR code needed
    if (this.state.isConnected) {
      throw new Error('WhatsApp is already connected');
    }

    // If there's already a QR code promise, wait for it
    if (this.qrCodePromise) {
      return this.qrCodePromise;
    }

    // Clear any previous errors when requesting a new QR code
    this.state.lastError = null;

    // If we have a failed connection, reset and start fresh
    if (this.state.socket && !this.state.isConnected && !this.state.isConnecting) {
      console.log('Resetting failed connection for fresh QR code generation');
      await this.reset();
    }

    // Start initialization if not already started
    if (!this.state.socket && !this.state.isConnecting) {
      await this.initialize();
    }

    // Create new QR code promise
    this.qrCodePromise = this.waitForQRCode();
    return this.qrCodePromise;
  }

  private async waitForQRCode(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.qrCodePromise = null;
        reject(new Error('QR code generation timeout after 45 seconds'));
      }, 45000);

      const checkQR = setInterval(() => {
        if (this.state.qrCode) {
          clearInterval(checkQR);
          clearTimeout(timeout);
          this.qrCodePromise = null;
          resolve(this.state.qrCode);
        }
        
        // Only reject on error if we're not trying to connect and have no socket
        if (this.state.lastError && !this.state.isConnecting && !this.state.socket) {
          clearInterval(checkQR);
          clearTimeout(timeout);
          this.qrCodePromise = null;
          reject(new Error(`Connection failed: ${this.state.lastError}`));
        }
        
        if (this.state.isConnected) {
          clearInterval(checkQR);
          clearTimeout(timeout);
          this.qrCodePromise = null;
          reject(new Error('WhatsApp is already connected'));
        }
      }, 500);
    });
  }

  getSocket() {
    return this.state.socket;
  }

  // Send a message through this socket (for bot to use)
  async sendMessage(targetJid: string, content: string): Promise<boolean> {
    if (!this.state.socket || !this.state.isConnected) {
      throw new Error('WhatsApp is not connected');
    }
    
    try {
      await this.state.socket.sendMessage(targetJid, { text: content });
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  getConnectionState() {
    return {
      isConnecting: this.state.isConnecting,
      isConnected: this.state.isConnected,
      hasQRCode: !!this.state.qrCode,
      lastError: this.state.lastError,
    };
  }

  // Reset the connection state (useful for testing or forced reconnection)
  async reset(): Promise<void> {
    if (this.state.socket) {
      this.state.socket.end(undefined);
    }
    
    this.state = {
      socket: null,
      qrCode: null,
      isConnecting: false,
      isConnected: false,
      lastError: null,
    };
    
    this.initPromise = null;
    this.qrCodePromise = null;
  }
}

// Export singleton instance functions
const manager = WhatsAppManager.getInstance();

export async function getWhatsAppQRCode(): Promise<string> {
  return manager.getQRCode();
}

export function getSocket() {
  return manager.getSocket();
}

export function getConnectionState() {
  return manager.getConnectionState();
}

export async function resetConnection(): Promise<void> {
  return manager.reset();
}

export async function sendWhatsAppMessage(targetJid: string, content: string): Promise<boolean> {
  return manager.sendMessage(targetJid, content);
}

export async function sendMessage(recipientId: string, content: string): Promise<void> {
  // TODO: Implement actual message sending using Baileys
  // This is a placeholder that will be implemented when we have the Baileys client setup
  console.log(`[MOCK] Sending message to ${recipientId}: ${content}`);
} 