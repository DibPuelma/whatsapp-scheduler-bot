import { WhatsAppManager } from '@/lib/whatsapp';
import { logger } from '@/lib/logger';
import { sendWhatsAppMessage, sendResponseToUser, formatToJID } from './whatsappSender';
import type { Response } from 'node-fetch';

// Extend global to include fetch
declare global {
  function fetch(url: string, init?: RequestInit): Promise<Response>;
}

// Mock the external dependencies
jest.mock('@/lib/whatsapp');
jest.mock('@/lib/logger');
jest.mock('node-fetch');

describe('WhatsApp Sender Utility', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PORT = '3000'; // Default to dev server context
    process.argv = ['node', 'server.js']; // Ensure we're not in bot context
  });

  describe('formatToJID', () => {
    it('correctly formats international phone numbers to JID', () => {
      const phoneNumber = '+56912345678';
      const result = formatToJID(phoneNumber);
      expect(result).toBe('56912345678@s.whatsapp.net');
    });
  });

  describe('sendWhatsAppMessage', () => {
    const mockPhone = '+56912345678';
    const mockContent = 'Test message';
    const mockJID = '56912345678@s.whatsapp.net';

    describe('in dev server context', () => {
      beforeEach(() => {
        process.env.PORT = '3000';
        // Mock WhatsApp instance
        const mockWhatsApp = {
          getConnectionState: jest.fn().mockReturnValue({ isConnected: true }),
          sendMessage: jest.fn().mockResolvedValue(true)
        };
        (WhatsAppManager.getInstance as jest.Mock).mockReturnValue(mockWhatsApp);
      });

      it('sends message successfully via WhatsApp instance', async () => {
        await sendWhatsAppMessage(mockPhone, mockContent);
        
        const whatsapp = WhatsAppManager.getInstance();
        expect(whatsapp.sendMessage).toHaveBeenCalledWith(mockJID, mockContent);
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Successfully sent'));
      });

      it('throws error when WhatsApp is not connected', async () => {
        const mockWhatsApp = {
          getConnectionState: jest.fn().mockReturnValue({ isConnected: false }),
          sendMessage: jest.fn()
        };
        (WhatsAppManager.getInstance as jest.Mock).mockReturnValue(mockWhatsApp);

        await expect(sendWhatsAppMessage(mockPhone, mockContent))
          .rejects
          .toThrow('WhatsApp is not connected');
      });
    });

    describe('in bot context', () => {
      beforeEach(() => {
        process.env.PORT = '3001';
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue([{ result: { data: { json: { success: true } } } }])
        });
      });

      it('sends message successfully via API', async () => {
        await sendWhatsAppMessage(mockPhone, mockContent);
        
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/trpc/whatsapp.sendMessage'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining(mockJID)
          })
        );
      });

      it('retries on API failure', async () => {
        // Fail first attempt, succeed on second
        global.fetch = jest.fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue([{ result: { data: { json: { success: true } } } }])
          });

        await sendWhatsAppMessage(mockPhone, mockContent);
        
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      it('throws after max retries', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

        await expect(sendWhatsAppMessage(mockPhone, mockContent))
          .rejects
          .toThrow('Failed to send WhatsApp message');
      });
    });
  });

  describe('sendResponseToUser', () => {
    const mockPhone = '+56912345678';
    const mockContent = 'Test response';

    it('sends response successfully', async () => {
      const mockWhatsApp = {
        getConnectionState: jest.fn().mockReturnValue({ isConnected: true }),
        sendMessage: jest.fn().mockResolvedValue(true)
      };
      (WhatsAppManager.getInstance as jest.Mock).mockReturnValue(mockWhatsApp);

      await sendResponseToUser(mockPhone, mockContent);
      
      const whatsapp = WhatsAppManager.getInstance();
      expect(whatsapp.sendMessage).toHaveBeenCalled();
    });

    it('logs error but does not throw on failure', async () => {
      const mockWhatsApp = {
        getConnectionState: jest.fn().mockReturnValue({ isConnected: false }),
        sendMessage: jest.fn()
      };
      (WhatsAppManager.getInstance as jest.Mock).mockReturnValue(mockWhatsApp);

      await sendResponseToUser(mockPhone, mockContent);
      
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
