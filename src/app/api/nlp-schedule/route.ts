import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseNaturalLanguage } from '@/utils/dateParser';
import { prisma } from '@/lib/prisma';
import { 
  INVALID_MESSAGE, 
  MISSING_DATE_MESSAGE, 
  MISSING_PHONE_MESSAGE, 
  MISSING_TIME_MESSAGE 
} from '@/constants/messages';

// Input validation schema
const NLPScheduleSchema = z.object({
  input: z.string().min(1, 'Message input is required'),
  senderPhone: z.string().min(1, 'Sender phone number is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = NLPScheduleSchema.parse(body);
    
    // Parse the natural language message
    const parsedMessage = parseNaturalLanguage(validatedData.input);

    // If we couldn't parse anything meaningful, return error
    if (!parsedMessage.isValid && !parsedMessage.missing) {
      return NextResponse.json(
        { error: INVALID_MESSAGE },
        { status: 400 }
      );
    }

    // If we have a missing component but valid content, create a pending conversation
    if (parsedMessage.missing) {
      let responseMessage;
      switch (parsedMessage.missing) {
        case 'time':
          responseMessage = MISSING_TIME_MESSAGE;
          break;
        case 'date':
          responseMessage = MISSING_DATE_MESSAGE;
          break;
        case 'phone':
          responseMessage = MISSING_PHONE_MESSAGE;
          break;
      }

      const pendingConversation = await prisma.pendingConversation.create({
        data: {
          phone: parsedMessage.phone || '', // recipient's phone
          senderPhone: validatedData.senderPhone, // user's phone
          originalInput: validatedData.input,
          partialContent: parsedMessage.content,
          missing: parsedMessage.missing,
        },
      });

      return NextResponse.json({
        message: responseMessage,
        pendingId: pendingConversation.id,
        parsed: {
          content: parsedMessage.content,
          date: parsedMessage.date,
          missing: parsedMessage.missing,
          phone: parsedMessage.phone
        }
      }, { status: 200 });
    }

    // If we get here, we have both date and time and a valid phone number
    const scheduledMessage = await prisma.scheduledMessage.create({
      data: {
        phone: parsedMessage.phone!, // recipient's phone
        senderPhone: validatedData.senderPhone, // user's phone
        content: parsedMessage.content,
        scheduledAt: parsedMessage.date!,
        status: 'pending',
      },
    });

    return NextResponse.json(scheduledMessage, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error scheduling message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 