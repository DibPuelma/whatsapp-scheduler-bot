// List of whitelisted phone numbers that can use the bot
// Phone numbers should be in international format with country code (e.g., +1234567890)
export const WHITELISTED_NUMBERS = "+56989010221"

// Function to check if a phone number is whitelisted (for receiving messages/basic bot interaction)
export function isWhitelisted(phoneNumber: string): boolean {
  return WHITELISTED_NUMBERS.split(',').includes(phoneNumber);
} 