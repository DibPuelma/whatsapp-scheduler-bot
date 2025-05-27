import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Input validation schema
const ScheduleMessageSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  content: z.string().min(1, 'Message content is required'),
  scheduledAt: z.string().datetime('Invalid date format'),
});

export async function GET() {
  try {
    const scheduledMessages = await prisma.scheduledMessage.findMany({
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return NextResponse.json(scheduledMessages);
  } catch (error: unknown) {
    console.error('Error fetching scheduled messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = ScheduleMessageSchema.parse(body);
    
    // Create scheduled message
    const scheduledMessage = await prisma.scheduledMessage.create({
      data: {
        phone: validatedData.phone,
        content: validatedData.content,
        scheduledAt: new Date(validatedData.scheduledAt),
        status: 'pending',
      },
    });

    return NextResponse.json(scheduledMessage, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating scheduled message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 