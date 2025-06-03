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

/**
 * Result type for date/time parsing operations
 */
export type DateTimeParseResult = {
  success: true;
  data: {
    utcTimestamp: Date;
    originalString: string;
    userTimeZoneOffset: number;
  };
} | {
  success: false;
  error: {
    type: 'INVALID_FORMAT' | 'PAST_DATE' | 'INVALID_HOUR';
    message: string;
  };
};

/**
 * Validates a time string in HH:mm format
 * @param timeStr Time string to validate
 * @returns true if valid, false otherwise
 */
function isValidTime(timeStr: string): boolean {
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) return false;

  const hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);

  return hour >= 0 && hour <= 24 && minute >= 0 && minute < 60 && !(hour === 24 && minute > 0);
}

/**
 * Parses a date/time string and converts it to UTC, taking into account the user's timezone
 * @param dateTimeString The date/time string to parse
 * @param message The WhatsApp message containing timezone information
 * @returns A DateTimeParseResult object
 */
export function parseDateTimeToUTC(dateTimeString: string, message: WAMessage): DateTimeParseResult {
  const messageDate = new Date((Number(message.messageTimestamp || 0)) * 1000);
  const userTimeZoneOffset = -240; // Chile's timezone offset in minutes (UTC-4)

  // Check for negative numbers in the input string
  if (dateTimeString.includes('-')) {
    return {
      success: false,
      error: {
        type: 'INVALID_HOUR',
        message: 'La hora no puede ser negativa.'
      }
    };
  }

  // Check for invalid time format
  const timeMatch = dateTimeString.match(/\b(\d{1,2}):(\d{2})\b/);
  if (timeMatch && !isValidTime(timeMatch[0])) {
    return {
      success: false,
      error: {
        type: 'INVALID_HOUR',
        message: 'La hora especificada no es válida. Usa formato 24 horas (00:00 a 23:59, o 24:00 para medianoche).'
      }
    };
  }

  // Normalize 24:00 to 00:00 before parsing
  if (timeMatch && timeMatch[0] === '24:00') {
    dateTimeString = dateTimeString.replace('24:00', '00:00');
  }

  // Parse the date string using Spanish casual parser with timezone
  const results = chrono.es.parse(dateTimeString, {
    instant: messageDate,
    timezone: userTimeZoneOffset
  }, { forwardDate: true });

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

  return {
    success: true,
    data: {
      utcTimestamp: parsedDate,
      originalString: dateTimeString,
      userTimeZoneOffset
    }
  };
} 