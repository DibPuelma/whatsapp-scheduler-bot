import { 
  isValidPhoneNumber, 
  isValidContactName, 
  isValidMessageContent, 
  isValidDateTimeFormat 
} from './validation';

describe('Schedule Command Validation', () => {
  describe('isValidPhoneNumber', () => {
    const validPhoneNumbers = [
      '+1234567890',
      '+1-234-567-890',
      '+1 234 567 890',
      '+573001234567',
      '+44 20 7123 4567'
    ];

    const invalidPhoneNumbers = [
      '1234567890', // Missing +
      '+123', // Too short
      '+abc12345678', // Contains letters
      '++1234567890', // Double +
      '+12-34-56', // Too short with dashes
      '+', // Just plus
      '', // Empty
      ' ' // Space
    ];

    test.each(validPhoneNumbers)('should validate correct phone number: %s', (phone) => {
      expect(isValidPhoneNumber(phone)).toBe(true);
    });

    test.each(invalidPhoneNumbers)('should reject invalid phone number: %s', (phone) => {
      expect(isValidPhoneNumber(phone)).toBe(false);
    });
  });

  describe('isValidContactName', () => {
    const validNames = [
      'John Doe',
      'María José',
      'Jean-Pierre',
      'O\'Connor',
      'José García',
      'Ana María Pérez',
      'Juan123',
      'Dr. Smith'
    ];

    const invalidNames = [
      'a', // Too short
      '123', // Only numbers
      '@#$%', // Only special characters
      '', // Empty
      ' ', // Space
      '  ', // Multiple spaces
      '!John', // Invalid character
      'John@Doe' // Invalid character
    ];

    test.each(validNames)('should validate correct contact name: %s', (name) => {
      expect(isValidContactName(name)).toBe(true);
    });

    test.each(invalidNames)('should reject invalid contact name: %s', (name) => {
      expect(isValidContactName(name)).toBe(false);
    });
  });

  describe('isValidMessageContent', () => {
    const validMessages = [
      'Hello World',
      'This is a test message',
      '¡Hola! ¿Cómo estás?',
      '123456',
      'A'.repeat(1000), // Max length
      '!@#$%^&*()', // Special characters are allowed in messages
      '    Hello    ' // Extra spaces are allowed
    ];

    const invalidMessages = [
      '', // Empty
      ' ', // Just space
      '   ', // Multiple spaces
      'A'.repeat(1001), // Too long
      null as unknown as string, // null
      undefined as unknown as string // undefined
    ];

    test.each(validMessages)('should validate correct message content: %s', (message) => {
      expect(isValidMessageContent(message)).toBe(true);
    });

    test.each(invalidMessages)('should reject invalid message content: %s', (message) => {
      expect(isValidMessageContent(message)).toBe(false);
    });
  });

  describe('isValidDateTimeFormat', () => {
    const validDateTimes = [
      '2024-12-25 10:30', // Specific date and time
      '09:30', // Time only
      'mañana 15:45', // Tomorrow with time
      'próximo lunes 08:00', // Next weekday
      'próximo martes 23:59',
      'próximo miércoles 00:00',
      'próximo jueves 12:30',
      'próximo viernes 16:15',
      'próximo sábado 20:00',
      'próximo domingo 07:45'
    ];

    const invalidDateTimes = [
      '', // Empty
      ' ', // Space
      '2024-12-25', // Date without time
      '25-12-2024 10:30', // Wrong date format
      '10:30 2024-12-25', // Wrong order
      'mañana', // Missing time
      'próximo lunes', // Missing time
      'ayer 10:30', // Invalid relative day
      'próximo mes 10:30', // Invalid relative period
      '25:00', // Invalid hour
      '10:60', // Invalid minute
      'próximo lunez 10:30', // Misspelled weekday
      'proximo lunes 10:30' // Missing accent
    ];

    test.each(validDateTimes)('should validate correct date/time format: %s', (dateTime) => {
      expect(isValidDateTimeFormat(dateTime)).toBe(true);
    });

    test.each(invalidDateTimes)('should reject invalid date/time format: %s', (dateTime) => {
      expect(isValidDateTimeFormat(dateTime)).toBe(false);
    });
  });
}); 