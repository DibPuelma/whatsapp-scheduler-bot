/**
 * Response format for a single scheduled message
 */
export interface FormattedScheduledMessage {
  date: string;      // Formatted date in Spanish
  recipient: string; // Phone number with + prefix
  content: string;   // Message content
}

/**
 * Response format for the message viewing feature
 */
export interface MessageViewResponse {
  messages: FormattedScheduledMessage[];
  remainingCount: number;  // Number of messages not shown
  hasMore: boolean;       // Whether there are more messages to show
  header: string;
  footer?: string;
}

/**
 * Different types of responses the bot can give for message viewing
 * Using discriminated union types for better type safety
 */
interface MessageViewError {
  type: 'ERROR';
  error: string;
}

interface NoMessagesResponse {
  type: 'NO_MESSAGES';
}

interface NoMoreMessagesResponse {
  type: 'NO_MORE_MESSAGES';
}

interface ShowMessagesResponse {
  type: 'SHOW_MESSAGES';
  data: MessageViewResponse;
}

/**
 * Complete response type for message viewing interactions
 */
export type MessageViewResult = 
  | MessageViewError 
  | NoMessagesResponse 
  | NoMoreMessagesResponse 
  | ShowMessagesResponse; 