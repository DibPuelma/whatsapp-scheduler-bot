/**
 * Types for command parsing results
 */
export interface ParsedScheduleCommand {
  recipient: string;
  dateTimeString: string;
  messageContent: string;
}

export interface CommandParseError {
  type: 'MISSING_RECIPIENT' | 'MISSING_DATETIME' | 'MISSING_MESSAGE' | 'INVALID_FORMAT';
  message: string;
}

export type CommandParseResult = 
  | { success: true; data: ParsedScheduleCommand }
  | { success: false; error: CommandParseError };

/**
 * Extracts dollar-delimited strings from a text, preserving their order
 * Handles the format $text$
 * @param text Text containing dollar-delimited strings
 * @returns Array of dollar-delimited strings found
 */
function extractBracketedStrings(text: string): string[] {
  const matches = text.match(/\$([^$]*)\$/g) || [];
  return matches.map(match => match.slice(1, -1)); // Remove $ and $
}

/**
 * Parses a /schedule command string into its components
 * Format: /schedule <recipient> $date_time_string$ $message_content$
 * 
 * @param commandText The full command text
 * @returns ParseResult with either the parsed command or an error
 */
export function parseScheduleCommand(commandText: string): CommandParseResult {
  // Remove extra whitespace and ensure we're working with a schedule command
  const trimmedCommand = commandText.trim();
  if (!trimmedCommand.startsWith('/schedule')) {
    return {
      success: false,
      error: {
        type: 'INVALID_FORMAT',
        message: 'El comando debe comenzar con /schedule'
      }
    };
  }

  // Extract the part after /schedule
  const commandContent = trimmedCommand.slice('/schedule'.length).trim();
  
  // Extract bracketed strings (these will be date/time and message)
  const bracketedParts = extractBracketedStrings(commandContent);
  
  // The recipient could be bracketed (if it contains spaces) or unbbracketed
  let recipient: string;
  const dateTimeString = bracketedParts[bracketedParts.length - 2];
  const messageContent = bracketedParts[bracketedParts.length - 1];

  if (bracketedParts.length < 2) {
    // Check if we're missing date/time or message
    return {
      success: false,
      error: {
        type: 'INVALID_FORMAT',
        message: 'La fecha/hora y el mensaje deben estar en formato $texto$. Ejemplo: /schedule +1234567890 $mañana 9:00$ $Hola$'
      }
    };
  }

  // If the recipient is bracketed, it will be the first bracketed string (if there are 3 bracketed strings)
  if (bracketedParts.length === 3) {
    recipient = bracketedParts[0];
  } else {
    // If recipient is not bracketed, it's everything before the first bracketed string
    // Find position of first $
    const firstBracketPosition = commandContent.indexOf('$');
    const beforeBrackets = firstBracketPosition !== -1 
      ? commandContent.substring(0, firstBracketPosition).trim()
      : commandContent.trim();
      
    if (!beforeBrackets) {
      return {
        success: false,
        error: {
          type: 'MISSING_RECIPIENT',
          message: 'Falta el destinatario. Debe ser un número de teléfono o un nombre de contacto.'
        }
      };
    }
    recipient = beforeBrackets;
  }

  // Validate we have all parts
  if (!recipient) {
    return {
      success: false,
      error: {
        type: 'MISSING_RECIPIENT',
        message: 'Falta el destinatario. Debe ser un número de teléfono o un nombre de contacto.'
      }
    };
  }

  if (!dateTimeString) {
    return {
      success: false,
      error: {
        type: 'MISSING_DATETIME',
        message: 'Falta la fecha/hora. Debe estar en formato $fecha/hora$.'
      }
    };
  }

  if (!messageContent) {
    return {
      success: false,
      error: {
        type: 'MISSING_MESSAGE',
        message: 'Falta el mensaje. Debe estar en formato $mensaje$.'
      }
    };
  }

  return {
    success: true,
    data: {
      recipient,
      dateTimeString,
      messageContent
    }
  };
} 