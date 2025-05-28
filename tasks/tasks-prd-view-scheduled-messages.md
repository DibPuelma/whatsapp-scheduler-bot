## Relevant Files

- `src/lib/baileys/handlers/message.ts` - Main message handler where we'll add the view messages functionality
- `src/lib/baileys/handlers/viewMessages.ts` - New handler for viewing scheduled messages functionality
- `src/utils/dateParser.ts` - Natural language processing utilities for message queries
- `src/utils/messageViewParser.ts` - NLP patterns and functions for view message requests
- `src/utils/__tests__/messageViewParser.test.ts` - Unit tests for message view parser
- `src/constants/messages.ts` - Constants for response messages in Spanish
- `prisma/schema.prisma` - Database schema with optimized indexes for message viewing
- `src/lib/prisma.ts` - Prisma client utilities for database queries
- `src/lib/queries/messages.ts` - Functions for querying and paginating scheduled messages
- `src/types/messages.ts` - Type definitions for message viewing responses
- `prisma/migrations/20240327_add_message_viewing_indexes.sql` - Database migration for message viewing indexes

### Notes

- Ensure all new code follows the existing project structure and patterns
- All user-facing messages should be in Spanish
- Natural language processing should be consistent with existing scheduling functionality
- Consider implementing unit tests for the new functionality

## Tasks

- [x] 1.0 Set up Database and Models for Message Viewing
  - [x] 1.1 Review existing schema in prisma/schema.prisma
  - [x] 1.2 Add pagination-related fields if needed (e.g., lastViewedPage)
  - [x] 1.3 Create database query functions in src/lib/prisma.ts for:
    - Fetching pending messages by sender phone
    - Implementing pagination with limit and offset
    - Ordering by scheduled date
  - [x] 1.4 Add type definitions for message viewing responses
  - [x] 1.5 Create database indexes for optimized queries

- [x] 2.0 Implement Natural Language Processing for View Queries
  - [x] 2.1 Add view-related patterns to existing NLP system
  - [x] 2.2 Create function to detect "view messages" intent
  - [x] 2.3 Add patterns for "ver más" (see more) requests
  - [x] 2.4 Add Spanish language constants for view-related queries
  - [x] 2.5 Implement validation for view message requests
  - [x] 2.6 Add unit tests for NLP functions

- [x] 3.0 Create Message Viewing Handler
  - [x] 3.1 Create new viewMessages.ts handler file
  - [x] 3.2 Implement main handler function for viewing messages
  - [x] 3.3 Add sender phone validation and verification
  - [x] 3.4 Integrate with database query functions
  - [x] 3.5 Add error handling for database operations
  - [x] 3.6 Implement message count tracking
  - [x] 3.7 Add unit tests for the handler

- [x] 4.0 Implement Pagination System
  - [x] 4.1 Create pagination utility functions
  - [x] 4.2 Implement "ver más" message detection
  - [x] 4.3 Add session management for tracking pagination state
  - [x] 4.4 Create function to calculate remaining messages
  - [x] 4.5 Implement pagination response formatting
  - [x] 4.6 Add validation for pagination requests
  - [x] 4.7 Add unit tests for pagination functions

- [x] 5.0 Add Response Formatting and Error Handling
  - [x] 5.1 Create message formatting templates in Spanish
  - [x] 5.2 Add constants for all response messages
  - [x] 5.3 Implement message formatting function with emojis
  - [x] 5.4 Add error message templates
  - [x] 5.5 Create handler for empty results
  - [x] 5.6 Implement "no more messages" response
  - [x] 5.7 Add validation for formatted messages
  - [x] 5.8 Add unit tests for formatting functions 