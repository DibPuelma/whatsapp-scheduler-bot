import * as chrono from 'chrono-node';

interface ParsedMessage {
  content: string;
  date: Date | null;
  isValid: boolean;
  missing: 'date' | 'time' | 'phone' | null;
  phone: string | null;
}

export function parseNaturalLanguage(message: string): ParsedMessage {
  try {
    // Extract phone number that starts with + followed by digits
    const phoneRegex = /\+\d+/;
    const phoneMatch = message.match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0] : null;
    
    // Remove the phone number from the message for further parsing
    const messageWithoutPhone = phone ? message.replace(phone, '').trim() : message;

    // Parse the date string using Spanish casual parser
    const results = chrono.es.parse(messageWithoutPhone, new Date(), { forwardDate: true });

    if (results.length === 0) {
      return {
        content: messageWithoutPhone.trim(),
        date: null,
        isValid: false,
        missing: null,
        phone
      };
    }

    const match = results[0];
    const date = match.start.date();
    
    // Remove the date text and common scheduling words
    let content = messageWithoutPhone;
    
    // Remove the actual matched text
    content = content.replace(match.text, '');
    
    // Remove common Spanish scheduling prefixes
    const prefixes = [
      'agenda',
      'agenda para',
      'envía',
      'envia',
      'enviar',
      'programar',
      'programa',
      'programa para',
      'envía este mensaje',
      'envia este mensaje',
      'agendar para',
      'agendar',
    ];
    
    for (const prefix of prefixes) {
      if (content.toLowerCase().startsWith(prefix)) {
        content = content.substring(prefix.length);
      }
    }

    // Clean up any extra spaces and trim
    content = content
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .trim();

    // Determine what's missing from the parsed date
    let missing: 'date' | 'time' | 'phone' | null = null;
    
    // Check if time is missing by comparing the minutes and hours
    const hasTime = match.start.get('hour') !== undefined;
    
    // Check if date is missing by seeing if the parsed date is just today
    const hasDate = match.start.get('day') !== undefined ||
                   match.start.get('weekday') !== undefined ||
                   match.start.get('month') !== undefined;
    
    if (!hasTime && !hasDate) {
      // If neither is present, consider it invalid
      return {
        content,
        date: null,
        isValid: false,
        missing: null,
        phone
      };
    } else if (!hasTime) {
      missing = 'time';
    } else if (!hasDate) {
      missing = 'date';
    }

    // If we don't have a valid phone number, set missing to 'phone'
    if (!phone) {
      missing = 'phone';
    }

    return {
      content,
      date,
      isValid: content.length > 0 && date !== null && phone !== null,
      missing,
      phone
    };
  } catch (error) {
    console.error('Error parsing natural language date:', error);
    return {
      content: '',
      date: null,
      isValid: false,
      missing: null,
      phone: null
    };
  }
} 