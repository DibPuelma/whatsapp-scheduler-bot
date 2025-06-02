## Relevant Files

- `src/components/features/whatsapp-linking/QRCodeDisplay.tsx` - Frontend component to display the QR code, instructions, and handle loading/error states.
- `src/components/features/whatsapp-linking/QRCodeDisplay.test.tsx` - Unit tests for `QRCodeDisplay.tsx`.
- `src/components/features/whatsapp-linking/PostLinkGuide.tsx` - Frontend component to show success message and bot command guide after successful linking.
- `src/components/features/whatsapp-linking/PostLinkGuide.test.tsx` - Unit tests for `PostLinkGuide.tsx`.
- `src/pages/link-whatsapp.tsx` - Main page for the QR code linking feature, integrating the `QRCodeDisplay` and `PostLinkGuide` components.
- `src/pages/link-whatsapp.test.tsx` - Unit tests for `link-whatsapp.tsx`.
- `src/server/api/routers/whatsapp.ts` - Backend API routes for handling QR code generation requests, WhatsApp webhook events (for connection status), and storing user linking information.
- `src/server/api/routers/whatsapp.test.ts` - Unit tests for `whatsapp.ts` API routes.
- `src/server/services/whatsappService.ts` - Backend service to interact with the WhatsApp API/library (e.g., Baileys, Twilio) for QR code generation, session management, and receiving webhook events.
- `src/server/services/whatsappService.test.ts` - Unit tests for `whatsappService.ts`.
- `src/db/schema.ts` - Database schema definition, potentially including a table to store user WhatsApp linking information (e.g., user ID, WhatsApp phone number).
- `src/styles/whatsapp-linking.css` - Specific styles for the WhatsApp linking page, adhering to the formal but playful color palette.

### Notes

- Selected Baileys library as the WhatsApp API provider due to its open-source nature, QR code support, and direct WebSocket connection capabilities.
- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory) or in a relevant `__tests__` subdirectory.
- Use a testing framework like Jest with React Testing Library for frontend components and appropriate tools for backend testing.
- To run tests: `npx jest [optional/path/to/test/file]`. Running without a path executes all tests found by the Jest configuration.
- Ensure all interactions with the WhatsApp API/library are well-encapsulated within `whatsappService.ts` for better maintainability and testability.

## Tasks

- [ ] 1.0 Setup Core WhatsApp Integration and QR Generation Backend
  - [x] 1.1 Research and select a WhatsApp Business API provider or library (e.g., Baileys, Twilio API for WhatsApp, Meta Official API).
  - [x] 1.2 Configure the chosen WhatsApp API/library with necessary credentials and settings.
  - [x] 1.3 Implement backend endpoint (`/api/whatsapp/qr-code`) to request a new QR code from the WhatsApp service.
  - [x] 1.4 Implement logic in `whatsappService.ts` to generate/retrieve QR codes for linking.
  - [x] 1.5 Implement backend endpoint or webhook listener (`/api/whatsapp/webhook`) to receive connection status updates from the WhatsApp service (e.g., successful link, disconnect).
  - [x] 1.6 Define database schema for storing user-WhatsApp link information (e.g., user ID, WhatsApp phone number, connection status).
  - [ ] 1.7 Write unit tests for QR code generation and webhook handling logic.

- [ ] 2.0 Develop Frontend UI for QR Code Display, Instructions, and Post-Linking State
  - [ ] 2.1 Create `QRCodeDisplay.tsx` component.
    - [ ] 2.1.1 Implement UI to display the QR code image fetched from the backend.
    - [ ] 2.1.2 Display step-by-step instructions for scanning (similar to WhatsApp Web design).
    - [ ] 2.1.3 Implement skeleton loading state for the QR code area while data is being fetched or QR is refreshing.
    - [ ] 2.1.4 Style the component using the defined formal but playful color palette (refer to `whatsapp-linking.css` or styled components).
  - [ ] 2.2 Create `PostLinkGuide.tsx` component.
    - [ ] 2.2.1 Display a success message (e.g., "Account connected successfully!").
    - [ ] 2.2.2 Display a quick guide with example bot commands.
  - [ ] 2.3 Develop the main page `link-whatsapp.tsx`.
    - [ ] 2.3.1 Integrate `QRCodeDisplay.tsx` to show initially.
    - [ ] 2.3.2 Implement logic to periodically call the backend for a new QR code or handle automatic refresh signals (e.g., via WebSockets or polling if QR expires).
    - [ ] 2.3.3 On successful link (detected via webhook update or other means), switch the view to display `PostLinkGuide.tsx`.
  - [ ] 2.4 Implement responsive design for desktop browsers.
  - [ ] 2.5 Write unit tests for `QRCodeDisplay.tsx` and `PostLinkGuide.tsx` components, and integration tests for `link-whatsapp.tsx` page.

- [ ] 3.0 Implement Account Linking Logic and User Data Management
  - [ ] 3.1 When the backend receives a "successful link" event via the webhook:
    - [ ] 3.1.1 Extract the user's WhatsApp phone number.
    - [ ] 3.1.2 Securely store the user's phone number and linked status in the database (associating with a user account if applicable, or using the phone number as a primary key for bot interactions).
    - [ ] 3.1.3 Implement logic to handle cases where a user might try to link an already linked number (confirm connection, update status if necessary).
  - [ ] 3.2 Ensure only one active WhatsApp connection per user account/session is maintained as per requirements.
  - [ ] 3.3 Implement backend logic to notify the frontend about the successful link (e.g., via WebSockets, or frontend polling a status endpoint) so the UI can update.
  - [ ] 3.4 Write unit tests for account linking and data storage logic.

- [ ] 4.0 Ensure Comprehensive Error Handling and UI/UX Polish
  - [ ] 4.1 Implement frontend error display in `QRCodeDisplay.tsx` for issues like:
    - [ ] 4.1.1 Failure to fetch QR code from backend.
    - [ ] 4.1.2 Network interruption during QR display or refresh.
  - [ ] 4.2 Implement backend error handling for:
    - [ ] 4.2.1 Errors from the WhatsApp API/library during QR generation or session management.
    - [ ] 4.2.2 Database errors when storing linking information.
  - [ ] 4.3 On linking failure (e.g., webhook indicates failure, or timeout):
    - [ ] 4.3.1 Ensure any partial linking data is cleaned up in the backend.
    - [ ] 4.3.2 The frontend should display an explanatory error message and allow the user to retry (e.g., by showing the QR code again or a retry button).
  - [ ] 4.4 Ensure all user-facing messages (instructions, success, errors) are clear, concise, and user-friendly.
  - [ ] 4.5 Conduct thorough testing of edge cases identified in the PRD (e.g., QR code expiration before scan, attempting to link an already linked account, network interruptions).
  - [ ] 4.6 Write unit/integration tests for error handling paths. 