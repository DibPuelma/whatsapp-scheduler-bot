# Message Sender Job Test Documentation

## Overview

The message sender job is responsible for processing scheduled messages that are due to be sent. The job:
1. Fetches due messages from the database
2. Sends each message via the bot API
3. Updates the message status based on the send result

## Test Cases

### 1. Handle No Due Messages

This test verifies that the job handles the case when there are no messages due for sending:
- Mocks `getDueMessages` to return an empty array
- Verifies that no messages are sent
- Verifies that the appropriate log message is recorded

### 2. Process Due Messages Successfully

This test verifies that the job can successfully process multiple due messages:
- Mocks `getDueMessages` to return two test messages
- Mocks the bot API (fetch) to return success responses
- Verifies that:
  - Both messages are sent via the bot API with correct parameters
  - Message statuses are updated to 'SENT'
  - Appropriate log messages are recorded

### 3. Handle Message Sending Failures

This test verifies that the job properly handles message sending failures:
- Mocks `getDueMessages` to return one test message
- Mocks the bot API (fetch) to throw an error
- Verifies that:
  - The message status is updated to 'FAILED_TO_SEND'
  - The error is properly logged
  - The job continues processing (doesn't crash)

### 4. Handle getDueMessages Failure

This test verifies that the job properly handles database errors:
- Mocks `getDueMessages` to throw an error
- Verifies that:
  - The error is properly logged
  - The error is propagated (to notify the cron job system)

## Dependencies

The test suite mocks the following dependencies:
- `schedulerService.ts`: For database operations (`getDueMessages` and `updateMessageStatus`)
- `logger.ts`: For logging operations
- `fetch`: For bot API calls

## Test Setup

Each test:
1. Clears all mocks before running
2. Sets up specific mock implementations for the test scenario
3. Runs the job
4. Verifies the expected behavior through assertions

## Error Handling

The test suite verifies that the job:
1. Properly handles API errors without crashing
2. Updates message status appropriately on failures
3. Logs errors with sufficient detail for debugging
4. Propagates critical errors when appropriate

## Logging

The test suite verifies that the job:
1. Logs the start of message processing
2. Logs when no messages are found
3. Logs successful message sends
4. Logs message send failures with error details
5. Logs completion of message processing 