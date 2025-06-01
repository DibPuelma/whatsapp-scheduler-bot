import { WAMessage } from '@whiskeysockets/baileys';
import * as chrono from 'chrono-node';

export interface ParsedDateTime {
  utcTimestamp: Date;
  originalString: string;
  userTimeZoneOffset: number;
}

export interface DateTimeParseError {
  type: 'INVALID_FORMAT' | 'PAST_DATE' | 'AMBIGUOUS';
  message: string;
}

export type DateTimeParseResult = 
  | { success: true; data: ParsedDateTime }
  | { success: false; error: DateTimeParseError };

/**
 * Parses a date/time string into a UTC timestamp, considering the user's local time
 * from the message metadata.
 * 
 * @param dateTimeString The date/time string to parse
 * @param message The original WhatsApp message containing timezone metadata
 * @returns ParseResult with either the parsed UTC date or an error
 */
export function parseDateTimeToUTC(dateTimeString: string, message: WAMessage): DateTimeParseResult {
  try {
    // Get user's timezone offset from message metadata
    // Note: messageTimestamp is in seconds, we need milliseconds
    const messageTimestamp = Number(message.messageTimestamp || 0) * 1000;
    const messageDate = new Date(messageTimestamp);
    const userTimeZoneOffset = messageDate.getTimezoneOffset();

    // Parse the date string using Spanish casual parser
    const results = chrono.es.parse(dateTimeString, messageDate, { forwardDate: true });

    if (results.length === 0) {
      return {
        success: false,
        error: {
          type: 'INVALID_FORMAT',
          message: 'El formato de fecha/hora no es válido. Ejemplos válidos:\n' +
            '- 2024-12-25 10:30\n' +
            '- 09:30 (para hoy)\n' +
            '- mañana 15:45\n' +
            '- próximo lunes 08:00'
        }
      };
    }

    const match = results[0];
    const parsedDate = match.start.date();

    // Ensure the date is in the future
    if (parsedDate.getTime() <= messageDate.getTime()) {
      return {
        success: false,
        error: {
          type: 'PAST_DATE',
          message: 'La fecha y hora especificada ya pasó. Por favor, elige un momento en el futuro.'
        }
      };
    }

    // Convert to UTC
    // First, get the parsed date in the user's timezone
    const userLocalTime = new Date(parsedDate.getTime());
    
    // Then convert to UTC by adding the timezone offset
    // Note: getTimezoneOffset() returns minutes, and is positive for negative UTC offsets
    const utcTimestamp = new Date(userLocalTime.getTime() + userTimeZoneOffset * 60 * 1000);

    return {
      success: true,
      data: {
        utcTimestamp,
        originalString: dateTimeString,
        userTimeZoneOffset
      }
    };
  } catch (error) {
    console.error('Error parsing date/time:', error);
    return {
      success: false,
      error: {
        type: 'INVALID_FORMAT',
        message: 'No se pudo interpretar la fecha y hora. Por favor, usa uno de los formatos soportados.'
      }
    };
  }
} 