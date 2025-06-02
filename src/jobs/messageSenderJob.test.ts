import { processScheduledMessages } from './messageSenderJob';
import { getDueMessages, updateMessageStatus, ScheduledMessage } from '../lib/scheduler/schedulerService';
import { logger } from '@/lib/logger';
import { sendWhatsAppMessage } from '@/utils/whatsappSender';

// Mock dependencies
jest.mock('../lib/scheduler/schedulerService');
jest.mock('@/utils/whatsappSender');
jest.mock('@/lib/logger');

const mockedGetDueMessages = getDueMessages as jest.MockedFunction<typeof getDueMessages>;
const mockedUpdateMessageStatus = updateMessageStatus as jest.MockedFunction<typeof updateMessageStatus>;
const mockedSendWhatsAppMessage = sendWhatsAppMessage as jest.MockedFunction<typeof sendWhatsAppMessage>;
const mockedLogger = logger as jest.Mocked<typeof logger>;

describe('processScheduledMessages', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should handle no due messages', async () => {
    mockedGetDueMessages.mockResolvedValue([]);

    await processScheduledMessages();

    expect(mockedGetDueMessages).toHaveBeenCalled();
    expect(mockedSendWhatsAppMessage).not.toHaveBeenCalled();
    expect(mockedUpdateMessageStatus).not.toHaveBeenCalled();
    expect(mockedLogger.info).toHaveBeenCalledWith('No messages due for sending');
  });

  it('should process due messages successfully', async () => {
    const mockMessages = [
      {
        jobId: 'mock-job-1',
        userId: 'mock-user-1',
        recipientIdentifier: '+1111111111',
        originalRecipientString: '+1111111111',
        messageContent: 'Mock scheduled content 1',
        scheduledTimestampUTC: new Date(),
        originalUserDateTimeString: '12:30',
        userTimeZoneOffset: -240,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        jobId: 'mock-job-2',
        userId: 'mock-user-2',
        recipientIdentifier: '+2222222222',
        originalRecipientString: '+2222222222',
        messageContent: 'Mock scheduled content 2',
        scheduledTimestampUTC: new Date(),
        originalUserDateTimeString: '12:30',
        userTimeZoneOffset: -240,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ] as ScheduledMessage[];

    mockedGetDueMessages.mockResolvedValue(mockMessages);
    mockedSendWhatsAppMessage.mockResolvedValue(undefined);
    mockedUpdateMessageStatus.mockResolvedValue({} as ScheduledMessage);

    await processScheduledMessages();

    expect(mockedGetDueMessages).toHaveBeenCalled();
    expect(mockedSendWhatsAppMessage).toHaveBeenCalledTimes(2);
    expect(mockedUpdateMessageStatus).toHaveBeenCalledTimes(2);
    expect(mockedUpdateMessageStatus).toHaveBeenCalledWith('mock-job-1', 'SENT');
    expect(mockedUpdateMessageStatus).toHaveBeenCalledWith('mock-job-2', 'SENT');
  });

  it('should handle message sending failures', async () => {
    const mockMessages = [
      {
        jobId: 'mock-job-1',
        userId: 'mock-user-1',
        recipientIdentifier: '+1111111111',
        originalRecipientString: '+1111111111',
        messageContent: 'Mock scheduled content 1',
        scheduledTimestampUTC: new Date(),
        originalUserDateTimeString: '12:30',
        userTimeZoneOffset: -240,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ] as ScheduledMessage[];

    mockedGetDueMessages.mockResolvedValue(mockMessages);
    mockedSendWhatsAppMessage.mockRejectedValue(new Error('Failed to send'));
    mockedUpdateMessageStatus.mockResolvedValue({} as ScheduledMessage);

    await processScheduledMessages();

    expect(mockedGetDueMessages).toHaveBeenCalled();
    expect(mockedSendWhatsAppMessage).toHaveBeenCalledTimes(1);
    expect(mockedUpdateMessageStatus).toHaveBeenCalledWith('mock-job-1', 'FAILED_TO_SEND');
    expect(mockedLogger.error).toHaveBeenCalledWith(
      'Failed to send message mock-job-1:',
      expect.any(Error)
    );
  });

  it('should handle getDueMessages failure', async () => {
    const error = new Error('Database error');
    mockedGetDueMessages.mockRejectedValue(error);

    await expect(processScheduledMessages()).rejects.toThrow('Database error');
    expect(mockedLogger.error).toHaveBeenCalledWith(
      'Error processing scheduled messages:',
      error
    );
  });
}); 