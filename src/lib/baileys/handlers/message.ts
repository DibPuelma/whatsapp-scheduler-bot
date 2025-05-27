interface MessageHandlerParams {
  sender: string;
  message: string;
}

export async function handleIncomingMessage({ sender, message }: MessageHandlerParams): Promise<string> {
  try {
    const response = await fetch('http://localhost:3000/api/nlp-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderPhone: sender,
        input: message,
      }),
    });

    const data = await response.json();
    console.log('NLP Response:', data);

    if (!response.ok) {
      if (data.error) {
        return data.error; // Return error message to user
      }
      return 'Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.';
    }

    // If we have missing information, return the question
    if (data.missing?.length > 0) {
      return data.message || '¿Podrías proporcionar más información?';
    }

    // If the message was scheduled successfully
    if (data.scheduledMessage) {
      return 'Tu mensaje ha sido programado exitosamente.';
    }

    // Default success message
    return data.message || 'Tu mensaje ha sido procesado exitosamente.';
  } catch (error) {
    console.error('Error processing message:', error);
    return 'Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo más tarde.';
  }
} 