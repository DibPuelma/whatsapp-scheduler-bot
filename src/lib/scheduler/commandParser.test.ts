import { parseScheduleCommand } from './commandParser';

describe('parseScheduleCommand', () => {
  describe('successful parsing', () => {
    it('should parse a command with phone number recipient', () => {
      const result = parseScheduleCommand('/schedule +1234567890 $2024-12-25 10:30$ $¡Feliz Navidad! 🎄$');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          recipient: '+1234567890',
          dateTimeString: '2024-12-25 10:30',
          messageContent: '¡Feliz Navidad! 🎄'
        });
      }
    });

    it('should handle extra whitespace', () => {
      const result = parseScheduleCommand('  /schedule   +1234567890    $18:00$    $¡No olvides nuestra reunión!$  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          recipient: '+1234567890',
          dateTimeString: '18:00',
          messageContent: '¡No olvides nuestra reunión!'
        });
      }
    });

    it('should handle complex messages with quotes and special characters', () => {
      const result = parseScheduleCommand('/schedule +573001234567 $2024-01-15 14:30$ $Recordatorio: reunión a las 3:00 PM en el Centro de Negocios$');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          recipient: '+573001234567',
          dateTimeString: '2024-01-15 14:30',
          messageContent: 'Recordatorio: reunión a las 3:00 PM en el Centro de Negocios'
        });
      }
    });
  });

  describe('error handling', () => {
    it('should return error for non-schedule command', () => {
      const result = parseScheduleCommand('/invalid command');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_FORMAT');
        expect(result.error.message).toBe('El comando debe comenzar con /schedule');
      }
    });

    it('should return error for missing recipient', () => {
      const result = parseScheduleCommand('/schedule $18:00$ $mensaje$');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('MISSING_RECIPIENT');
      }
    });

    it('should return error for missing date/time', () => {
      const result = parseScheduleCommand('/schedule +1234567890 $mensaje$');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_FORMAT');
      }
    });

    it('should return error for missing message', () => {
      const result = parseScheduleCommand('/schedule +1234567890 $18:00$');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_FORMAT');
      }
    });

    it('should return error for missing quotes around date/time', () => {
      const result = parseScheduleCommand('/schedule +1234567890 18:00 $mensaje$');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_FORMAT');
      }
    });

    it('should return error for missing quotes around message', () => {
      const result = parseScheduleCommand('/schedule +1234567890 $18:00$ mensaje');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_FORMAT');
      }
    });

    it('should return error for empty command', () => {
      const result = parseScheduleCommand('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_FORMAT');
      }
    });

    it('should return error for just /schedule', () => {
      const result = parseScheduleCommand('/schedule');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_FORMAT');
      }
    });


    it('should return error when recipient is empty but quoted', () => {
      const result = parseScheduleCommand('/schedule $$ $18:00$ $mensaje$');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('MISSING_RECIPIENT');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle case insensitive command', () => {
      const result = parseScheduleCommand('/SCHEDULE +1234567890 $18:00$ $mensaje$');
      expect(result.success).toBe(false); // Our parser is case sensitive
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_FORMAT');
      }
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      const result = parseScheduleCommand(`/schedule +1234567890 $18:00$ $${longMessage}$`);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.messageContent).toBe(longMessage);
      }
    });

    it('should handle international phone numbers', () => {
      const result = parseScheduleCommand('/schedule +44-20-7946-0958 $18:00$ $mensaje$');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recipient).toBe('+44-20-7946-0958');
      }
    });

    it('should handle empty quoted strings', () => {
      const result = parseScheduleCommand('/schedule +1234567890 $$ $mensaje$');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('MISSING_DATETIME');
      }
    });
  });
}); 