
import prisma from '../utils/prisma';

async function checkUser() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true }
    });
    console.log('--- ALL USERS ---');
    console.log(JSON.stringify(users, null, 2));

    const identifier = 'Moonlight';
    const moonlight = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: 'insensitive' } },
          { email: { equals: identifier, mode: 'insensitive' } },
          { username: identifier }
        ]
      }
    });

    console.log('\n--- SEARCH RESULT for "Moonlight" ---');
    console.log(moonlight);
  } catch (err) {
    console.error('Error:', err);
  }
}

checkUser()
  .finally(async () => {
    await prisma.$disconnect();
  });
