import { sendWhatsAppMessage, sendResponseToUser } from './whatsappSender';
import { WhatsAppManager } from '@/lib/whatsapp';

// Mock the WhatsApp module
jest.mock('@/lib/whatsapp', () => ({
  WhatsAppManager: {
    getInstance: jest.fn().mockReturnValue({
      sendMessage: jest.fn()
    })
  }
}));

const mockSendMessage = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  
  // Setup the mock to return the sendMessage function
  (WhatsAppManager.getInstance as jest.Mock).mockReturnValue({
    sendMessage: mockSendMessage
  });
});

describe('sendWhatsAppMessage', () => {
  it('should send a message successfully', async () => {
    const targetJid = '+1234567890@s.whatsapp.net';
    const content = 'Mock test content';
    
    mockSendMessage.mockResolvedValue(true);
    
    await sendWhatsAppMessage('+1234567890', content);
    
    expect(mockSendMessage).toHaveBeenCalledWith(
      targetJid,
      { text: content }
    );
  });

  it('should handle send failures', async () => {
    const error = new Error('Send failed');
    mockSendMessage.mockRejectedValue(error);
    
    await expect(
      sendWhatsAppMessage('+1234567890', 'Mock test content')
    ).rejects.toThrow('Send failed');
  });
});

describe('sendResponseToUser', () => {
  it('should send a response message successfully', async () => {
    const targetJid = '+1234567890@s.whatsapp.net';
    const content = 'Mock response content';
    
    mockSendMessage.mockResolvedValue(true);
    
    await sendResponseToUser('+1234567890', content);
    
    expect(mockSendMessage).toHaveBeenCalledWith(
      targetJid,
      { text: content }
    );
  });

  it('should handle send failures with error logging', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Send failed');
    mockSendMessage.mockRejectedValue(error);
    
    await expect(
      sendResponseToUser('+1234567890', 'Mock response content')
    ).rejects.toThrow('Send failed');
    
    consoleSpy.mockRestore();
  });

  it('should send a response message successfully to recipient', async () => {
    const targetJid = '+1234567890@s.whatsapp.net';
    const content = 'Mock response content';
    
    mockSendMessage.mockResolvedValue(true);
    
    await sendResponseToUser('+1234567890', content);
    
    expect(mockSendMessage).toHaveBeenCalledWith(
      targetJid,
      { text: content }
    );
  });
}); 