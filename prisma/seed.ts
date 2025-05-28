import { PrismaClient } from '../src/generated/prisma';
const prisma = new PrismaClient();

async function main() {
  // Clear existing messages first
  await prisma.scheduledMessage.deleteMany({
    where: {
      senderPhone: '+56991543054', // Test sender phone
    },
  });

  // Add test messages
  const messages = await prisma.scheduledMessage.createMany({
    data: [
      {
        phone: '+987654321',
        senderPhone: '+56991543054',
        content: 'Test message 1',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        status: 'pending',
      },
      {
        phone: '+987654322',
        senderPhone: '+56991543054',
        content: 'Test message 2',
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
        status: 'pending',
      },
      {
        phone: '+987654323',
        senderPhone: '+56991543054',
        content: 'Test message 3',
        scheduledAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days from now
        status: 'pending',
      },
      {
        phone: '+987654324',
        senderPhone: '+56991543054',
        content: 'Test message 4',
        scheduledAt: new Date(Date.now() + 96 * 60 * 60 * 1000), // 4 days from now
        status: 'pending',
      },
      {
        phone: '+987654325',
        senderPhone: '+56991543054',
        content: 'Test message 5',
        scheduledAt: new Date(Date.now() + 120 * 60 * 60 * 1000), // 5 days from now
        status: 'pending',
      },
      {
        phone: '+987654326',
        senderPhone: '+56991543054',
        content: 'Test message 6',
        scheduledAt: new Date(Date.now() + 144 * 60 * 60 * 1000), // 6 days from now
        status: 'pending',
      },
      {
        phone: '+987654327',
        senderPhone: '+56991543054',
        content: 'Test message 7',
        scheduledAt: new Date(Date.now() + 168 * 60 * 60 * 1000), // 7 days from now
        status: 'pending',
      },
      {
        phone: '+987654328',
        senderPhone: '+56991543054',
        content: 'Test message 8',
        scheduledAt: new Date(Date.now() + 192 * 60 * 60 * 1000), // 8 days from now
        status: 'pending',
      },
      {
        phone: '+987654329',
        senderPhone: '+56991543054',
        content: 'Test message 9',
        scheduledAt: new Date(Date.now() + 216 * 60 * 60 * 1000), // 9 days from now
        status: 'pending',
      },
      {
        phone: '+987654330',
        senderPhone: '+56991543054',
        content: 'Test message 10',
        scheduledAt: new Date(Date.now() + 240 * 60 * 60 * 1000), // 10 days from now
        status: 'pending',
      },
      {
        phone: '+987654331',
        senderPhone: '+56991543054',
        content: 'Test message 11',
        scheduledAt: new Date(Date.now() + 264 * 60 * 60 * 1000), // 11 days from now
        status: 'pending',
      },
      {
        phone: '+987654332',
        senderPhone: '+56991543054',
        content: 'Test message 12',
        scheduledAt: new Date(Date.now() + 288 * 60 * 60 * 1000), // 12 days from now
        status: 'pending',
      },
    ],
  });

  console.log(`Added ${messages.count} test messages`);

  // First find or create the stats record
  const existingStats = await prisma.messageViewStats.findFirst({
    where: {
      senderPhone: '+56991543054',
    },
  });

  if (existingStats) {
    // Update existing stats
    await prisma.messageViewStats.update({
      where: {
        id: existingStats.id,
      },
      data: {
        totalViews: 0,
        lastOffset: 0,
        lastViewedAt: new Date(),
      },
    });
  } else {
    // Create new stats
    await prisma.messageViewStats.create({
      data: {
        senderPhone: '+56991543054',
        totalViews: 0,
        lastOffset: 0,
      },
    });
  }

  console.log('Added message view stats');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 