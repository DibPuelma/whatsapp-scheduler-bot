import { WAMessage } from '@whiskeysockets/baileys';
import { handleScheduleCommand } from './scheduleCommandHandler';
import { sendResponseToUser } from '@/utils/whatsappSender';
import { formatMessage } from '@/utils/messageFormatter';
import { isValidMessageContent } from './validation';
import { parseScheduleCommand } from './commandParser';
import { resolveRecipient } from './recipientResolver';
import { parseDateTimeToUTC } from './dateTimeParser';
import { createScheduledMessage } from './schedulerService';

// Mock dependencies
jest.mock('@/utils/whatsappSender');
jest.mock('@/utils/messageFormatter');
jest.mock('./validation');
jest.mock('./commandParser');
jest.mock('./recipientResolver');
jest.mock('./dateTimeParser');
jest.mock('./schedulerService');

const mockedSendResponse = sendResponseToUser as jest.MockedFunction<typeof sendResponseToUser>;
const mockedFormatMessage = formatMessage as jest.MockedFunction<typeof formatMessage>;
const mockedIsValidMessageContent = isValidMessageContent as jest.MockedFunction<typeof isValidMessageContent>;
const mockedParseScheduleCommand = parseScheduleCommand as jest.MockedFunction<typeof parseScheduleCommand>;
const mockedResolveRecipient = resolveRecipient as jest.MockedFunction<typeof resolveRecipient>;
const mockedParseDateTimeToUTC = parseDateTimeToUTC as jest.MockedFunction<typeof parseDateTimeToUTC>;
const mockedCreateScheduledMessage = createScheduledMessage as jest.MockedFunction<typeof createScheduledMessage>;

describe('Schedule Command Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFormatMessage.mockImplementation((type) => `Mocked message for ${type}`);
    mockedIsValidMessageContent.mockReturnValue(true); // Default to valid
  });

  // Create a message with a fixed timestamp for consistent timezone handling
  const createMessage = (text: string): WAMessage => ({
    key: {
      remoteJid: '1234567890@s.whatsapp.net',
      fromMe: false,
      id: 'test-message-id'
    },
    message: {
      conversation: text
    },
    // Fixed timestamp: 2024-03-15 10:00:00 UTC
    messageTimestamp: Math.floor(new Date('2024-03-15T10:00:00Z').getTime() / 1000)
  });

  describe('Command Validation', () => {
    it('should handle a correct schedule command with phone number', async () => {
      const message = createMessage('/schedule +1234567890 $2024-12-25 10:30$ $Test message$');
      
      // Mock successful command parsing
      mockedParseScheduleCommand.mockReturnValue({
        success: true,
        data: {
          recipient: '+1234567890',
          dateTimeString: '2024-12-25 10:30',
          messageContent: 'Test message'
        }
      });

      // Mock successful recipient resolution
      mockedResolveRecipient.mockReturnValue({
        success: true,
        data: {
          phoneNumber: '+1234567890',
          originalInput: '+1234567890'
        }
      });

      // Mock successful date/time parsing
      mockedParseDateTimeToUTC.mockReturnValue({
        success: true,
        data: {
          utcTimestamp: new Date('2024-12-25T13:30:00Z'),
          originalString: '2024-12-25 10:30',
          userTimeZoneOffset: -180
        }
      });

      // Mock valid message content
      mockedIsValidMessageContent.mockReturnValue(true);

      // Mock successful message creation
      mockedCreateScheduledMessage.mockResolvedValue({
        success: true,
        data: {
          jobId: 'test-job-1',
          userId: '+9876543210',
          recipientIdentifier: '+1234567890',
          originalRecipientString: '+1234567890',
          messageContent: 'Test message',
          scheduledTimestampUTC: new Date('2024-12-25T13:30:00Z'),
          originalUserDateTimeString: '2024-12-25 10:30',
          userTimeZoneOffset: -180,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      expect(mockedFormatMessage).toHaveBeenCalledWith('SUCCESS_SCHEDULE', {
        dateTime: expect.any(String)
      });
      expect(mockedSendResponse).toHaveBeenCalledWith(
        '+9876543210',
        expect.any(String)
      );
    });

    it('should handle missing recipient', async () => {
      const message = createMessage('/schedule $2024-12-25 10:30$ $Test message$');
      
      // Mock command parsing error
      mockedParseScheduleCommand.mockReturnValue({
        success: false,
        error: {
          type: 'MISSING_RECIPIENT',
          message: 'Falta el destinatario'
        }
      });

      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      expect(mockedFormatMessage).toHaveBeenCalledWith('ERROR_MISSING_RECIPIENT');
      expect(mockedSendResponse).toHaveBeenCalledWith(
        '+9876543210',
        expect.any(String)
      );
    });

    it('should handle invalid phone number', async () => {
      const message = createMessage('/schedule 1234567890 $2024-12-25 10:30$ $Test message$');
      
      // Mock successful command parsing
      mockedParseScheduleCommand.mockReturnValue({
        success: true,
        data: {
          recipient: '1234567890',
          dateTimeString: '2024-12-25 10:30',
          messageContent: 'Test message'
        }
      });

      // Mock recipient resolution error
      mockedResolveRecipient.mockReturnValue({
        success: false,
        error: {
          type: 'INVALID_PHONE',
          message: 'Invalid phone number format'
        }
      });

      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      expect(mockedFormatMessage).toHaveBeenCalledWith('ERROR_INVALID_PHONE', {
        recipientPhone: '1234567890'
      });
      expect(mockedSendResponse).toHaveBeenCalledWith(
        '+9876543210',
        expect.any(String)
      );
    });

    it('should handle past dates', async () => {
      const message = createMessage('/schedule +1234567890 $2023-12-25 10:30$ $Test message$');
      
      // Mock successful command parsing
      mockedParseScheduleCommand.mockReturnValue({
        success: true,
        data: {
          recipient: '+1234567890',
          dateTimeString: '2023-12-25 10:30',
          messageContent: 'Test message'
        }
      });

      // Mock successful recipient resolution
      mockedResolveRecipient.mockReturnValue({
        success: true,
        data: {
          phoneNumber: '+1234567890',
          originalInput: '+1234567890'
        }
      });

      // Mock date/time parsing error for past date
      mockedParseDateTimeToUTC.mockReturnValue({
        success: false,
        error: {
          type: 'PAST_DATE',
          message: 'La fecha y hora especificadas están en el pasado'
        }
      });

      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      expect(mockedFormatMessage).toHaveBeenCalledWith('ERROR_PAST_DATETIME');
      expect(mockedSendResponse).toHaveBeenCalledWith(
        '+9876543210',
        expect.any(String)
      );
    });

    it('should handle invalid date/time format', async () => {
      const message = createMessage('/schedule +1234567890 $invalid date$ $Test message$');
      
      // Mock successful command parsing
      mockedParseScheduleCommand.mockReturnValue({
        success: true,
        data: {
          recipient: '+1234567890',
          dateTimeString: 'invalid date',
          messageContent: 'Test message'
        }
      });

      // Mock successful recipient resolution
      mockedResolveRecipient.mockReturnValue({
        success: true,
        data: {
          phoneNumber: '+1234567890',
          originalInput: '+1234567890'
        }
      });

      // Mock date/time parsing error for invalid format
      mockedParseDateTimeToUTC.mockReturnValue({
        success: false,
        error: {
          type: 'INVALID_FORMAT',
          message: 'Formato de fecha/hora inválido'
        }
      });

      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      expect(mockedFormatMessage).toHaveBeenCalledWith('ERROR_INVALID_DATETIME');
      expect(mockedSendResponse).toHaveBeenCalledWith(
        '+9876543210',
        expect.any(String)
      );
    });

    it('should handle missing message content', async () => {
      const message = createMessage('/schedule +1234567890 $2024-12-25 10:30$ $$');
      
      // Mock command parsing error
      mockedParseScheduleCommand.mockReturnValue({
        success: false,
        error: {
          type: 'MISSING_MESSAGE',
          message: 'Falta el mensaje'
        }
      });

      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      expect(mockedFormatMessage).toHaveBeenCalledWith('ERROR_MISSING_MESSAGE');
      expect(mockedSendResponse).toHaveBeenCalledWith(
        '+9876543210',
        expect.any(String)
      );
    });

    it('should handle invalid message content', async () => {
      const message = createMessage('/schedule +1234567890 $2024-12-25 10:30$ $   $');
      
      // Mock successful command parsing
      mockedParseScheduleCommand.mockReturnValue({
        success: true,
        data: {
          recipient: '+1234567890',
          dateTimeString: '2024-12-25 10:30',
          messageContent: '   '
        }
      });

      // Mock successful recipient resolution
      mockedResolveRecipient.mockReturnValue({
        success: true,
        data: {
          phoneNumber: '+1234567890',
          originalInput: '+1234567890'
        }
      });

      // Mock successful date/time parsing
      mockedParseDateTimeToUTC.mockReturnValue({
        success: true,
        data: {
          utcTimestamp: new Date('2024-12-25T13:30:00Z'),
          originalString: '2024-12-25 10:30',
          userTimeZoneOffset: -180
        }
      });

      // Mock invalid message content
      mockedIsValidMessageContent.mockReturnValue(false);

      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      expect(mockedFormatMessage).toHaveBeenCalledWith('ERROR_INVALID_MESSAGE', {
        messageContent: '   '
      });
      expect(mockedSendResponse).toHaveBeenCalledWith(
        '+9876543210',
        expect.any(String)
      );
    });

    it('should handle limit reached error when user has reached maximum pending messages', async () => {
      const message = createMessage('/schedule +1234567890 $2024-12-25 10:30$ $Test message$');
      
      // Mock successful command parsing
      mockedParseScheduleCommand.mockReturnValue({
        success: true,
        data: {
          recipient: '+1234567890',
          dateTimeString: '2024-12-25 10:30',
          messageContent: 'Test message'
        }
      });

      // Mock successful recipient resolution
      mockedResolveRecipient.mockReturnValue({
        success: true,
        data: {
          phoneNumber: '+1234567890',
          originalInput: '+1234567890'
        }
      });

      // Mock successful date/time parsing
      mockedParseDateTimeToUTC.mockReturnValue({
        success: true,
        data: {
          utcTimestamp: new Date('2024-12-25T13:30:00Z'),
          originalString: '2024-12-25 10:30',
          userTimeZoneOffset: -180
        }
      });

      // Mock valid message content
      mockedIsValidMessageContent.mockReturnValue(true);

      // Mock limit reached error from createScheduledMessage (10 pending messages)
      mockedCreateScheduledMessage.mockResolvedValue({
        success: false,
        error: {
          type: 'LIMIT_REACHED',
          message: 'Has alcanzado el límite de 10 mensajes pendientes.',
          currentCount: 10,
          maxAllowed: 10
        }
      });

      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      // Verify createScheduledMessage was called with correct parameters
      expect(mockedCreateScheduledMessage).toHaveBeenCalledWith({
        userId: '+9876543210',
        recipient: {
          phoneNumber: '+1234567890',
          originalInput: '+1234567890'
        },
        dateTime: {
          utcTimestamp: expect.any(Date),
          originalString: '2024-12-25 10:30',
          userTimeZoneOffset: -180
        },
        messageContent: 'Test message'
      });

      // Verify error message was formatted and sent
      expect(mockedFormatMessage).toHaveBeenCalledWith('ERROR_LIMIT_REACHED', {
        limit: 10
      });
      expect(mockedSendResponse).toHaveBeenCalledWith(
        '+9876543210',
        expect.any(String)
      );
    });

    it('should handle unexpected errors', async () => {
      // Mock an unexpected error
      mockedFormatMessage.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const message = createMessage('/schedule +1234567890 $2024-12-25 10:30$ $Test message$');
      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      expect(mockedFormatMessage).toHaveBeenCalledWith('ERROR_INTERNAL', {
        error: 'Unexpected error'
      });
      expect(mockedSendResponse).toHaveBeenCalledWith(
        '+9876543210',
        expect.any(String)
      );
    });
  });
}); 