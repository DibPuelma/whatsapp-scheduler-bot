import { WAMessage } from '@whiskeysockets/baileys';
import { handleViewMessages } from '../viewMessages';
import { prisma } from '../../../prisma';
import { isWhitelisted } from '../../../../config/whitelist';
import { getScheduledMessages } from '../../../queries/messages';
import { PrismaClient } from '@prisma/client';
import { PrismaClientInitializationError, PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  INVALID_VIEW_REQUEST,
  UNAUTHORIZED_NUMBER,
  DATABASE_CONNECTION_ERROR,
  DATABASE_QUERY_ERROR,
  ERROR_FETCHING_MESSAGES,
  NO_MESSAGES,
  NO_MORE_MESSAGES,
  SHOWING_MESSAGES_HEADER,
  SHOWING_MORE_MESSAGES_HEADER,
  TOTAL_MESSAGES_SUMMARY,
  MORE_MESSAGES_AVAILABLE,
} from '../../../../constants/messages';

// Mock dependencies
jest.mock('../../../prisma', () => ({
  prisma: {
    messageViewStats: {
      upsert: jest.fn(),
    },
  } as unknown as { messageViewStats: { upsert: jest.Mock } },
}));

jest.mock('../../../../config/whitelist', () => ({
  isWhitelisted: jest.fn(),
}));

jest.mock('../../../queries/messages', () => ({
  getScheduledMessages: jest.fn(),
}));

describe('viewMessages handler', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (isWhitelisted as jest.Mock).mockReturnValue(true);
    (prisma.messageViewStats.upsert as jest.Mock).mockResolvedValue({});
    (getScheduledMessages as jest.Mock).mockResolvedValue({
      messages: [],
      total: 0,
      hasMore: false,
    });
  });

  // Helper function to create a mock WAMessage
  const createMockMessage = (text: string): WAMessage => ({
    message: {
      conversation: text,
    },
    key: {},
  } as WAMessage);

  describe('phone number validation', () => {
    test('should reject invalid phone numbers', async () => {
      const invalidPhones = ['123', 'abc', '+abc', '++123'];

      for (const phone of invalidPhones) {
        const result = await handleViewMessages({
          message: createMockMessage('ver mensajes'),
          senderPhone: phone,
        });

        expect(result).toEqual({
          type: 'ERROR',
          error: INVALID_VIEW_REQUEST,
        });
      }
    });

    test('should normalize phone numbers by adding + prefix', async () => {
      await handleViewMessages({
        message: createMockMessage('ver mensajes'),
        senderPhone: '123456789',
      });

      expect(isWhitelisted).toHaveBeenCalledWith('+123456789');
    });
  });

  describe('whitelist validation', () => {
    test('should reject non-whitelisted numbers', async () => {
      (isWhitelisted as jest.Mock).mockReturnValue(false);

      const result = await handleViewMessages({
        message: createMockMessage('ver mensajes'),
        senderPhone: '+123456789',
      });

      expect(result).toEqual({
        type: 'ERROR',
        error: UNAUTHORIZED_NUMBER,
      });
    });
  });

  describe('message retrieval', () => {
    test('should handle no messages case', async () => {
      const result = await handleViewMessages({
        message: createMockMessage('ver mensajes'),
        senderPhone: '+123456789',
      });

      expect(result).toEqual({
        type: 'NO_MESSAGES',
      });
    });

    test('should format messages correctly', async () => {
      const mockMessages = [
        {
          scheduledAt: new Date('2024-03-28T15:00:00Z'),
          phone: '+987654321',
          content: 'Test message 1',
        },
        {
          scheduledAt: new Date('2024-03-29T16:00:00Z'),
          phone: '+987654322',
          content: 'Test message 2',
        },
      ];

      (getScheduledMessages as jest.Mock).mockResolvedValue({
        messages: mockMessages,
        total: 2,
        hasMore: false,
      });

      const result = await handleViewMessages({
        message: createMockMessage('ver mensajes'),
        senderPhone: '+123456789',
      });

      expect(result).toMatchObject({
        type: 'SHOW_MESSAGES',
        data: {
          messages: expect.arrayContaining([
            expect.objectContaining({
              recipient: '+987654321',
              content: 'Test message 1',
            }),
            expect.objectContaining({
              recipient: '+987654322',
              content: 'Test message 2',
            }),
          ]),
          hasMore: false,
        },
      });
    });

    test('should handle pagination correctly', async () => {
      (getScheduledMessages as jest.Mock).mockResolvedValue({
        messages: [{ scheduledAt: new Date(), phone: '+123', content: 'test' }],
        total: 15,
        hasMore: true,
      });

      const result = await handleViewMessages({
        message: createMockMessage('ver mensajes'),
        senderPhone: '+123456789',
        offset: 0,
      });

      expect(result).toMatchObject({
        type: 'SHOW_MESSAGES',
        data: {
          hasMore: true,
          footer: expect.stringContaining('14'), // remaining count
        },
      });
    });

    test('should handle "ver más" with no more messages', async () => {
      (getScheduledMessages as jest.Mock).mockResolvedValue({
        messages: [],
        total: 10,
        hasMore: false,
      });

      const result = await handleViewMessages({
        message: createMockMessage('ver más'),
        senderPhone: '+123456789',
        offset: 10,
      });

      expect(result).toEqual({
        type: 'NO_MORE_MESSAGES',
      });
    });
  });

  describe('error handling', () => {
    test('should handle database connection errors', async () => {
      (getScheduledMessages as jest.Mock).mockRejectedValue(
        new PrismaClientInitializationError('Connection failed', '')
      );

      const result = await handleViewMessages({
        message: createMockMessage('ver mensajes'),
        senderPhone: '+123456789',
      });

      expect(result).toEqual({
        type: 'ERROR',
        error: DATABASE_CONNECTION_ERROR,
      });
    });

    test('should handle database query errors', async () => {
      (getScheduledMessages as jest.Mock).mockRejectedValue(
        new PrismaClientKnownRequestError('Query failed', {
          code: 'P2002',
          clientVersion: '1.0.0',
        })
      );

      const result = await handleViewMessages({
        message: createMockMessage('ver mensajes'),
        senderPhone: '+123456789',
      });

      expect(result).toEqual({
        type: 'ERROR',
        error: DATABASE_QUERY_ERROR,
      });
    });

    test('should handle unexpected errors', async () => {
      (getScheduledMessages as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const result = await handleViewMessages({
        message: createMockMessage('ver mensajes'),
        senderPhone: '+123456789',
      });

      expect(result).toEqual({
        type: 'ERROR',
        error: ERROR_FETCHING_MESSAGES,
      });
    });
  });

  describe('view stats tracking', () => {
    test('should update view stats on successful message retrieval', async () => {
      await handleViewMessages({
        message: createMockMessage('ver mensajes'),
        senderPhone: '+123456789',
        offset: 0,
      });

      expect(prisma.messageViewStats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { senderPhone: '+123456789' },
          create: expect.objectContaining({
            senderPhone: '+123456789',
            totalViews: 1,
            lastOffset: 0,
          }),
          update: expect.objectContaining({
            totalViews: { increment: 1 },
            lastOffset: 0,
          }),
        })
      );
    });

    test('should not fail request if stats update fails', async () => {
      (prisma.messageViewStats.upsert as jest.Mock).mockRejectedValue(new Error('Stats update failed'));

      const result = await handleViewMessages({
        message: createMockMessage('ver mensajes'),
        senderPhone: '+123456789',
      });

      // Request should still succeed even if stats update fails
      expect(result).toEqual({
        type: 'NO_MESSAGES',
      });
    });
  });
}); 