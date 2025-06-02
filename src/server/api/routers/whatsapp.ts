import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
import { getWhatsAppQRCode, getConnectionState, resetConnection, sendWhatsAppMessage } from '@/lib/whatsapp';

export const whatsappRouter = createTRPCRouter({
  getQRCode: publicProcedure
    .query(async () => {
      try {
        const qrCode = await getWhatsAppQRCode();
        return { 
          success: true,
          qrCode,
          isConnected: false,
          message: 'QR code generated successfully'
        };
      } catch (error) {
        console.error('Error getting QR code:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to get WhatsApp QR code';
        
        // Check if the error is because WhatsApp is already connected
        if (errorMessage.includes('already connected')) {
          return {
            success: true,
            qrCode: null,
            isConnected: true,
            message: 'WhatsApp is already connected'
          };
        }
        
        return {
          success: false,
          error: errorMessage,
          qrCode: null,
          isConnected: false
        };
      }
    }),

  getConnectionStatus: publicProcedure
    .query(async () => {
      try {
        const status = getConnectionState();
        return {
          success: true,
          ...status
        };
      } catch (error) {
        console.error('Error getting connection status:', error);
        return {
          success: false,
          error: 'Failed to get connection status',
          isConnecting: false,
          isConnected: false,
          hasQRCode: false,
          lastError: null
        };
      }
    }),

  resetConnection: publicProcedure
    .mutation(async () => {
      try {
        await resetConnection();
        return {
          success: true,
          message: 'Connection reset successfully'
        };
      } catch (error) {
        console.error('Error resetting connection:', error);
        return {
          success: false,
          error: 'Failed to reset connection'
        };
      }
    }),

  sendMessage: publicProcedure
    .input(
      z.object({
        targetJid: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await sendWhatsAppMessage(input.targetJid, input.content);
        return {
          success: true,
          message: 'Message sent successfully'
        };
      } catch (error) {
        console.error('Error sending message:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send message'
        };
      }
    }),

  connectionWebhook: publicProcedure
    .input(
      z.object({
        status: z.enum(['open', 'close', 'connecting']),
        phoneNumber: z.string().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log('Received connection webhook:', input);
        return {
          success: true,
          message: `Connection status updated to ${input.status}`,
        };
      } catch (error) {
        console.error('Error processing webhook:', error);
        return {
          success: false,
          error: 'Failed to process connection webhook.',
        };
      }
    }),
}); 