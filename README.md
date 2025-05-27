# WhatsApp Scheduler Bot

A WhatsApp bot that allows users to schedule messages to be sent at specific times. Built with Next.js, Prisma, and Baileys.

## Features

- Schedule messages using natural language processing
- Whitelist system for authorized users
- Automatic message sending at scheduled times
- Retry mechanism for failed messages
- Support for follow-up conversations
- Message status tracking (pending, processing, sent, failed)

## Tech Stack

- Next.js 13+ with App Router
- TypeScript
- Prisma ORM
- PostgreSQL
- Baileys (WhatsApp Web API)
- Zod for validation

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/whatsapp-scheduler-bot.git
cd whatsapp-scheduler-bot
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
WHITELISTED_NUMBERS="+1234567890,+0987654321"
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

## Usage

1. Start the bot and scan the QR code with WhatsApp
2. Send a message to schedule (e.g., "Send hello to +1234567890 tomorrow at 3pm")
3. The bot will process your request and confirm the scheduling
4. Messages will be sent automatically at their scheduled times

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `WHITELISTED_NUMBERS`: Comma-separated list of phone numbers allowed to use the bot

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
