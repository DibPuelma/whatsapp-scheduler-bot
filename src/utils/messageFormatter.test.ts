import { formatMessage, MessageType } from './messageFormatter';

describe('messageFormatter', () => {
  describe('formatMessage', () => {
    it('should format success schedule message', () => {
      const result = formatMessage('SUCCESS_SCHEDULE', {
        dateTime: '2024-03-15 15:30'
      });
      expect(result).toBe('✅ Mensaje programado con éxito para 2024-03-15 15:30 (hora de Chile)');
    });

    it('should format missing recipient error', () => {
      const result = formatMessage('ERROR_MISSING_RECIPIENT');
      expect(result).toContain('❌');
      expect(result).toContain('Falta el número de teléfono');
      expect(result).toContain('+56912345678');
    });

    it('should format missing datetime error', () => {
      const result = formatMessage('ERROR_MISSING_DATETIME');
      expect(result).toContain('❌');
      expect(result).toContain('Falta la fecha y hora');
      expect(result).toContain('mañana 15:30');
    });

    it('should format missing message error', () => {
      const result = formatMessage('ERROR_MISSING_MESSAGE');
      expect(result).toContain('❌');
      expect(result).toContain('Falta el contenido del mensaje');
    });

    it('should format invalid phone error with phone number', () => {
      const result = formatMessage('ERROR_INVALID_PHONE', {
        recipientPhone: '123456'
      });
      expect(result).toContain('❌');
      expect(result).toContain('123456');
      expect(result).toContain('+56912345678');
    });

    it('should format invalid datetime error with examples', () => {
      const result = formatMessage('ERROR_INVALID_DATETIME');
      expect(result).toContain('❌');
      expect(result).toContain('2024-12-25 10:30');
      expect(result).toContain('mañana 15:45');
      expect(result).toContain('próximo lunes 08:00');
    });

    it('should format invalid message error with requirements', () => {
      const result = formatMessage('ERROR_INVALID_MESSAGE');
      expect(result).toContain('❌');
      expect(result).toContain('El contenido del mensaje no es válido');
      expect(result).toContain('No estar vacío');
      expect(result).toContain('No exceder 1000 caracteres');
      expect(result).toContain('Contener texto real');
    });

    it('should format ambiguous datetime error with examples', () => {
      const result = formatMessage('ERROR_AMBIGUOUS_DATETIME');
      expect(result).toContain('❓');
      expect(result).toContain('mañana 15:30');
      expect(result).toContain('próximo lunes 09:00');
      expect(result).toContain('2024-03-15 14:00');
    });

    it('should format past datetime error', () => {
      const result = formatMessage('ERROR_PAST_DATETIME');
      expect(result).toContain('⚠️');
      expect(result).toContain('ya pasó');
    });

    it('should format limit reached error with limit number', () => {
      const result = formatMessage('ERROR_LIMIT_REACHED', {
        limit: 5
      });
      expect(result).toContain('🚫');
      expect(result).toContain('límite de 5 mensajes');
    });

    it('should format internal error with error details', () => {
      const result = formatMessage('ERROR_INTERNAL', {
        error: 'Database connection failed'
      });
      expect(result).toContain('🔧');
      expect(result).toContain('error interno');
      expect(result).toContain('Database connection failed');
    });

    it('should format internal error without error details', () => {
      const result = formatMessage('ERROR_INTERNAL');
      expect(result).toContain('🔧');
      expect(result).toContain('error interno');
      expect(result).not.toContain('Detalle:');
    });

    it('should handle unknown message type', () => {
      const result = formatMessage('UNKNOWN_TYPE' as MessageType);
      expect(result).toContain('❌');
      expect(result).toContain('Error desconocido');
    });
  });
}); 