import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Input validation schema - all fields optional
const UpdateMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').optional(),
  scheduledAt: z.string().datetime('Invalid date format').optional(),
  targetPhone: z.string().min(1, 'Phone number cannot be empty')
    .regex(/^\+\d+$/, 'Phone number must start with + and contain only digits')
    .optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided to update"
});

// Error messages
const MESSAGE_NOT_FOUND = "Mensaje programado no encontrado.";
const MESSAGE_ALREADY_SENT = "No se puede editar un mensaje que ya fue enviado.";
const INVALID_UPDATE = "Los datos proporcionados no son válidos.";

type UpdateData = {
  content?: string;
  scheduledAt?: Date;
  phone?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const prisma = new PrismaClient();
  
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = UpdateMessageSchema.parse(body);
    
    // Find the message
    const existingMessage = await prisma.scheduledMessage.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingMessage) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: MESSAGE_NOT_FOUND },
        { status: 404 }
      );
    }

    // Check if message is still pending
    if (existingMessage.status !== 'pending') {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: MESSAGE_ALREADY_SENT },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: UpdateData = {};
    if (validatedData.content) {
      updateData.content = validatedData.content;
    }
    if (validatedData.scheduledAt) {
      updateData.scheduledAt = new Date(validatedData.scheduledAt);
    }
    if (validatedData.targetPhone) {
      updateData.phone = validatedData.targetPhone;
    }

    // Update the message
    const updatedMessage = await prisma.scheduledMessage.update({
      where: {
        id: params.id,
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