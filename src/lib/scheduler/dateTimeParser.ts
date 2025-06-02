import { WAMessage } from '@whiskeysockets/baileys';
import * as chrono from 'chrono-node';

export interface ParsedDateTime {
  utcTimestamp: Date;
  originalString: string;
  userTimeZoneOffset: number;
}

export interface DateTimeParseError {
  type: 'INVALID_FORMAT' | 'PAST_DATE' | 'AMBIGUOUS' | 'INVALID_HOUR';
  message: string;
}

export type DateTimeParseResult = 
  | { success: true; data: ParsedDateTime }
  | { success: false; error: DateTimeParseError };

/**
 * Normalizes hour value to handle special cases in 24-hour format
 * @param hour Hour value from 0-24
 * @returns Normalized hour (0-23) or null if invalid
 */
function normalizeHour(hour: number): number | null {
  if (hour === 24) return 0;  // Convert 24:00 to 00:00
  if (hour === 12) return 12; // Keep 12 as is (noon)
  if (hour >= 0 && hour <= 23) return hour;
  return null;
}

/**
 * Extracts hour and minute from a time string
 * @param timeStr Time string in format HH:mm or H:mm
 * @returns Parsed hour and minute or null if invalid
 */
function parseTimeString(timeStr: string): { hour: number, minute: number } | null {
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) return null;

  const hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);

  if (minute < 0 || minute > 59) return null;
  const normalizedHour = normalizeHour(hour);
  if (normalizedHour === null) return null;

  return { hour: normalizedHour, minute };
}

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
    const messageTimestamp = Number(message.messageTimestamp || 0) * 1000;
    const messageDate = new Date(messageTimestamp);
    const userTimeZoneOffset = messageDate.getTimezoneOffset();

    // First try to extract time if it matches our 24-hour format
    const timeMatch = dateTimeString.match(/\b(\d{1,2}):(\d{2})\b/);
    if (timeMatch) {
      const timeStr = timeMatch[0]; // Use the full matched time string
      const parsedTime = parseTimeString(timeStr);
      
      if (!parsedTime) {
        return {
          success: false,
          error: {
            type: 'INVALID_HOUR',
            message: 'La hora especificada no es válida. Usa formato 24 horas (00:00 a 23:59, o 24:00 para medianoche).'
          }
        };
      }

      // Replace the original time string with a normalized version for chrono to parse
      const normalizedTimeStr = `${parsedTime.hour.toString().padStart(2, '0')}:${parsedTime.minute.toString().padStart(2, '0')}`;
      dateTimeString = dateTimeString.replace(timeMatch[0], normalizedTimeStr);
    }

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
            '- próximo lunes 08:00\n' +
            '- mañana 00:00 (o 24:00 para medianoche)'
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

    // Convert the parsed date (which is in Santiago time) to UTC
    const utcTimestamp = new Date(parsedDate.getTime() - (4 * 60 * 60 * 1000)); // Chile is UTC-4

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