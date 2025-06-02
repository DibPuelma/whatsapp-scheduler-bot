import { WAMessage } from '@whiskeysockets/baileys';
import { handleScheduleCommand } from './scheduleCommandHandler';
import { sendResponseToUser } from '@/utils/whatsappSender';
import { formatMessage } from '@/utils/messageFormatter';
import { isValidMessageContent } from './validation';

// Mock dependencies
jest.mock('@/utils/whatsappSender');
jest.mock('@/utils/messageFormatter');
jest.mock('./validation');

const mockedSendResponse = sendResponseToUser as jest.MockedFunction<typeof sendResponseToUser>;
const mockedFormatMessage = formatMessage as jest.MockedFunction<typeof formatMessage>;
const mockedIsValidMessageContent = isValidMessageContent as jest.MockedFunction<typeof isValidMessageContent>;

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
      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      expect(mockedFormatMessage).toHaveBeenCalledWith('ERROR_MISSING_RECIPIENT');
      expect(mockedSendResponse).toHaveBeenCalledWith(
        '+9876543210',
        expect.any(String)
      );
    });

    it('should handle invalid phone number', async () => {
      const message = createMessage('/schedule 1234567890 $2024-12-25 10:30$ $Test message$');
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
      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      expect(mockedFormatMessage).toHaveBeenCalledWith('ERROR_PAST_DATETIME');
      expect(mockedSendResponse).toHaveBeenCalledWith(
        '+9876543210',
        expect.any(String)
      );
    });

    it('should handle invalid date/time format', async () => {
      const message = createMessage('/schedule +1234567890 $invalid date$ $Test message$');
      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      expect(mockedFormatMessage).toHaveBeenCalledWith('ERROR_INVALID_DATETIME');
      expect(mockedSendResponse).toHaveBeenCalledWith(
        '+9876543210',
        expect.any(String)
      );
    });

    it('should handle missing message content', async () => {
      const message = createMessage('/schedule +1234567890 $2024-12-25 10:30$ $$');
      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      expect(mockedFormatMessage).toHaveBeenCalledWith('ERROR_MISSING_MESSAGE');
      expect(mockedSendResponse).toHaveBeenCalledWith(
        '+9876543210',
        expect.any(String)
      );
    });

    it('should handle invalid message content', async () => {
      // Mock isValidMessageContent to return false
      mockedIsValidMessageContent.mockReturnValue(false);

      const message = createMessage('/schedule +1234567890 $2024-12-25 10:30$ $   $');
      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      expect(mockedFormatMessage).toHaveBeenCalledWith('ERROR_INVALID_MESSAGE', {
        messageContent: '   '
      });
      expect(mockedSendResponse).toHaveBeenCalledWith(
        '+9876543210',
        expect.any(String)
      );
    });

    it('should handle limit reached error', async () => {
      const message = createMessage('/schedule +1234567890 $2024-12-25 10:30$ $Test message$');
      await handleScheduleCommand({ message, senderPhone: '+9876543210' });
      
      expect(mockedFormatMessage).toHaveBeenCalledWith('ERROR_LIMIT_REACHED', {
        limit: expect.any(Number)
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