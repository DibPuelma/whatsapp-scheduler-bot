import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { parseNaturalLanguage } from '@/utils/dateParser';

const prisma = new PrismaClient();

// Input validation schema
const FollowupSchema = z.object({
  input: z.string().min(1, 'Message input is required'),
  senderPhone: z.string().min(1, 'Sender phone number is required'),
});

// Response messages in Spanish
const MISSING_TIME_MESSAGE = "Aún necesito que me indiques la hora.";
const MISSING_DATE_MESSAGE = "Aún necesito que me indiques el día.";
const MISSING_PHONE_MESSAGE = "Necesito que me indiques el número de teléfono con código de país (ejemplo: +56912345678).";
const NO_PENDING_MESSAGE = "No encontré una conversación pendiente. Por favor, envía tu mensaje completo nuevamente.";
const SUCCESS_MESSAGE = "¡Listo! He programado tu mensaje.";

// Phone number validation
const isValidPhoneNumber = (input: string): boolean => {
  return /^\+\d+$/.test(input.trim());
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = FollowupSchema.parse(body);
    
    // Find the most recent pending conversation for this sender
    const pendingConversation = await prisma.pendingConversation.findFirst({
      where: {
        senderPhone: validatedData.senderPhone,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!pendingConversation) {
      return NextResponse.json(
        { error: NO_PENDING_MESSAGE },
        { status: 404 }
      );
    }

    // Handle phone number follow-up differently
    if (pendingConversation.missing === 'phone') {
      // Try to extract phone number from input
      const phoneRegex = /\+\d+/;
      const phoneMatch = validatedData.input.match(phoneRegex);
      const phone = phoneMatch ? phoneMatch[0] : null;

      if (!phone || !isValidPhoneNumber(phone)) {
        // Update pending conversation with the new attempt
        const updatedPending = await prisma.pendingConversation.update({
          where: {
            id: pendingConversation.id,
          },
          data: {
            originalInput: validatedData.input,
          },
        });

        return NextResponse.json({
          message: MISSING_PHONE_MESSAGE,
          pendingId: updatedPending.id,
          parsed: {
            content: pendingConversation.partialContent,
            missing: 'phone'
          }
        }, { status: 200 });
      }

      // If we have a valid phone, try to parse the complete message
      const parsedMessage = parseNaturalLanguage(`${phone} ${pendingConversation.partialContent}`);

      if (parsedMessage.isValid && parsedMessage.date && parsedMessage.phone) {
        // Create the scheduled message
        const scheduledMessage = await prisma.scheduledMessage.create({
          data: {
            phone: parsedMessage.phone, // recipient's phone
            senderPhone: validatedData.senderPhone, // user's phone
            content: parsedMessage.content,
            scheduledAt: parsedMessage.date,
            status: 'pending',
          },
        });

        // Delete the pending conversation
        await prisma.pendingConversation.delete({
          where: {
            id: pendingConversation.id,
          },
        });

        return NextResponse.json({
          message: SUCCESS_MESSAGE,
          scheduledMessage,
        }, { status: 201 });
      }
    }

    // Handle date/time follow-ups
    let combinedInput = validatedData.input;
    if (pendingConversation.missing === 'time') {
      combinedInput = `${pendingConversation.partialContent} a las ${validatedData.input}`;
    } else {
      combinedInput = `${validatedData.input} ${pendingConversation.partialContent}`;
    }

    const parsedMessage = parseNaturalLanguage(combinedInput);

    // If we still don't have a valid message
    if (!parsedMessage.isValid || parsedMessage.missing) {
      // Update the pending conversation with new information
      const updatedPending = await prisma.pendingConversation.update({
        where: {
          id: pendingConversation.id,
        },
        data: {
          originalInput: combinedInput,
          missing: parsedMessage.missing || pendingConversation.missing,
        },
      });

      const responseMessage = parsedMessage.missing === 'time' 
        ? MISSING_TIME_MESSAGE 
        : parsedMessage.missing === 'date'
          ? MISSING_DATE_MESSAGE
          : MISSING_PHONE_MESSAGE;

      return NextResponse.json({
        message: responseMessage,
        pendingId: updatedPending.id,
        parsed: {
          content: parsedMessage.content,
          date: parsedMessage.date,
          missing: parsedMessage.missing,
          phone: parsedMessage.phone
        }
      }, { status: 200 });
    }

    // If we get here, we have a valid message with all required fields
    const scheduledMessage = await prisma.scheduledMessage.create({
      data: {
        phone: parsedMessage.phone!, // recipient's phone
        senderPhone: validatedData.senderPhone, // user's phone
        content: parsedMessage.content,
        scheduledAt: parsedMessage.date!,
        status: 'pending',
      },
    });

    // Delete the pending conversation
    await prisma.pendingConversation.delete({
      where: {
        id: pendingConversation.id,
      },
    });

    return NextResponse.json({
      message: SUCCESS_MESSAGE,
      scheduledMessage,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error processing follow-up message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 