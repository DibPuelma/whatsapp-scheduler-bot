# Test Fixes PRD

## Introduction/Overview
This document outlines the requirements for fixing failing tests in the WhatsApp Scheduler Bot codebase. The goal is to maintain the existing functionality while ensuring tests properly validate the expected behavior. No logic changes are required; only test adjustments are needed.

## Goals
1. Fix failing timezone-related tests while maintaining current timezone behavior
2. Improve WhatsApp sender tests with proper mocking and error handling
3. Update view messages tests to match current error message format
4. Fix schedule command handler tests to properly validate limit reached behavior
5. Maintain test coverage without modifying core business logic

## User Stories
- As a developer, I want reliable test results so that I can be confident in the codebase's functionality
- As a developer, I want tests that accurately reflect the expected behavior so that I can catch real issues
- As a maintainer, I want consistent test behavior so that I can trust the test suite

## Functional Requirements

### 1. DateTime Parser Tests
1. Keep existing timezone handling logic
2. Update test assertions to match current timezone behavior:
   - Fix `should parse midnight using 24:00` to expect `00:00`
   - Update timezone offset calculations in `should correctly convert local time to UTC`
   - Adjust `should handle midnight correctly across timezone boundaries`

### 2. WhatsApp Sender Tests
1. Implement proper mocking for WhatsApp API:
   - Mock `sendMessage` function consistently
   - Add retry mechanism mocks
2. Update error handling tests:
   - Add test cases for network errors
   - Add test cases for API errors
   - Add test cases for retry mechanism
3. Remove direct API calls in tests
4. Update error message assertions to match current format

### 3. View Messages Tests
1. Update error message assertions to match current implementation:
   - Update `DATABASE_CONNECTION_ERROR` test
   - Update `DATABASE_QUERY_ERROR` test
   - Update `ERROR_FETCHING_MESSAGES` test
2. Keep existing error handling logic
3. Update test descriptions to match new assertions

### 4. Schedule Command Handler Tests
1. Update test "should handle a correct schedule command with phone number" to properly test the limit reached scenario
2. Verify that the test fails when the limit is reached
3. Keep existing limit handling logic
4. Update test descriptions to clearly indicate expected behavior

### 5. Message Sender Job Tests
No changes required as these tests are passing correctly.

## Non-Goals (Out of Scope)
1. Modifying any business logic
2. Changing timezone handling behavior
3. Modifying error message content
4. Changing API retry mechanism
5. Adding new test cases for untested scenarios

## Technical Considerations
1. Use Jest's mock functions consistently across all test files
2. Maintain existing test structure and organization
3. Keep test descriptions clear and descriptive
4. Ensure all tests are deterministic

## Success Metrics
1. All tests pass consistently
2. No changes to core functionality
3. Test coverage remains at current levels or improves
4. Tests run in a reasonable time
5. No flaky tests

## Open Questions
1. Should we add more test cases for edge cases in timezone handling?
2. Do we need to improve test documentation?
3. Should we add more specific test cases for API retry scenarios? 