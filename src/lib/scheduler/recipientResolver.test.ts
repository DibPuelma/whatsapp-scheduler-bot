import { isValidPhoneNumber, resolveRecipient } from './recipientResolver';

describe('isValidPhoneNumber', () => {
  const validPhoneNumbers = [
    '+1234567890',
    '+56912345678',
    '+56-9-1234-5678',
    '+123456789012345'
  ];

  const invalidPhoneNumbers = [
    '',                    // empty string
    '+',                   // just plus
    '1234567890',         // no plus
    '+abc123',            // non-digits
    '+12345',             // too short
    '+56 9 1234 5678',    // spaces not allowed
    'tel:+1234567890'     // extra characters
  ];

  test.each(validPhoneNumbers)('should return true for valid phone number: %s', (phoneNumber) => {
    expect(isValidPhoneNumber(phoneNumber)).toBe(true);
  });

  test.each(invalidPhoneNumbers)('should return false for invalid phone number: %s', (phoneNumber) => {
    expect(isValidPhoneNumber(phoneNumber)).toBe(false);
  });
});

describe('resolveRecipient', () => {
  describe('phone number resolution', () => {
    test('should successfully resolve a valid phone number', () => {
      const result = resolveRecipient('+56912345678');
      expect(result).toEqual({
        success: true,
        data: {
          phoneNumber: '+56912345678',
          originalInput: '+56912345678'
        }
      });
    });

    test('should successfully resolve a valid phone number with hyphens', () => {
      const result = resolveRecipient('+56-9-1234-5678');
      expect(result).toEqual({
        success: true,
        data: {
          phoneNumber: '+56912345678',
          originalInput: '+56-9-1234-5678'
        }
      });
    });

    test('should return error for invalid phone number', () => {
      const result = resolveRecipient('+123');
      expect(result).toEqual({
        success: false,
        error: {
          type: 'INVALID_PHONE',
          message: 'El número de teléfono no es válido. Debe estar en formato internacional (ejemplo: +56912345678).'
        }
      });
    });
  });

  describe('contact name resolution (placeholder)', () => {
    test('should return not implemented error for contact names', () => {
      const result = resolveRecipient('John Doe');
      expect(result).toEqual({
        success: false,
        error: {
          type: 'CONTACT_NOT_FOUND',
          message: 'La resolución de contactos será implementada próximamente. Por favor, usa el número de teléfono con código de país (ejemplo: +56912345678).'
        }
      });
    });
  });
}); 