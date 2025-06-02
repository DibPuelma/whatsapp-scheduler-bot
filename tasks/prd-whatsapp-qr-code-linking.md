# Product Requirements Document: WhatsApp QR Code Linking

## 1. Introduction/Overview

This document outlines the requirements for a new feature enabling users to link their WhatsApp accounts to the bot by scanning a QR code on a webpage. This will allow them to use their own WhatsApp number to interact with the bot, primarily to send messages to themselves and schedule messages to any WhatsApp contact. The goal is to simplify the onboarding process and provide a seamless way for users to leverage the bot's capabilities using their personal WhatsApp accounts.

## 2. Goals

*   To provide an extremely simple and intuitive onboarding experience for users to connect their WhatsApp accounts.
*   To enable users to link their own WhatsApp number to the bot.
*   To allow users to send messages and schedule messages to any WhatsApp contact through the bot, initiated via messages to their own number (the bot).
*   To replicate the familiar and trusted WhatsApp Web QR code scanning experience.

## 3. User Stories

*   As a busy professional, I want to quickly link my WhatsApp by scanning a QR code on the main webpage so that I can easily schedule messages TO ANYONE using my own WhatsApp number without a complex setup.
*   As a user, I want to see clear instructions on the webpage on how to scan the QR code, similar to WhatsApp Web.
*   As a user, after successfully linking my account, I want to see a confirmation on the webpage and a quick guide on how to use the bot commands via WhatsApp.
*   As a user, I want the QR code to refresh automatically if it expires before I can scan it.
*   As a user, if the linking process is interrupted, I want to see an explanatory error message and be able to try again easily.

## 4. Functional Requirements

1.  **QR Code Display:**
    1.1. The system must display a WhatsApp linking QR code on the main webpage.
    1.2. The QR code display area should include simple, step-by-step instructions for the user, similar to the WhatsApp Web interface (e.g., "1. Open WhatsApp on your phone...", "2. Tap Menu or Settings...", "3. Tap Linked devices...", "4. Point your phone at this screen...").
    1.3. The QR code must automatically refresh if it expires before the user scans it. A visual indicator of this refresh might be considered.
    1.4. The system should show skeleton loading states while the QR code is being generated or refreshed.

2.  **Account Linking:**
    2.1. Users must be able to link their WhatsApp account by scanning the displayed QR code using the "Linked Devices" feature in their WhatsApp mobile application.
    2.2. Upon successful scan and linking, the user's phone number (associated with the scanned WhatsApp account) must be stored by the system.
    2.3. The system must support multiple users linking their individual WhatsApp accounts. Each user can have one active WhatsApp connection linked to their bot account/session.
    2.4. If a user attempts to scan a QR code when their WhatsApp number is already linked and active, the system should reinforce the connection (e.g., confirm it's active) and display the bot usage instructions.

3.  **Post-Linking Webpage Interface:**
    3.1. After a successful link, the webpage where the QR code was displayed must update to show a success message (e.g., "Account connected successfully!").
    3.2. The webpage must also display a quick guide with example commands the user can send to their own number (the bot) on WhatsApp to interact with the service (e.g., scheduling messages).
        *   Example commands (to be finalized):
            *   `/schedule "message content" to +[recipient_phone_number_with_country_code] on YYYY-MM-DD HH:MM`
            *   `/sendnow "message content" to +[recipient_phone_number_with_country_code]`
            *   `/help` (to get command list)

4.  **WhatsApp Interaction (via User's Own Number):**
    4.1. Once linked, the user will interact with the bot by sending messages/commands to their own WhatsApp number (which is now connected to the bot).
    4.2. The user must receive a confirmation message on their WhatsApp from the bot upon successful linking.
    4.3. Users must be able to send a text message to any WhatsApp contact via the bot using a command.
    4.4. Users must be able to schedule a text message to any WhatsApp contact via the bot using a command.
    4.5. For the initial version (MVP), only text-based messages are supported for sending and scheduling.

5.  **Error Handling:**
    5.1. If a network interruption or other error occurs during the linking process, the webpage must display an explanatory error message.
    5.2. The system should attempt to remove any partial linking data.
    5.3. The QR code should be displayed again, allowing the user to retry the linking process.
    5.4. All error messages displayed to the user must be clear, concise, and guide the user on the next steps, if applicable.

## 5. Non-Goals (Out of Scope for this PRD)

*   Managing linked accounts (e.g., viewing, editing, deleting linked WhatsApp numbers) via the webpage in this version. This will be a future feature.
*   Scheduling or sending messages containing media (images, videos, files, etc.) in this version.
*   Support for linking multiple WhatsApp accounts to a single bot user account, or one WhatsApp account to multiple bot user accounts. (Current scope: One user : One WhatsApp connection).
*   Web-based interface for scheduling or managing messages post-linking (interaction is purely WhatsApp-based for now).
*   Advanced bot command functionalities beyond basic send now/schedule text messages.

## 6. Design Considerations

*   **User Interface (Webpage):**
    *   The QR code display page should closely mimic the visual style and simplicity of the WhatsApp Web login screen (refer to the provided screenshot).
    *   **Color Palette:** Formal yet playful. Suggestions:
        *   Primary (e.g., headers, primary actions): Dark Blue (e.g., `#0A2463`)
        *   Secondary/Background (e.g., page background): Light Gray (e.g., `#F0F2F5`, similar to WhatsApp Web)
        *   Accent (e.g., links, highlights, success indicators): Playful Green/Teal (e.g., WhatsApp's `#00A884` or a slightly brighter `#1ABC9C`)
        *   Text: Dark Gray/Black (e.g., `#1C1E21`)
    *   **Loading States:** Implement skeleton screens for the QR code area while it's loading or refreshing to provide a smooth UX.
    *   **Responsiveness:** The page should be responsive and usable on common desktop browser sizes. Mobile web responsiveness for the QR page is a lower priority as users will scan with their phones.
*   **User Experience:**
    *   The entire process should be extremely simple and require minimal clicks/effort from the user.
    *   Instructions should be clear and concise.
    *   Feedback (success, error, loading) must be immediate and clear.

## 7. Technical Considerations

*   **WhatsApp Integration:** This feature will require integration with a WhatsApp Business API provider or a library that allows for programmatic sending of messages and managing a WhatsApp bot instance (e.g., Baileys, Twilio API for WhatsApp, Meta's official API). The specific choice of API/library will influence QR code generation and session management.
*   **QR Code Generation:** The QR code itself is typically provided by the WhatsApp API/library when initiating a new session to be linked.
*   **Security:** Ensure that the process of linking and storing phone numbers is secure and respects user privacy. Only store the phone number.
*   **Scalability:** The system should be designed to handle a reasonable number of concurrent users attempting to link their accounts and interact with the bot.

## 8. Success Metrics

*   **Linking Success Rate:** Percentage of users who successfully link their WhatsApp account after landing on the QR code page.
*   **Time to Link:** Average time taken for a user to successfully link their account from the moment the QR code is displayed.
*   **Feature Adoption Rate:** Number of unique users linking their WhatsApp accounts per day/week.
*   **Bot Interaction:** Number of messages successfully sent/scheduled via the bot by linked users.
*   **User-Reported Issues:** Low number of support tickets or negative feedback related to the QR linking process.

## 9. Open Questions

*   What is the exact session management strategy for linked WhatsApp accounts? How long do sessions stay active? How are reconnections handled if the bot server restarts?
*   Are there specific rate limits or restrictions from the chosen WhatsApp API/library that need to be considered for message scheduling and sending?
*   What is the definitive list and syntax for the initial set of bot commands (e.g., specific format for date/time in `/schedule`)?
*   How will users be uniquely identified in the bot system if they are not "logged in" on the webpage when they scan the QR code? Does linking the WhatsApp number create a user account or associate with an existing one? (Assuming the phone number becomes the primary identifier for their bot usage). 