import { processScheduledMessages } from './messageSenderJob';
import { getDueMessages, updateMessageStatus, ScheduledMessage } from '../lib/scheduler/schedulerService';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('../lib/scheduler/schedulerService');
jest.mock('@/lib/logger');

const mockedGetDueMessages = getDueMessages as jest.MockedFunction<typeof getDueMessages>;
const mockedUpdateMessageStatus = updateMessageStatus as jest.MockedFunction<typeof updateMessageStatus>;
const mockedLogger = logger as jest.Mocked<typeof logger>;

// Mock fetch for sendMessageViaBotAPI
const mockedFetch = jest.fn();
global.fetch = mockedFetch;

describe('processScheduledMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLogger.info = jest.fn();
    mockedLogger.error = jest.fn();
  });

  it('should handle no due messages', async () => {
    mockedGetDueMessages.mockResolvedValue([]);

    await processScheduledMessages();

    expect(mockedGetDueMessages).toHaveBeenCalled();
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
    mockedUpdateMessageStatus.mockResolvedValue({} as ScheduledMessage);
    mockedFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    await processScheduledMessages();

    expect(mockedGetDueMessages).toHaveBeenCalled();
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedFetch).toHaveBeenCalledWith('http://localhost:3001/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientPhone: '+1111111111',
        content: 'Mock scheduled content 1'
      })
    });
    expect(mockedFetch).toHaveBeenCalledWith('http://localhost:3001/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientPhone: '+2222222222',
        content: 'Mock scheduled content 2'
      })
    });
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
    mockedUpdateMessageStatus.mockResolvedValue({} as ScheduledMessage);
    mockedFetch.mockRejectedValue(new Error('Failed to send'));

    await processScheduledMessages();

    expect(mockedGetDueMessages).toHaveBeenCalled();
    expect(mockedFetch).toHaveBeenCalledTimes(1);
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