## Relevant Files

- `src/lib/whatsapp.ts` - To integrate listening for `/schedule` commands from incoming messages and dispatching them.
- `src/lib/whatsapp.test.ts` - Unit tests for WhatsApp message handling related to scheduling.
- `src/lib/scheduler/scheduleCommandHandler.ts` - New file to handle the logic for an incoming `/schedule` command, orchestrating parsing, validation, and scheduling.
- `src/lib/scheduler/scheduleCommandHandler.test.ts` - Unit tests for `scheduleCommandHandler.ts`.
- `src/lib/scheduler/commandParser.ts` - New file to parse the raw `/schedule` command string into its constituent parts (recipient, date/time string, message).
- `src/lib/scheduler/commandParser.test.ts` - Unit tests for `commandParser.ts`.
- `src/lib/scheduler/dateTimeParser.ts` - New file to parse various date/time string formats into a standard UTC timestamp, considering user's local time.
- `src/lib/scheduler/dateTimeParser.test.ts` - Unit tests for `dateTimeParser.ts`.
- `src/lib/scheduler/recipientResolver.ts` - New file to resolve recipient strings (phone numbers or contact names) to a valid WhatsApp ID. Will interact with Baileys for contact lookups.
- `src/lib/scheduler/recipientResolver.test.ts` - Unit tests for `recipientResolver.ts`.
- `src/lib/scheduler/schedulerService.ts` - New file containing the core logic for creating, storing, retrieving, and managing scheduled messages (including pending limit).
- `src/lib/scheduler/schedulerService.test.ts` - Unit tests for `schedulerService.ts`.
- `src/lib/db/prisma/schema.prisma` (or equivalent if using another ORM/DB client) - To define the `ScheduledMessage` table schema.
- `src/lib/db/prisma/migrations/` - Directory for database migration files.
- `src/jobs/messageSenderJob.ts` - New file for the cron job/background worker that polls for due messages and triggers sending.
- `src/jobs/messageSenderJob.test.ts` - Unit tests for `messageSenderJob.ts`.
- `src/utils/messageFormatter.ts` - New or existing utility to format confirmation, error, and clarification messages sent to the user.
- `src/utils/messageFormatter.test.ts` - Unit tests for `messageFormatter.ts`.

### Notes

- **Prerequisite Check:** Before starting any task or sub-task, check if it has already been completed or if existing code within the project can be reused or adapted to fulfill the requirement. This avoids redundant work.
- **Incremental Development:** Implement and test functionalities incrementally. For example, get basic command parsing working before tackling complex date/time logic.
- **Error Handling:** Robust error handling is crucial. Ensure all user-facing errors are sent back via WhatsApp in Spanish, as specified in the PRD.
- **Database Choice:** The PRD mentions SQLite or PostgreSQL. Assume Prisma ORM for schema and migrations unless specified otherwise. Adapt if using a different DB/ORM.
- **Configuration:** Store cron schedules, message limits, etc., in a configurable way if possible (e.g., environment variables).
- **Baileys Interaction:** All interactions with the Baileys library (sending messages, fetching contacts) should be encapsulated, preferably within dedicated services/utility functions for better testability and maintainability.
- **Testing:**
    - Unit tests should be created for all new services, parsers, and handlers.
    - Consider integration tests for the end-to-end flow of a command being received, processed, stored, and a message being sent back.
    - Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Setup Core Infrastructure and Initial Command Handling
  - [x] 1.1 Define `ScheduledMessage` schema in `schema.prisma` (jobId, userId, recipientIdentifier, originalRecipientString, messageContent, scheduledTimestampUTC, originalUserDateTimeString, userTimeZoneOffset, status, createdAt).
  - [x] 1.2 Generate and apply initial database migration for `ScheduledMessage` table.
  - [x] 1.3 Create `src/lib/scheduler/commandParser.ts` to parse the raw `/schedule` command string into recipient, dateTimeString, and messageContent arguments.
    - [x] 1.3.1 Implement logic to extract `<recipient>`, `<date_time_string>`, and `<message_content>` based on PRD (FR2). Handle quoted and unquoted recipients.
    - [x] 1.3.2 Write unit tests for `commandParser.ts` covering valid and invalid command structures.
  - [x] 1.4 Modify `src/lib/whatsapp.ts` (or create a new handler) to listen for incoming messages.
    - [x] 1.4.1 If a message starts with `/schedule`, pass it to `scheduleCommandHandler.ts`.
    - [x] 1.4.2 If a message does not start with `/schedule`, ignore it (FR4, FR12).
  - [x] 1.5 Create `src/lib/scheduler/scheduleCommandHandler.ts` as the main orchestrator for the `/schedule` command.
    - [x] 1.5.1 Implement initial parameter validation (FR3.1, FR3.2): check for missing parts (recipient, date, message) and basic formatting (e.g., quotes).
    - [x] 1.5.2 Send immediate error messages via WhatsApp if basic validation fails (using a placeholder sender for now).

- [x] 2.0 Implement Date/Time Parsing and Recipient Resolution Logic
  - [x] 2.1 Create `src/lib/scheduler/dateTimeParser.ts`.
    - [x] 2.1.1 Implement parsing for specific date and time: `"YYYY-MM-DD HH:MM"` (FR5.2).
    - [x] 2.1.2 Implement parsing for time for today/tomorrow: `"HH:MM"` (FR5.2).
    - [x] 2.1.3 Implement parsing for relative time tomorrow: `"mañana HH:MM"` (FR5.2).
    - [x] 2.1.4 Implement parsing for relative time next weekday: `"próximo <día de la semana> HH:MM"` (FR5.2). Ensure Spanish keywords are handled.
    - [x] 2.1.5 All parsing should consider the user's local device time (from incoming message metadata) and convert to UTC (FR5.1).
    - [x] 2.1.6 Implement logic to ask for clarification if date/time is ambiguous or unparseable (FR5.3).
    - [x] 2.1.7 Write unit tests for `dateTimeParser.ts` covering all supported formats, edge cases (e.g., "próximo viernes" when today is Friday), and ambiguity.
  - [x] 2.2 Create `src/lib/scheduler/recipientResolver.ts`.
    - [x] 2.2.1 Implement phone number validation (basic international format, e.g., starts with `+`) (FR7.1).
    - [x] 2.2.2 Write unit tests for `recipientResolver.ts` (may require mocking Baileys interactions).
  - [x] 2.3 Integrate `dateTimeParser` into `scheduleCommandHandler.ts`.

- [x] 3.0 Develop Message Scheduling Core Logic and Storage
  - [x] 3.1 Create `src/lib/scheduler/schedulerService.ts`.
    - [x] 3.1.1 Implement `createScheduledMessage` function to save a validated and processed schedule request to the database (FR9.1).
        - [x] 3.1.1.1 Ensure all required fields are populated.
        - [x] 3.1.1.2 Set initial status to `PENDING`.
    - [x] 3.1.2 Implement `countPendingMessages(userId)` function.
    - [x] 3.1.3 Implement pending message limit check (FR10.1, FR10.2) before creating a new message.
    - [x] 3.1.4 Implement `getDueMessages()` function to fetch PENDING messages whose `scheduledTimestampUTC` is past or current.
    - [x] 3.1.5 Implement `updateMessageStatus(jobId, status)` function.
    - [x] 3.1.6 Write unit tests for `schedulerService.ts` covering message creation, retrieval, status updates, and limit checks.
  - [x] 3.2 Integrate `schedulerService.ts` into `scheduleCommandHandler.ts`.
    - [x] 3.2.1 After successful parsing and resolution, check pending message limit.
    - [x] 3.2.2 If limit not reached, call `createScheduledMessage`.
    - [x] 3.2.3 Send appropriate confirmation or error messages (e.g., limit reached).

- [x] 4.0 Implement Background Message Sending Service
  - [x] 4.1 Create `src/jobs/messageSenderJob.ts`.
    - [x] 4.1.1 Setup a vercel cron job to run this job periodically (e.g., every minute) (FR11.1).
    - [x] 4.1.2 In the job, call `schedulerService.getDueMessages()`.
    - [x] 4.1.3 For each due message, attempt to send it using Baileys (FR11.2).
        - [x] 4.1.3.1 Ensure the correct recipient WhatsApp ID and message content are used.
    - [x] 4.1.4 If sending is successful, update message status to `SENT` using `schedulerService.updateMessageStatus` (FR11.3).
    - [x] 4.1.5 If sending fails, update message status to `FAILED_TO_SEND` (FR11.4).
    - [x] 4.1.6 Add logging for job execution, messages processed, successes, and failures.
  - [x] 4.2 Write unit tests for `messageSenderJob.ts` (mocking `schedulerService` and Baileys calls).
  - [x] 4.3 Configure the cron job to run in the deployment environment.

- [x] 5.0 Integrate WhatsApp Communication for Commands and Feedback
  - [x] 5.1 Create `src/utils/messageFormatter.ts` (or enhance existing).
    - [x] 5.1.1 Implement functions to generate standardized success, error, and clarification messages in Spanish, using specified emojis (FR8.1, Design Considerations).
    - [x] 5.1.2 Ensure messages for missing parameters, invalid formats, contact issues, date ambiguity, limit reached, and success confirmations are covered.
    - [x] 5.1.3 Write unit tests for `messageFormatter.ts`.
  - [ ] 5.2 Create a utility/service (e.g., `src/utils/whatsappSender.ts`) to encapsulate sending messages via Baileys to the user.
    - [ ] 5.2.1 This utility will take the user's WhatsApp ID and the message string.
  - [x] 5.3 Replace placeholder message sending in `scheduleCommandHandler.ts` with calls to `whatsappSender.ts` using formatted messages from `messageFormatter.ts`.
  - [x] 5.4 Ensure all user-facing feedback points identified in Functional Requirements (FR3.1, FR5.3, FR6.3, FR6.4, FR7.1, FR8.1, FR10.2) are implemented.
  - [ ] 5.5 Perform end-to-end testing by sending actual `/schedule` commands via WhatsApp and verifying behavior and responses. 