import { NextRequest, NextResponse } from 'next/server';
import { processScheduledMessages } from '@/jobs/messageSenderJob';
import { logger } from '@/lib/logger';

// This endpoint will be called by Vercel Cron
export async function POST(request: NextRequest) {
  // Verify the request is from Vercel Cron using the secret
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logger.error('CRON_SECRET environment variable is not set');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  console.log({authHeader, cronSecret})
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Process scheduled messages
    await processScheduledMessages();
    
    // Return success response
    return NextResponse.json({ 
      success: true,
      message: 'Scheduled messages processed successfully'
    });
  } catch (error) {
    // Log the error with details
    logger.error('Failed to process scheduled messages:', error);
    
    // Return error response
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 