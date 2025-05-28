import { INVALID_VIEW_REQUEST } from '../constants/messages';

interface ViewMessageIntent {
  isViewRequest: boolean;
  isMoreRequest: boolean;
  isValid: boolean;
  error?: string;
}

/**
 * Common Spanish patterns for requesting to view messages
 */
const VIEW_PATTERNS = [
  /ver\s+mensajes/i,
  /mostrar\s+mensajes/i,
  /muéstrame\s+(mis\s+)?mensajes/i,
  /qué\s+mensajes\s+tengo/i,
  /cuáles\s+mensajes\s+tengo/i,
  /mis\s+mensajes/i,
  /mensajes\s+programados/i,
  /ver\s+programados/i,
  /mostrar\s+programados/i,
];

/**
 * Common Spanish patterns for requesting to see more messages
 */
const MORE_PATTERNS = [
  /ver\s+más/i,
  /mostrar\s+más/i,
  /más\s+mensajes/i,
  /siguientes/i,
  /continuar/i,
];

/**
 * Validates if a message string is not empty or just whitespace
 */
function isValidMessageString(message: string): boolean {
  return typeof message === 'string' && message.trim().length > 0;
}

/**
 * Checks if a message contains any invalid characters or patterns
 */
function containsInvalidPatterns(message: string): boolean {
  // Check for potential SQL injection or script patterns
  const invalidPatterns = [
    /select\s+.*\s+from/i,
    /insert\s+into/i,
    /update\s+.*\s+set/i,
    /delete\s+from/i,
    /<script/i,
    /javascript:/i,
    /\{\{.*\}\}/i, // Template injection
  ];

  return invalidPatterns.some(pattern => pattern.test(message));
}

/**
 * Determines if a message is requesting to view scheduled messages
 * Includes validation and error handling
 * @param message The message to analyze
 * @returns Object indicating if it's a valid view request and/or more request
 */
export function parseViewMessageRequest(message: string): ViewMessageIntent {
  // Basic input validation
  if (!isValidMessageString(message)) {
    return {
      isViewRequest: false,
      isMoreRequest: false,
      isValid: false,
      error: INVALID_VIEW_REQUEST
    };
  }

  // Security validation
  if (containsInvalidPatterns(message)) {
    return {
      isViewRequest: false,
      isMoreRequest: false,
      isValid: false,
      error: INVALID_VIEW_REQUEST
    };
  }

  const normalizedMessage = message.toLowerCase().trim();
  
  // Check for view or more patterns
  const isViewRequest = VIEW_PATTERNS.some(pattern => pattern.test(normalizedMessage));
  const isMoreRequest = MORE_PATTERNS.some(pattern => pattern.test(normalizedMessage));

  // A message must match either view or more patterns to be valid
  const isValid = isViewRequest || isMoreRequest;

  return {
    isViewRequest,
    isMoreRequest,
    isValid,
    error: isValid ? undefined : INVALID_VIEW_REQUEST
  };
} 