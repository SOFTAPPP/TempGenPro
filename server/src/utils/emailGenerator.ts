import prisma from './prisma';

export const generateUniqueEmail = async (userId?: number) => {
  const domain = process.env.EMAIL_DOMAIN || 'tempgenpro.com';
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let email = '';
  let isUnique = false;

  while (!isUnique) {
    let local = '';
    for (let i = 0; i < 12; i++) {
      local += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    email = `${local}@${domain}`;

    const existing = await prisma.tempEmail.findUnique({ where: { email } });
    if (!existing) isUnique = true;
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  return await prisma.tempEmail.create({
    data: {
      email,
      userId,
      expiresAt,
    }
  });
};
