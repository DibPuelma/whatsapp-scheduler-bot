import { parseViewMessageRequest } from '../messageViewParser';
import { INVALID_VIEW_REQUEST } from '../../constants/messages';

describe('messageViewParser', () => {
  describe('parseViewMessageRequest', () => {
    // Valid view message tests
    test('should detect basic view message requests in Spanish', () => {
      const validViewRequests = [
        'ver mensajes',
        'mostrar mensajes',
        'qué mensajes tengo',
        'cuáles mensajes tengo',
        'mis mensajes',
        'mensajes programados',
        'ver programados',
        'mostrar programados',
      ];

      validViewRequests.forEach(message => {
        const result = parseViewMessageRequest(message);
        expect(result).toEqual({
          isViewRequest: true,
          isMoreRequest: false,
          isValid: true,
        });
      });
    });

    // Valid "more" message tests
    test('should detect "ver más" requests in Spanish', () => {
      const validMoreRequests = [
        'ver más',
        'mostrar más',
        'más mensajes',
        'siguientes',
        'continuar',
      ];

      validMoreRequests.forEach(message => {
        const result = parseViewMessageRequest(message);
        expect(result).toEqual({
          isViewRequest: false,
          isMoreRequest: true,
          isValid: true,
        });
      });
    });

    // Case insensitivity tests
    test('should be case insensitive', () => {
      const mixedCaseRequests = [
        'VER MENSAJES',
        'Mostrar Mensajes',
        'Ver Más',
        'SIGUIENTES',
      ];

      mixedCaseRequests.forEach(message => {
        const result = parseViewMessageRequest(message);
        expect(result.isValid).toBe(true);
      });
    });

    // Invalid input tests
    test('should handle invalid inputs', () => {
      const invalidInputs: (string | null | undefined | number | object | unknown[])[] = [
        '',
        ' ',
        null,
        undefined,
        123,
        {},
        [],
      ];

      invalidInputs.forEach(input => {
        const result = parseViewMessageRequest(input as string);
        expect(result).toEqual({
          isViewRequest: false,
          isMoreRequest: false,
          isValid: false,
          error: INVALID_VIEW_REQUEST,
        });
      });
    });

    // Security validation tests
    test('should reject potentially malicious inputs', () => {
      const maliciousInputs = [
        'SELECT * FROM messages',
        'ver mensajes; DROP TABLE users',
        '<script>alert("hack")</script>',
        'javascript:alert(1)',
        '{{.System}}',
      ];

      maliciousInputs.forEach(input => {
        const result = parseViewMessageRequest(input);
        expect(result).toEqual({
          isViewRequest: false,
          isMoreRequest: false,
          isValid: false,
          error: INVALID_VIEW_REQUEST,
        });
      });
    });

    // Natural language variations tests
    test('should handle natural language variations', () => {
      const variations = [
        'podrías mostrarme mis mensajes',
        'quisiera ver mis mensajes programados',
        'me gustaría ver más mensajes',
        'necesito ver los siguientes mensajes',
      ];

      variations.forEach(message => {
        const result = parseViewMessageRequest(message);
        expect(result.isValid).toBe(true);
      });
    });

    // Edge cases tests
    test('should handle edge cases appropriately', () => {
      const edgeCases = [
        'ver  mensajes', // multiple spaces
        ' ver mensajes ', // leading/trailing spaces
        'vermensajes', // no space
        'más', // single word
      ];

      edgeCases.forEach(message => {
        // Just test that it doesn't throw
        expect(() => parseViewMessageRequest(message)).not.toThrow();
      });
    });
  });
}); 