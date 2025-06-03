import { WAMessage } from '@whiskeysockets/baileys';
import { parseDateTimeToUTC } from './dateTimeParser';

describe('parseDateTimeToUTC', () => {
  // Helper to create a mock WAMessage with a specific timestamp
  const createMockMessage = (timestamp: number): WAMessage => ({
    messageTimestamp: timestamp,
    key: { remoteJid: '', id: '', fromMe: false },
    message: { conversation: '' }
  });

  describe('successful parsing', () => {
    // Use a fixed timestamp for tests: 2024-03-15 10:00:00 UTC
    const baseTimestamp = Math.floor(new Date('2024-03-15T10:00:00Z').getTime() / 1000);
    const mockMessage = createMockMessage(baseTimestamp);

    const validCases = [
      {
        input: '25/12/2024 10:30',
        description: 'specific date and time'
      },
      {
        input: '15:00',
        description: 'time for today (future)'
      },
      {
        input: 'mañana 09:00',
        description: 'tomorrow with time'
      },
      {
        input: 'próximo lunes 08:00',
        description: 'next weekday'
      },
      {
        input: 'mañana 00:00',
        description: 'midnight using 00:00'
      },
      {
        input: 'mañana 00:00',
        description: 'midnight (normalized from 24:00)'
      },
      {
        input: 'mañana 12:00',
        description: 'noon'
      },
      {
        input: 'mañana 12:30',
        description: 'after noon'
      }
    ];

    test.each(validCases)('should parse $description: $input', ({ input }) => {
      const result = parseDateTimeToUTC(input, mockMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utcTimestamp).toBeInstanceOf(Date);
        expect(result.data.originalString).toBe(input);
        expect(typeof result.data.userTimeZoneOffset).toBe('number');
        // The parsed date should be in the future relative to the message timestamp
        expect(result.data.utcTimestamp.getTime()).toBeGreaterThan(baseTimestamp * 1000);
      }
    });

    test('should normalize 24:00 to 00:00 of the next day', () => {
      const result = parseDateTimeToUTC('mañana 24:00', mockMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        // When it's 00:00 (midnight) in Chile, it's 04:00 UTC
        const expectedUtcTime = new Date('2024-03-16T04:00:00Z').getTime();
        expect(result.data.utcTimestamp.getTime()).toBe(expectedUtcTime);
        expect(result.data.originalString).toBe('mañana 00:00');
      }
    });

    test('should handle 12:00 as noon', () => {
      const result = parseDateTimeToUTC('mañana 12:00', mockMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        // When it's 12:00 (noon) in Chile, it's 16:00 UTC
        const expectedUtcTime = new Date('2024-03-16T16:00:00Z').getTime();
        expect(result.data.utcTimestamp.getTime()).toBe(expectedUtcTime);
      }
    });

    test('should handle 12:30 as after noon', () => {
      const result = parseDateTimeToUTC('mañana 12:30', mockMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        // When it's 12:30 in Chile, it's 16:30 UTC
        const expectedUtcTime = new Date('2024-03-16T16:30:00Z').getTime();
        expect(result.data.utcTimestamp.getTime()).toBe(expectedUtcTime);
      }
    });
  });

  describe('error handling', () => {
    const baseTimestamp = Math.floor(new Date('2024-03-15T10:00:00Z').getTime() / 1000);
    const mockMessage = createMockMessage(baseTimestamp);

    const errorCases = [
      {
        input: '',
        expectedType: 'INVALID_FORMAT',
        description: 'empty string'
      },
      {
        input: 'not a date',
        expectedType: 'INVALID_FORMAT',
        description: 'invalid format'
      },
      {
        input: '14/03/2024 10:00',
        expectedType: 'PAST_DATE',
        description: 'past date'
      },
      {
        input: 'ayer 15:00',
        expectedType: 'PAST_DATE',
        description: 'past relative day'
      },
      {
        input: 'mañana -1:00',
        expectedType: 'INVALID_HOUR',
        description: 'negative hour'
      },
      {
        input: 'mañana 25:00',
        expectedType: 'INVALID_HOUR',
        description: 'hour > 24'
      },
      {
        input: 'mañana 12:60',
        expectedType: 'INVALID_HOUR',
        description: 'invalid minutes'
      }
    ];

    test.each(errorCases)('should handle $description: $input', ({ input, expectedType }) => {
      const result = parseDateTimeToUTC(input, mockMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe(expectedType);
        expect(result.error.message).toBeTruthy();
      }
    });
  });

  describe('timezone handling', () => {
    it('should correctly convert local time to UTC', () => {
      // Create a message timestamp for 2024-03-15 10:00:00 UTC
      const baseTimestamp = Math.floor(new Date('2024-03-15T10:00:00Z').getTime() / 1000);
      const mockMessage = createMockMessage(baseTimestamp);

      // Parse a time that's specified in Chile's timezone (UTC-4)
      const result = parseDateTimeToUTC('16/03/2024 15:00', mockMessage);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // When it's 15:00 in Chile, it's 19:00 UTC
        const expectedUtcTime = new Date('2024-03-16T19:00:00Z').getTime();
        expect(result.data.utcTimestamp.getTime()).toBe(expectedUtcTime);
      }
    });

    it('should handle midnight correctly across timezone boundaries', () => {
      const baseTimestamp = Math.floor(new Date('2024-03-15T10:00:00Z').getTime() / 1000);
      const mockMessage = createMockMessage(baseTimestamp);

      const result = parseDateTimeToUTC('mañana 00:00', mockMessage);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // When it's 00:00 (midnight) in Chile on March 16, it's 04:00 UTC on March 16
        const expectedUtcTime = new Date('2024-03-16T04:00:00Z').getTime();
        expect(result.data.utcTimestamp.getTime()).toBe(expectedUtcTime);
      }
    });
  });
}); 