// List of whitelisted phone numbers that can use the bot
// Phone numbers should be in international format with country code (e.g., +1234567890)
export const WHITELISTED_NUMBERS = "+56989010221,+56991543054"

// Function to check if a phone number is whitelisted
export function isWhitelisted(phoneNumber: string): boolean {
  console.log({env: process.env.WHITELISTED_NUMBERS})
  console.log({WHITELISTED_NUMBERS})
  return WHITELISTED_NUMBERS.split(',').includes(phoneNumber);
} 