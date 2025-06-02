import * as baileys from '@whiskeysockets/baileys';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { Boom } from '@hapi/boom';
import { EventEmitter } from 'events';

const { makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys;

// Path for auth files
const AUTH_FOLDER_PATH = join(process.cwd(), '.auth');

// Event emitters
const qrEventEmitter = new EventEmitter();
const connectionEventEmitter = new EventEmitter();

interface QRCodeData {
  qr: string;
  connectionId: string;
}

interface ConnectionStatus {
  status: 'open' | 'close' | 'connecting';
  phoneNumber?: string;
  error?: string;
}

class WhatsAppService {
  private static instance: WhatsAppService;
  private qrCode: QRCodeData | null = null;
  private sock: baileys.WASocket | null = null;
  private connectionStatus: ConnectionStatus = { status: 'connecting' };

  private constructor() {}

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  public async initialize() {
    try {
      // Create auth folder if it doesn't exist
      await mkdir(AUTH_FOLDER_PATH, { recursive: true });

      // Load auth state
      const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER_PATH);

      // Create socket connection
      this.sock = makeWASocket({
        printQRInTerminal: false, // Disable QR in terminal since we'll handle it ourselves
        auth: state,
        browser: ['Chrome (Linux)', '', ''],
      });

      // Handle connection updates
      this.sock.ev.on('connection.update', (update: Partial<baileys.ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
          // Generate a unique connection ID
          const connectionId = Math.random().toString(36).substring(7);
          
          // Store and emit the new QR code
          this.qrCode = { qr, connectionId };
          qrEventEmitter.emit('qr', this.qrCode);
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
          
          // Update and emit connection status
          this.connectionStatus = {
            status: 'close',
            error: lastDisconnect?.error?.message || 'Connection closed',
          };
          connectionEventEmitter.emit('status', this.connectionStatus);
          
          // Reconnect if not logged out
          if (shouldReconnect) {
            this.initialize();
          }
        }

        if (connection === 'connecting') {
          this.connectionStatus = { status: 'connecting' };
          connectionEventEmitter.emit('status', this.connectionStatus);
        }

        if (connection === 'open') {
          console.log('WhatsApp connection established');
          
          // Get connected user's phone number
          const phoneNumber = this.sock?.user?.id?.split(':')[0];
          
          // Update and emit connection status
          this.connectionStatus = {
            status: 'open',
            phoneNumber: phoneNumber ? `+${phoneNumber}` : undefined,
          };
          connectionEventEmitter.emit('status', this.connectionStatus);
          
          // Clear QR code when connected
          this.qrCode = null;
        }
      });

      // Handle credentials update
      this.sock.ev.on('creds.update', saveCreds);

      return this.sock;
    } catch (err) {
      console.error('Error in WhatsApp service initialization:', err);
      throw err;
    }
  }

  public async getQRCode(): Promise<QRCodeData | null> {
    // If there's no active QR code and no active connection, initialize a new connection
    if (!this.qrCode && !this.sock) {
      await this.initialize();
    }
    return this.qrCode;
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  public onQRCodeUpdate(callback: (qrData: QRCodeData) => void) {
    qrEventEmitter.on('qr', callback);
  }

  public onConnectionUpdate(callback: (status: ConnectionStatus) => void) {
    connectionEventEmitter.on('status', callback);
  }

  public removeQRCodeListener(callback: (qrData: QRCodeData) => void) {
    qrEventEmitter.off('qr', callback);
  }

  public removeConnectionListener(callback: (status: ConnectionStatus) => void) {
    connectionEventEmitter.off('status', callback);
  }
}

export const whatsAppService = WhatsAppService.getInstance(); 