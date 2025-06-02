// Message types for better type safety
export type MessageType = 
  | 'SUCCESS_SCHEDULE'
  | 'ERROR_MISSING_RECIPIENT'
  | 'ERROR_MISSING_DATETIME'
  | 'ERROR_MISSING_MESSAGE'
  | 'ERROR_INVALID_PHONE'
  | 'ERROR_INVALID_DATETIME'
  | 'ERROR_INVALID_MESSAGE'
  | 'ERROR_AMBIGUOUS_DATETIME'
  | 'ERROR_PAST_DATETIME'
  | 'ERROR_LIMIT_REACHED'
  | 'ERROR_INTERNAL';

// Interface for message format parameters
interface MessageFormatParams {
  recipientPhone?: string;
  dateTime?: string;
  messageContent?: string;
  limit?: number;
  error?: string;
}

/**
 * Formats a message with the given parameters
 */
export function formatMessage(type: MessageType, params: MessageFormatParams = {}): string {
  switch (type) {
    // Success messages
    case 'SUCCESS_SCHEDULE':
      return `✅ Mensaje programado con éxito para ${params.dateTime} (hora de Chile)`;

    // Error messages for missing parameters
    case 'ERROR_MISSING_RECIPIENT':
      return '❌ Falta el número de teléfono del destinatario. Por favor, incluye un número en formato internacional (ej: +56912345678)';
    
    case 'ERROR_MISSING_DATETIME':
      return '❌ Falta la fecha y hora del mensaje. Por favor, especifica cuándo enviar el mensaje (ej: mañana 15:30)';
    
    case 'ERROR_MISSING_MESSAGE':
      return '❌ Falta el contenido del mensaje. Por favor, incluye el mensaje que quieres enviar';

    // Error messages for invalid formats
    case 'ERROR_INVALID_PHONE':
      return `❌ El número "${params.recipientPhone}" no es válido. Por favor, usa el formato internacional (ej: +56912345678)`;
    
    case 'ERROR_INVALID_DATETIME':
      return '❌ El formato de fecha/hora no es válido. Ejemplos válidos:\n' +
        '- 2024-12-25 10:30\n' +
        '- 09:30 (para hoy)\n' +
        '- mañana 15:45\n' +
        '- próximo lunes 08:00';
    
    case 'ERROR_INVALID_MESSAGE':
      return '❌ El contenido del mensaje no es válido. El mensaje debe:\n' +
        '- No estar vacío\n' +
        '- No exceder 1000 caracteres\n' +
        '- Contener texto real (no solo espacios)';
    
    case 'ERROR_AMBIGUOUS_DATETIME':
      return '❓ La fecha/hora especificada es ambigua. Por favor, sé más específico.\n' +
        'Ejemplos claros:\n' +
        '- mañana 15:30\n' +
        '- próximo lunes 09:00\n' +
        '- 2024-03-15 14:00';
    
    case 'ERROR_PAST_DATETIME':
      return '⚠️ La fecha y hora especificada ya pasó. Por favor, elige un momento en el futuro.';

    // Error message for limit reached
    case 'ERROR_LIMIT_REACHED':
      return `🚫 Has alcanzado el límite de ${params.limit} mensajes programados pendientes. Por favor, espera a que algunos mensajes sean enviados antes de programar más.`;

    // Internal error message
    case 'ERROR_INTERNAL':
      return '🔧 Ha ocurrido un error interno. Por favor, intenta nuevamente más tarde.' +
        (params.error ? `\nDetalle: ${params.error}` : '');

    default:
      return '❌ Error desconocido. Por favor, intenta nuevamente.';
  }
} 