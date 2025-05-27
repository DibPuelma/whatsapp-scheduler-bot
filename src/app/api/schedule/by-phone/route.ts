import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(request: Request) {
  const prisma = new PrismaClient();
  
  try {
    // Get the sender's phone number from the URL query parameters
    const { searchParams } = new URL(request.url);
    const senderPhone = searchParams.get('senderPhone');

    if (!senderPhone) {
      return NextResponse.json(
        { error: 'Sender phone number is required' },
        { status: 400 }
      );
    }

    // Find all scheduled messages for this sender
    const scheduledMessages = await prisma.scheduledMessage.findMany({
      where: {
        senderPhone: senderPhone,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      select: {
        id: true,
        phone: true,        // recipient's phone
        senderPhone: true,  // sender's phone (for verification)
        content: true,
        scheduledAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await prisma.$disconnect();

    // Return the messages (empty array if none found)
    return NextResponse.json({
      messages: scheduledMessages,
      count: scheduledMessages.length
    });
  } catch (error) {
    await prisma.$disconnect();
    
    console.error('Error fetching scheduled messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 