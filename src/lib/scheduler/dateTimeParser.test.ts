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
        input: '2024-12-25 10:30',
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
        input: 'mañana 24:00',
        description: 'midnight using 24:00'
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
        const nextDay = new Date(baseTimestamp * 1000);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        expect(result.data.utcTimestamp.getHours()).toBe(0);
        expect(result.data.utcTimestamp.getMinutes()).toBe(0);
      }
    });

    test('should handle 12:00 as noon', () => {
      const result = parseDateTimeToUTC('mañana 12:00', mockMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        const date = result.data.utcTimestamp;
        // 12:00 should be preserved as noon (12 PM)
        expect(date.getHours()).toBe(12);
        expect(date.getMinutes()).toBe(0);
      }
    });

    test('should handle 12:30 as after noon', () => {
      const result = parseDateTimeToUTC('mañana 12:30', mockMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        const date = result.data.utcTimestamp;
        // 12:30 should be preserved as 12:30 PM
        expect(date.getHours()).toBe(12);
        expect(date.getMinutes()).toBe(30);
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
        input: '2024-03-14 10:00',
        expectedType: 'PAST_DATE',
        description: 'past date'
      },
      {
        input: 'ayer 15:00',
        expectedType: 'PAST_DATE',
        description: 'past relative day'
      },
      {
        input: 'mañana 25:00',
        expectedType: 'INVALID_HOUR',
        description: 'hour > 24'
      },
      {
        input: 'mañana -1:00',
        expectedType: 'INVALID_HOUR',
        description: 'negative hour'
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

      // Parse a time that's specified in the user's local timezone
      const result = parseDateTimeToUTC('2024-03-15 15:00', mockMessage);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // The resulting UTC time should be adjusted by the user's timezone offset
        const localOffset = new Date(baseTimestamp * 1000).getTimezoneOffset();
        const expectedUtcTime = new Date('2024-03-15T15:00:00').getTime() + localOffset * 60 * 1000;
        
        expect(result.data.utcTimestamp.getTime()).toBe(expectedUtcTime);
      }
    });

    it('should handle midnight correctly across timezone boundaries', () => {
      const baseTimestamp = Math.floor(new Date('2024-03-15T10:00:00Z').getTime() / 1000);
      const mockMessage = createMockMessage(baseTimestamp);

      const result = parseDateTimeToUTC('mañana 00:00', mockMessage);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const nextDay = new Date(baseTimestamp * 1000);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        
        // The UTC time should be midnight in the user's timezone
        const localOffset = new Date(baseTimestamp * 1000).getTimezoneOffset();
        const expectedUtcTime = nextDay.getTime() + localOffset * 60 * 1000;
        
        expect(result.data.utcTimestamp.getTime()).toBe(expectedUtcTime);
      }
    });
  });
}); 