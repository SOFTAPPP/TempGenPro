import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true
    }
  });
  console.log('--- Current Users in Database ---');
  console.table(users);
  console.log('---------------------------------');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
