import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const username = "aritrada420";
  const email = "aritradatt39@gmail.com";
  const password = "Aritradutta@2005";

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const admin = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        rawPassword: password,
        role: 'ADMIN'
      } as any
    });
    console.log('Admin User Created Successfully:', admin.username);
  } catch (err: any) {
    if (err.code === 'P2002') {
      console.log('ℹUser already exists.');
    } else {
      console.error('Error creating admin:', err);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
