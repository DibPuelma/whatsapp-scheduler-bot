# Product Requirements Document: /schedule Command

## 1. Introduction/Overview

This document outlines the requirements for the `/schedule` command, a feature for the WhatsApp Scheduler Bot. Busy professionals often need to send WhatsApp messages at optimal times or on specific dates but may be unavailable to do so manually. The `/schedule` command allows users to draft messages and have them automatically sent from their WhatsApp account to a specified recipient at a future date and time.

The primary goal of this feature is to enable users to reliably schedule WhatsApp messages for future delivery, ensuring timely communication even when they are otherwise engaged. Users will interact with this feature by sending a command to their own WhatsApp number (where the bot is running).

## 2. Goals

*   Allow users to schedule messages to specific phone numbers for a future date and time.
*   Allow users to schedule messages to their saved WhatsApp contacts by providing a contact name.
*   Provide clear, concise, and immediate feedback to the user upon successful scheduling of a message.
*   Provide clear, concise, and immediate error messages if the `/schedule` command is incomplete, malformed, or encounters an issue (e.g., contact not found).
*   Ensure messages are delivered accurately at the scheduled time, interpreting time inputs relative to the user's local time when the command was issued.
*   Limit the number of pending scheduled messages per user to 10.

## 3. User Stories

*   "As a busy professional, I want to schedule a message to a phone number for a specific future date and time (e.g., '2024-12-25 10:30') so that I don't forget to send it and it arrives when it's most relevant."
*   "As a busy professional, I want to schedule a message to a saved WhatsApp contact by name (e.g., 'Juan Pérez') for a relative time (e.g., 'mañana 9:00') so that I can communicate efficiently without needing to look up their phone number."
*   "As a busy professional, I want to receive an immediate error message (e.g., ⚠️ 'Recipient missing. Please specify a phone number or contact name.') if my `/schedule` command is incomplete or incorrect, so I can fix it quickly and ensure my message is scheduled properly."
*   "As a busy professional, if I try to schedule a message to a contact name that is ambiguous (e.g., multiple 'Juan Pérez' entries) or not found, I want the bot to inform me immediately so I can provide a correct recipient."

## 4. Functional Requirements

1.  **Command Initiation:** The system must accept a `/schedule` command via a WhatsApp message sent by the user to their own number (where the bot is hosted).
2.  **Command Structure:** The command must follow the format: `/schedule <recipient> "<date_time_string>" "<message_content>"`
    *   `<recipient>`: Can be an international phone number (e.g., `+1234567890`) or a contact name. If the contact name contains spaces, it *must* be enclosed in double quotes (e.g., `"Juan Pérez"`).
    *   `<date_time_string>`: Must be enclosed in double quotes.
    *   `<message_content>`: Must be enclosed in double quotes.
3.  **Parameter Validation:**
    *   FR3.1: If `recipient`, `date_time_string`, or `message_content` is missing, the system must send an immediate WhatsApp message to the user detailing the error (e.g., "⚠️ Missing message. Please provide message content.").
    *   FR3.2: If any parameter is improperly formatted (e.g., quotes missing where required), the system must notify the user.
4.  **Message Ignoring:** Any message received by the bot that does not start with `/schedule` must be ignored and not processed as a command.
5.  **Date/Time Parsing:**
    *   FR5.1: The system must interpret `date_time_string` based on the user's local device time at the moment the command is received. This timestamp should be available from the incoming message metadata.
    *   FR5.2: Supported formats for `<date_time_string>`:
        *   Specific date and time: `"YYYY-MM-DD HH:MM"` (e.g., `"2024-12-25 10:30"`)
        *   Time for today: `"HH:MM"` (e.g., `"18:00"`). Schedules for today if the time is in the future, otherwise for tomorrow at that time.
        *   Relative time for tomorrow: `"mañana HH:MM"` (e.g., `"mañana 9:00"`)
        *   Relative time for next weekday: `"próximo <día de la semana> HH:MM"` (e.g., `"próximo viernes 9:00"`). If today is Friday, "próximo viernes" means Friday of the following week. The Spanish keywords "mañana" and "próximo" must be supported.
    *   FR5.3: If the `date_time_string` is ambiguous or unparseable after attempting the known formats, the system must send a message to the user asking for clarification (e.g., "⚠️ Unclear date/time. Please use YYYY-MM-DD HH:MM, HH:MM, mañana HH:MM, or próximo <día> HH:MM.").
6.  **Recipient Handling (Contact Name):**
    *   FR6.1: If `<recipient>` is a quoted string (potential contact name), the system must search the user's connected WhatsApp contacts for a case-insensitive match.
    *   FR6.2: If a unique contact is found, the message is scheduled for that contact's phone number.
    *   FR6.3: If multiple contacts match the name, the system must send a message to the user (e.g., "⚠️ Multiple contacts found for 'Juan Pérez'. Please be more specific or use their phone number.").
    *   FR6.4: If the contact name is not found, the system must send a message to the user (e.g., "⚠️ Contact 'Juan Pérez' not found. Please check the name or use a phone number.").
7.  **Recipient Handling (Phone Number):**
    *   FR7.1: If `<recipient>` is a phone number, it should be validated for a basic international format (e.g., starts with `+` followed by digits). If invalid, notify the user (e.g., "⚠️ Invalid phone number format. Please use +1234567890.").
8.  **Scheduling Confirmation:**
    *   FR8.1: Upon successful validation and processing, the system must send an immediate confirmation message to the user (e.g., "✅ Message scheduled for <RecipientName/PhoneNumber> on <Day>, <Date> <Month> <Year> at <Time> <AM/PM>. Message: \"<First 50 chars of message>...\"").
9.  **Message Storage:**
    *   FR9.1: Scheduled messages must be stored persistently. Required fields:
        *   `jobId` (unique identifier for the scheduled job)
        *   `userId` (WhatsApp ID of the user who scheduled the message)
        *   `recipientIdentifier` (resolved phone number)
        *   `originalRecipientString` (the exact recipient string user provided)
        *   `messageContent` (full text of the message)
        *   `scheduledTimestampUTC` (resolved date and time in UTC)
        *   `originalUserDateTimeString` (the exact date/time string user provided)
        *   `userTimeZoneOffset` (optional, if captured, for future reference or potential display adjustments)
        *   `status` (e.g., PENDING, SENT, FAILED_TO_SEND, CANCELLED)
        *   `createdAt` (timestamp of when the job was created)
10. **Pending Message Limit:**
    *   FR10.1: A user can have a maximum of 10 messages in PENDING status.
    *   FR10.2: If a user attempts to schedule an 11th message while 10 are PENDING, the system must send an error message (e.g., "⚠️ You have reached the maximum of 10 pending messages. Please wait for some to be sent or manage your existing schedule.").
11. **Message Sending:**
    *   FR11.1: A cron job (or similar background scheduler) must run periodically (e.g., every minute) to check for PENDING messages whose `scheduledTimestampUTC` is due.
    *   FR11.2: For each due message, the system will attempt to send it via the Baileys WhatsApp connection.
    *   FR11.3: Upon successful sending, the message's `status` in storage must be updated to SENT.
    *   FR11.4: If sending fails (e.g., Baileys throws an error), the `status` should be updated to FAILED_TO_SEND. (Detailed retry logic is out of scope for this PRD version).
12. **Message Ignoring (Reiteration):** Any message sent to the bot's number that does not start with `/schedule` must be ignored and not trigger any command processing logic.

## 5. Non-Goals (Out of Scope)

*   **Recurring Messages:** Functionality like `/schedule +1234567890 "cada lunes 9:00"` is not part of this PRD.
*   **Editing/Deleting Scheduled Messages:** Users will not be able to modify or cancel a message once it has been successfully scheduled in this version.
*   **Advanced Time Zone Management:** The system will rely on the incoming message timestamp to infer the user's local time context for parsing. No complex timezone selection or conversion beyond storing in UTC.
*   **Scheduling Limits (Advance Time):** No specific limits on how far into the future a message can be scheduled.
*   **Advanced Send Failure Retries:** Automatic retries or complex error handling for messages that fail to send (beyond marking as FAILED_TO_SEND) are out of scope.
*   **Contact Name Parsing without Quotes:** Contact names containing spaces must be enclosed in double quotes. The system will not attempt to parse multi-word contact names without quotes.
*   **Listing Scheduled Messages:** A command like `/list` to see pending messages is out of scope for this PRD.

## 6. Design Considerations

*   **Feedback Messages:**
    *   Confirmations, errors, and clarification prompts should be concise and clear.
    *   Use appropriate and formal emojis to indicate status:
        *   ✅: Success (e.g., message scheduled)
        *   ⚠️: Warning, clarification needed, or minor error (e.g., contact not found, ambiguous date)
        *   ❌: Critical error (e.g., command malformed, limit reached)
*   **Language:** All user-facing messages from the bot related to this command should be in Spanish, consistent with other examples provided.

## 7. Technical Considerations

*   **Scheduling Mechanism:** A cron job is the preferred method for checking and sending due messages.
*   **Persistence:** A database (e.g., SQLite, PostgreSQL) is required to store the scheduled message details.
*   **Contact Access:** The system will need to utilize the Baileys library's capabilities to access and search the user's WhatsApp contacts when a name is provided.
*   **Date/Time Library:** A robust date/time manipulation library (e.g., `date-fns`, `Day.js`, or `Luxon`) is highly recommended for parsing user input, handling time calculations, and converting to UTC.
*   **State Management:** Ensure that interactions are stateless where possible from the command processing perspective, relying on the database for persistence of scheduled jobs.
*   **Error Handling:** Implement try-catch blocks for operations like API calls (sending messages), database interactions, and contact lookups.

## 8. Success Metrics

*   **Delivery Accuracy:** >=99% of messages are delivered within +/- 1 minute of their `scheduledTimestampUTC`.
*   **Scheduling Success Rate:** >=95% of valid `/schedule` command attempts result in a successfully scheduled message (i.e., user does not encounter unexpected errors).
*   **Error Message Clarity:** Reduction in repeated user errors for the same command format issues after an initial learning period.
*   **User Uptake:** Number of unique users utilizing the `/schedule` command.
*   **Messages Scheduled:** Total number of messages successfully scheduled and sent via the feature.

## 9. Open Questions

*   **User's Local Time Source:** It's assumed the user's local time context will be derived from the timestamp of the incoming WhatsApp message containing the `/schedule` command. This needs confirmation if Baileys provides reliable message timestamps.
*   **Definition of "Pending" for Limit:** For the 10-message limit, "pending" refers to messages with the status PENDING. Once a message is SENT or FAILED_TO_SEND, it no longer counts towards this limit.
*   **Contact List Access:** Confirm that the Baileys session has the necessary permissions and methods to query the user's contact list by name.

---
This PRD provides the foundation for implementing the `/schedule` command. Further technical details may emerge during development. 