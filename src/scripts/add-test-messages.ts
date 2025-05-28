import { prisma } from '../lib/prisma';

async function addTestMessages() {
  try {
    // Clear existing messages first
    await prisma.scheduledMessage.deleteMany({
      where: {
        senderPhone: '+123456789', // Test sender phone
      },
    });

    // Add test messages
    const messages = await prisma.scheduledMessage.createMany({
      data: [
        {
          phone: '+987654321',
          senderPhone: '+123456789',
          content: 'Test message 1',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          status: 'pending',
        },
        {
          phone: '+987654322',
          senderPhone: '+123456789',
          content: 'Test message 2',
          scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
          status: 'pending',
        },
        {
          phone: '+987654323',
          senderPhone: '+123456789',
          content: 'Test message 3',
          scheduledAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days from now
          status: 'pending',
        },
        {
          phone: '+987654324',
          senderPhone: '+123456789',
          content: 'Test message 4',
          scheduledAt: new Date(Date.now() + 96 * 60 * 60 * 1000), // 4 days from now
          status: 'pending',
        },
        {
          phone: '+987654325',
          senderPhone: '+123456789',
          content: 'Test message 5',
          scheduledAt: new Date(Date.now() + 120 * 60 * 60 * 1000), // 5 days from now
          status: 'pending',
        },
        {
          phone: '+987654326',
          senderPhone: '+123456789',
          content: 'Test message 6',
          scheduledAt: new Date(Date.now() + 144 * 60 * 60 * 1000), // 6 days from now
          status: 'pending',
        },
        {
          phone: '+987654327',
          senderPhone: '+123456789',
          content: 'Test message 7',
          scheduledAt: new Date(Date.now() + 168 * 60 * 60 * 1000), // 7 days from now
          status: 'pending',
        },
        {
          phone: '+987654328',
          senderPhone: '+123456789',
          content: 'Test message 8',
          scheduledAt: new Date(Date.now() + 192 * 60 * 60 * 1000), // 8 days from now
          status: 'pending',
        },
        {
          phone: '+987654329',
          senderPhone: '+123456789',
          content: 'Test message 9',
          scheduledAt: new Date(Date.now() + 216 * 60 * 60 * 1000), // 9 days from now
          status: 'pending',
        },
        {
          phone: '+987654330',
          senderPhone: '+123456789',
          content: 'Test message 10',
          scheduledAt: new Date(Date.now() + 240 * 60 * 60 * 1000), // 10 days from now
          status: 'pending',
        },
        {
          phone: '+987654331',
          senderPhone: '+123456789',
          content: 'Test message 11',
          scheduledAt: new Date(Date.now() + 264 * 60 * 60 * 1000), // 11 days from now
          status: 'pending',
        },
        {
          phone: '+987654332',
          senderPhone: '+123456789',
          content: 'Test message 12',
          scheduledAt: new Date(Date.now() + 288 * 60 * 60 * 1000), // 12 days from now
          status: 'pending',
        },
      ],
    });

    console.log(`Added ${messages.count} test messages`);

    // Add a message view stat to simulate previous views
    await prisma.messageViewStats.upsert({
      where: {
        senderPhone: '+123456789',
      },
      create: {
        senderPhone: '+123456789',
        totalViews: 0,
        lastOffset: 0,
      },
      update: {
        totalViews: 0,
        lastOffset: 0,
      },
    });

    console.log('Added message view stats');
  } catch (error) {
    console.error('Error adding test messages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addTestMessages(); 