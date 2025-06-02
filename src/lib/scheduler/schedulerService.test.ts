import { PrismaClient } from '@prisma/client';
import { 
  createScheduledMessage, 
  CreateScheduledMessageParams, 
  countPendingMessages,
  getDueMessages,
  updateMessageStatus,
  MAX_PENDING_MESSAGES,
  MAX_BATCH_SIZE,
  MessageStatus
} from './schedulerService';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockCreate = jest.fn();
  const mockCount = jest.fn();
  const mockFindMany = jest.fn();
  const mockUpdate = jest.fn();
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      scheduledMessage: {
        create: mockCreate,
        count: mockCount,
        findMany: mockFindMany,
        update: mockUpdate
      }
    }))
  };
});

describe('schedulerService', () => {
  let prisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
  });

  describe('createScheduledMessage', () => {
    const testParams: CreateScheduledMessageParams = {
      userId: 'mock-user-123',
      recipient: {
        phoneNumber: '+1111111111',
        originalInput: '+1111111111'
      },
      dateTime: {
        utcTimestamp: futureDate,
        originalString: 'mañana 10:00',
        userTimeZoneOffset: -180
      },
      messageContent: 'Mock scheduled content'
    };

    const mockCreatedMessage = {
      jobId: 'job123',
      userId: testParams.userId,
      recipientIdentifier: testParams.recipient.phoneNumber,
      originalRecipientString: testParams.recipient.originalInput,
      messageContent: testParams.messageContent,
      scheduledTimestampUTC: testParams.dateTime.utcTimestamp,
      originalUserDateTimeString: testParams.dateTime.originalString,
      userTimeZoneOffset: testParams.dateTime.userTimeZoneOffset,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a scheduled message when under the limit', async () => {
      // Setup mock implementation
      prisma.scheduledMessage.count.mockResolvedValue(5); // Under the limit
      prisma.scheduledMessage.create.mockResolvedValue(mockCreatedMessage);

      // Call the function
      const result = await createScheduledMessage(testParams);

      // Verify the count call
      expect(prisma.scheduledMessage.count).toHaveBeenCalledWith({
        where: {
          userId: testParams.userId,
          status: 'PENDING'
        }
      });

      // Verify the create call
      expect(prisma.scheduledMessage.create).toHaveBeenCalledWith({
        data: {
          userId: testParams.userId,
          recipientIdentifier: testParams.recipient.phoneNumber,
          originalRecipientString: testParams.recipient.originalInput,
          messageContent: testParams.messageContent,
          scheduledTimestampUTC: testParams.dateTime.utcTimestamp,
          originalUserDateTimeString: testParams.dateTime.originalString,
          userTimeZoneOffset: testParams.dateTime.userTimeZoneOffset,
          status: 'PENDING'
        }
      });

      // Verify the result
      expect(result).toEqual({
        success: true,
        data: mockCreatedMessage
      });
    });

    it('should return error when pending message limit is reached', async () => {
      // Setup mock implementation
      prisma.scheduledMessage.count.mockResolvedValue(MAX_PENDING_MESSAGES); // At the limit

      // Call the function
      const result = await createScheduledMessage(testParams);

      // Verify the count call
      expect(prisma.scheduledMessage.count).toHaveBeenCalledWith({
        where: {
          userId: testParams.userId,
          status: 'PENDING'
        }
      });

      // Verify no create call was made
      expect(prisma.scheduledMessage.create).not.toHaveBeenCalled();

      // Verify the result
      expect(result).toEqual({
        success: false,
        error: {
          type: 'LIMIT_REACHED',
          message: `Has alcanzado el límite de ${MAX_PENDING_MESSAGES} mensajes pendientes. Por favor, espera a que algunos mensajes sean enviados antes de programar más.`,
          currentCount: MAX_PENDING_MESSAGES,
          maxAllowed: MAX_PENDING_MESSAGES
        }
      });
    });

    it('should throw an error if database operation fails', async () => {
      const mockError = new Error('Database error');
      prisma.scheduledMessage.count.mockRejectedValue(mockError);

      await expect(createScheduledMessage(testParams)).rejects.toThrow('Database error');
    });
  });

  describe('countPendingMessages', () => {
    it('should return the number of pending messages for a user', async () => {
      const userId = 'user123@s.whatsapp.net';
      const expectedCount = 3;

      // Setup mock implementation
      prisma.scheduledMessage.count.mockResolvedValue(expectedCount);

      // Call the function
      const result = await countPendingMessages(userId);

      // Verify the count call
      expect(prisma.scheduledMessage.count).toHaveBeenCalledWith({
        where: {
          userId,
          status: 'PENDING'
        }
      });

      // Verify the result
      expect(result).toBe(expectedCount);
    });

    it('should throw an error if database operation fails', async () => {
      const userId = 'user123@s.whatsapp.net';
      const mockError = new Error('Database error');
      prisma.scheduledMessage.count.mockRejectedValue(mockError);

      await expect(countPendingMessages(userId)).rejects.toThrow('Database error');
    });
  });

  describe('getDueMessages', () => {
    const now = new Date();
    const mockDueMessages = [
      {
        jobId: 'job1',
        userId: 'user1@s.whatsapp.net',
        recipientIdentifier: '+1234567890',
        originalRecipientString: '+1234567890',
        messageContent: 'Test message 1',
        scheduledTimestampUTC: new Date(now.getTime() - 5000), // 5 seconds ago
        originalUserDateTimeString: '2024-03-15 10:00',
        userTimeZoneOffset: -180,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        jobId: 'job2',
        userId: 'user2@s.whatsapp.net',
        recipientIdentifier: '+0987654321',
        originalRecipientString: '+0987654321',
        messageContent: 'Test message 2',
        scheduledTimestampUTC: new Date(now.getTime() - 1000), // 1 second ago
        originalUserDateTimeString: '2024-03-15 10:01',
        userTimeZoneOffset: -180,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should return due messages ordered by timestamp', async () => {
      // Setup mock implementation
      prisma.scheduledMessage.findMany.mockResolvedValue(mockDueMessages);

      // Call the function
      const result = await getDueMessages();

      // Verify the findMany call
      expect(prisma.scheduledMessage.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          scheduledTimestampUTC: {
            lte: expect.any(Date)
          }
        },
        orderBy: {
          scheduledTimestampUTC: 'asc'
        },
        take: MAX_BATCH_SIZE
      });

      // Verify the result
      expect(result).toEqual(mockDueMessages);
    });

    it('should return empty array when no messages are due', async () => {
      // Setup mock implementation
      prisma.scheduledMessage.findMany.mockResolvedValue([]);

      // Call the function
      const result = await getDueMessages();

      // Verify the findMany call was made
      expect(prisma.scheduledMessage.findMany).toHaveBeenCalled();

      // Verify the result
      expect(result).toEqual([]);
    });

    it('should throw an error if database operation fails', async () => {
      const mockError = new Error('Database error');
      prisma.scheduledMessage.findMany.mockRejectedValue(mockError);

      await expect(getDueMessages()).rejects.toThrow('Database error');
    });
  });

  describe('updateMessageStatus', () => {
    const mockMessage = {
      jobId: 'job123',
      userId: 'user123@s.whatsapp.net',
      recipientIdentifier: '+1234567890',
      originalRecipientString: '+1234567890',
      messageContent: 'Test message',
      scheduledTimestampUTC: new Date('2024-12-25T10:30:00Z'),
      originalUserDateTimeString: '2024-12-25 10:30',
      userTimeZoneOffset: -180,
      status: 'PENDING' as MessageStatus,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should update message status successfully', async () => {
      const jobId = 'job123';
      const newStatus: MessageStatus = 'SENT';
      const updatedMessage = { ...mockMessage, status: newStatus };

      // Setup mock implementation
      prisma.scheduledMessage.update.mockResolvedValue(updatedMessage);

      // Call the function
      const result = await updateMessageStatus(jobId, newStatus);

      // Verify the update call
      expect(prisma.scheduledMessage.update).toHaveBeenCalledWith({
        where: { jobId },
        data: { status: newStatus }
      });

      // Verify the result
      expect(result).toEqual(updatedMessage);
    });

    it('should throw an error if message is not found', async () => {
      const jobId = 'nonexistent';
      const newStatus: MessageStatus = 'SENT';

      // Setup mock implementation
      prisma.scheduledMessage.update.mockResolvedValue(null);

      // Call the function and expect error
      await expect(updateMessageStatus(jobId, newStatus)).rejects.toThrow(
        `Message with jobId ${jobId} not found`
      );
    });

    it('should throw an error if database operation fails', async () => {
      const jobId = 'job123';
      const newStatus: MessageStatus = 'SENT';
      const mockError = new Error('Database error');

      // Setup mock implementation
      prisma.scheduledMessage.update.mockRejectedValue(mockError);

      // Call the function and expect error
      await expect(updateMessageStatus(jobId, newStatus)).rejects.toThrow('Database error');
    });
  });
}); 