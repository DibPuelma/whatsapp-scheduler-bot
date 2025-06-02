import { PrismaClient } from '../src/generated/prisma';
const prisma = new PrismaClient();

async function main() {
  // Clear existing messages first (keep this for cleanup)
  await prisma.scheduledMessage.deleteMany({
    where: {
      userId: '+56991543054', // Test sender phone
    },
  });

  console.log('Database cleaned of test messages');

  // Message view stats cleanup
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

  console.log('Database seeding completed (test data removed)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 