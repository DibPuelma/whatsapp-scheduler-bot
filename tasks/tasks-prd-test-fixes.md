# Tasks for Test Fixes

## Relevant Files

- `src/lib/scheduler/dateTimeParser.test.ts` - Contains timezone-related test cases that need fixing
- `src/utils/whatsappSender.test.ts` - WhatsApp API mocking and error handling tests
- `src/lib/baileys/handlers/__tests__/viewMessages.test.ts` - Database error message assertion tests
- `src/lib/scheduler/scheduleCommandHandler.test.ts` - Limit reached scenario test
- `src/jobs/messageSenderJob.test.ts` - Currently passing tests, included for reference
- `src/lib/scheduler/validation.test.ts` - Related validation tests
- `src/utils/messageFormatter.test.ts` - Error message formatting tests
- `src/lib/scheduler/recipientResolver.test.ts` - Related recipient resolution tests
- `src/lib/scheduler/commandParser.test.ts` - Command parsing tests

### Notes

- Tests are located alongside their implementation files
- Do not modify any logic, only tests
- Use `npm test` to run all tests
- Use `npm test [path/to/test/file]` to run specific test files
- Jest is configured to watch for changes with `npm run test:watch`

## Tasks

- [ ] 1.0 Fix DateTime Parser Tests
  - [x] 1.1 Update `should parse midnight using 24:00` test to expect `00:00` instead of `24:00`
  - [x] 1.2 Fix timezone offset calculation in `should correctly convert local time to UTC` test
  - [x] 1.3 Update `should handle midnight correctly across timezone boundaries` test to match current implementation (UTC-4)
  - [x] 1.4 Fix `should handle 12:00 as noon` test to match current implementation (UTC-4)
  - [x] 1.5 Fix `should handle 12:30 as after noon` test to match current implementation (UTC-4)
  - [x] 1.6 Update `should handle negative hour: mañana -1:00` test to properly validate error case
  - [x] 1.7 Run tests and verify all timezone-related tests pass

- [x] 2.0 Improve WhatsApp Sender Tests
  - [x] 2.1 Set up consistent mocking for WhatsApp API calls
  - [x] 2.2 Update `sendMessage` mock implementation to handle retry scenarios
  - [x] 2.3 Fix `should send a message successfully` test to properly mock API response
  - [x] 2.4 Update `should handle send failures` test to match current error format
  - [x] 2.5 Fix `sendResponseToUser` tests to properly mock message sending
  - [x] 2.6 Add proper error handling assertions for network errors
  - [x] 2.7 Run tests and verify all WhatsApp sender tests pass

- [x] 3.0 Update View Messages Tests
  - [x] 3.1 Update `DATABASE_CONNECTION_ERROR` test assertion to match current error message
  - [x] 3.2 Update `DATABASE_QUERY_ERROR` test assertion to match current error message
  - [x] 3.3 Update `ERROR_FETCHING_MESSAGES` test assertion to match current error message
  - [x] 3.4 Fix `should normalize phone numbers by adding + prefix` test
  - [x] 3.5 Run tests and verify all view messages tests pass

- [x] 4.0 Fix Schedule Command Handler Tests
  - [x] 4.1 Review current limit reached behavior in implementation
  - [x] 4.2 Update test setup to properly trigger limit reached scenario
  - [x] 4.3 Fix `should handle a correct schedule command with phone number` test
  - [x] 4.4 Verify test fails when limit is reached
  - [x] 4.5 Update test description to clearly indicate limit reached scenario
  - [x] 4.6 Run tests and verify schedule command handler tests behave correctly

- [x] 5.0 Verify Message Sender Job Tests
  - [x] 5.1 Run message sender job tests to confirm they pass
  - [x] 5.2 Document current test behavior for reference
  - [x] 5.3 No changes needed as tests are passing correctly 