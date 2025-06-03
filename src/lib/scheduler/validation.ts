/**
 * Validation functions for schedule command parameters
 */

/**
 * Validates a phone number format
 * Valid formats:
 * - International format with + prefix: +1234567890
 * - International format with dashes: +1-234-567-890
 * - International format with spaces: +1 234 567 890
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Basic international phone format validation
  const phoneRegex = /^\+\d[\d\s-]{8,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates a contact name
 * Rules:
 * - Must be at least 2 characters long
 * - Can contain letters, spaces, accents, and basic punctuation
 * - Cannot be just numbers or special characters
 */
export function isValidContactName(name: string): boolean {
  if (name.length < 2) return false;
  
  // Must contain at least one letter (including accented characters)
  const hasLetter = /[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/.test(name);
  
  // Can only contain letters, numbers, spaces, and basic punctuation
  const validChars = /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\s\-.']+$/;
  
  return hasLetter && validChars.test(name);
}

/**
 * Validates a message content
 * Rules:
 * - Must not be empty
 * - Must not exceed 1000 characters
 * - Must contain actual text content (not just whitespace)
 */
export function isValidMessageContent(message: string): boolean {
  if (!message || message.trim().length === 0) return false;
  if (message.length > 1000) return false;
  return true;
}

/**
 * Validates a date/time string format
 * Valid formats defined in PRD:
 * - YYYY-MM-DD HH:MM
 * - HH:MM (for today/tomorrow)
 * - mañana HH:MM
 * - próximo <día de la semana> HH:MM
 */
export function isValidDateTimeFormat(dateTime: string): boolean {
  // Specific date and time format: YYYY-MM-DD HH:MM
  const specificDateTimeRegex = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/;
  
  // Time only format: HH:MM
  const timeOnlyRegex = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;
  
  // Tomorrow format: mañana HH:MM
  const tomorrowRegex = /^mañana\s\d{2}:\d{2}$/;
  
  // Next weekday format: próximo <día> HH:MM
  const weekdays = ['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo'];
  const weekdayPattern = weekdays.join('|');
  const nextWeekdayRegex = new RegExp(`^próximo\\s(${weekdayPattern})\\s\\d{2}:\\d{2}$`);

  return (
    specificDateTimeRegex.test(dateTime) ||
    timeOnlyRegex.test(dateTime) ||
    tomorrowRegex.test(dateTime) ||
    nextWeekdayRegex.test(dateTime)
  );
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
} 