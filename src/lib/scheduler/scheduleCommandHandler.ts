import { WAMessage } from '@whiskeysockets/baileys';
import { parseScheduleCommand } from './commandParser';
import { 
  isValidPhoneNumber, 
  isValidContactName, 
  isValidMessageContent, 
  isValidDateTimeFormat 
} from './validation';

interface ScheduleCommandHandlerParams {
  message: WAMessage;
  senderPhone: string;  // Keep in interface for future use
}

interface ScheduleCommandResult {
  type: 'SUCCESS' | 'ERROR';
  message: string;
}

export async function handleScheduleCommand({ message }: ScheduleCommandHandlerParams): Promise<ScheduleCommandResult> {
  const messageText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';

  // Parse the command
  const parseResult = parseScheduleCommand(messageText);
  if (!parseResult.success) {
    return {
      type: 'ERROR',
      message: parseResult.error.message
    };
  }

  const { recipient, dateTimeString, messageContent } = parseResult.data;

  // Validate recipient (could be a phone number or contact name)
  const isPhone = recipient.startsWith('+');
  if (isPhone && !isValidPhoneNumber(recipient)) {
    return {
      type: 'ERROR',
      message: 'El número de teléfono no es válido. Debe estar en formato internacional (ejemplo: +1234567890).'
    };
  }
  
  if (!isPhone && !isValidContactName(recipient)) {
    return {
      type: 'ERROR',
      message: 'El nombre del contacto no es válido. Debe contener al menos 2 caracteres y no puede contener caracteres especiales.'
    };
  }

  // Validate date/time format
  if (!isValidDateTimeFormat(dateTimeString)) {
    return {
      type: 'ERROR',
      message: 'El formato de fecha/hora no es válido. Ejemplos válidos:\n' +
        '- 2024-12-25 10:30\n' +
        '- 09:30 (para hoy)\n' +
        '- mañana 15:45\n' +
        '- próximo lunes 08:00'
    };
  }

  // Validate message content
  if (!isValidMessageContent(messageContent)) {
    return {
      type: 'ERROR',
      message: 'El contenido del mensaje no es válido. Debe tener entre 1 y 1000 caracteres.'
    };
  }

  // TODO: This will be implemented in the next tasks:
  // - Date/time parsing into UTC timestamp
  // - Recipient resolution (contact name to phone number)
  // - Message scheduling in database
  return {
    type: 'SUCCESS',
    message: `Comando validado correctamente:\n` +
      `📱 Destinatario: ${recipient}\n` +
      `⏰ Fecha/Hora: ${dateTimeString}\n` +
      `💬 Mensaje: ${messageContent}\n\n` +
      `La funcionalidad de programación será implementada próximamente.`
  };
} 