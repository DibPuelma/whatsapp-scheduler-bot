import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { parseNaturalLanguage } from '@/utils/dateParser';

// Input validation schema
const NLPEditSchema = z.object({
  input: z.string().min(1, 'Message input is required'),
  senderPhone: z.string().min(1, 'Sender phone number is required'),
});

// Error messages in Spanish
const NO_MESSAGE_FOUND = "No encontré ningún mensaje que coincida con tu solicitud. Por favor, sé más específico.";
const INVALID_UPDATE = "No pude entender qué cambios quieres hacer. Por favor, especifica el nuevo contenido, hora o número de teléfono.";

// Common edit command words in Spanish
const EDIT_COMMANDS = [
  'cambiar',
  'modificar',
  'actualizar',
  'editar',
  'corregir',
];

// Types for our domain
interface ScheduledMessage {
  id: string;
  content: string;
  phone: string;
  senderPhone: string;
  scheduledAt: Date;
  status: string;
}

function findMessageToEdit(content: string, messages: ScheduledMessage[]): ScheduledMessage | null {
  // Remove edit commands and common words to get the core content
  let searchContent = content.toLowerCase();
  EDIT_COMMANDS.forEach(cmd => {
    searchContent = searchContent.replace(cmd, '');
  });
  
  // Common words to remove
  const commonWords = ['el', 'la', 'los', 'las', 'mensaje', 'para', 'que', 'dice'];
  commonWords.forEach(word => {
    searchContent = searchContent.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
  });

  searchContent = searchContent.trim();

  // Find the message that has the most word matches with the search content
  let bestMatch: ScheduledMessage | null = null;
  let bestMatchScore = 0;

  messages.forEach(message => {
    const messageWords = new Set(message.content.toLowerCase().split(/\s+/));
    const searchWords = searchContent.split(/\s+/);
    
    let matchScore = 0;
    searchWords.forEach(word => {
      if (messageWords.has(word)) {
        matchScore++;
      }
    });

    if (matchScore > bestMatchScore) {
      bestMatch = message;
      bestMatchScore = matchScore;
    }
  });

  return bestMatch;
}

export async function POST(request: Request) {
  const prisma = new PrismaClient();
  
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = NLPEditSchema.parse(body);
    
    // Get all pending messages for this sender
    const pendingMessages = await prisma.scheduledMessage.findMany({
      where: {
        senderPhone: validatedData.senderPhone,
        status: 'pending',
      },
    });

    if (pendingMessages.length === 0) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: NO_MESSAGE_FOUND },
        { status: 404 }
      );
    }

    // Find the message to edit
    const messageToEdit = findMessageToEdit(validatedData.input, pendingMessages);

    if (!messageToEdit) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: NO_MESSAGE_FOUND },
        { status: 404 }
      );
    }

    // Parse the natural language message for updates
    const parsedMessage = parseNaturalLanguage(validatedData.input);

    // If we couldn't parse anything meaningful, return error
    if (!parsedMessage.isValid && !parsedMessage.missing) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: INVALID_UPDATE },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (parsedMessage.content) {
      updateData.content = parsedMessage.content;
    }
    if (parsedMessage.date) {
      updateData.scheduledAt = parsedMessage.date;
    }
    if (parsedMessage.phone) {
      updateData.phone = parsedMessage.phone;
    }

    // Update the message
    const updatedMessage = await prisma.scheduledMessage.update({
      where: {
        id: messageToEdit.id,
      },
      data: updateData,
    });

    await prisma.$disconnect();

    return NextResponse.json({
      message: "Mensaje actualizado exitosamente",
      scheduledMessage: updatedMessage,
    });
  } catch (error) {
    await prisma.$disconnect();
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: INVALID_UPDATE, details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating scheduled message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 