export interface ResolvedRecipient {
  phoneNumber: string;  // The resolved phone number in international format
  originalInput: string;  // The original input string (could be phone or contact name)
}

export interface RecipientResolveError {
  type: 'INVALID_PHONE' | 'CONTACT_NOT_FOUND' | 'MULTIPLE_MATCHES';
  message: string;
}

export type RecipientResolveResult = 
  | { success: true; data: ResolvedRecipient }
  | { success: false; error: RecipientResolveError };

/**
 * Validates a phone number string to ensure it matches international format
 * Valid format: + followed by digits, may contain hyphens
 * Examples: +1234567890, +56-9-1234-5678
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Remove any hyphens that might be present
  const cleanNumber = phoneNumber.replace(/-/g, '');
  
  // Must start with + and contain only digits after that
  return /^\+\d{6,}$/.test(cleanNumber);
}

/**
 * Resolves a recipient string (phone number or contact name) to a valid WhatsApp phone number
 * For now, only implements phone number validation. Contact resolution will be added later.
 */
export function resolveRecipient(recipient: string): RecipientResolveResult {
  // First, check if it looks like a phone number (starts with +)
  if (recipient.startsWith('+')) {
    if (!isValidPhoneNumber(recipient)) {
      return {
        success: false,
        error: {
          type: 'INVALID_PHONE',
          message: 'El número de teléfono no es válido. Debe estar en formato internacional (ejemplo: +56912345678).'
        }
      };
    }

    // Return the cleaned phone number (remove any hyphens)
    return {
      success: true,
      data: {
        phoneNumber: recipient.replace(/-/g, ''),
        originalInput: recipient
      }
    };
  }

  // For now, return error for contact names - will be implemented in next tasks
  return {
    success: false,
    error: {
      type: 'CONTACT_NOT_FOUND',
      message: 'La resolución de contactos será implementada próximamente. Por favor, usa el número de teléfono con código de país (ejemplo: +56912345678).'
    }
  };
} 