import prisma from './prisma';

const FIRST_NAMES = ['james', 'mary', 'robert', 'patricia', 'john', 'jennifer', 'michael', 'linda', 'william', 'elizabeth', 'david', 'barbara', 'richard', 'susan', 'joseph', 'jessica', 'thomas', 'sarah', 'charles', 'karen'];
const LAST_NAMES = ['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis', 'rodriguez', 'martinez', 'hernandez', 'lopez', 'gonzalez', 'wilson', 'anderson', 'thomas', 'taylor', 'moore', 'jackson', 'martin'];
const DEPTS = ['support', 'billing', 'info', 'contact', 'sales', 'hr', 'marketing', 'dev', 'admin', 'accounts', 'security', 'legal', 'official', 'team', 'service', 'help', 'no-reply'];

export const generateUniqueEmail = async (userId?: number, forcedDomain?: string) => {
  const domainsStr = process.env.EMAIL_DOMAINS || process.env.EMAIL_DOMAIN || 'tempgenpro.com';
  const domains = domainsStr.split(',').map(d => d.trim());
  
  let email = '';
  let isUnique = false;

  while (!isUnique) {
    // Pick the requested domain or a random one from the pool
    const domain = forcedDomain || domains[Math.floor(Math.random() * domains.length)];
    
    // Choose a generation pattern for "real life" feel
    const randPattern = Math.random();
    let local = '';

    if (randPattern < 0.4) {
      // Pattern 1: firstname.lastname (Most common professional)
      const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      local = `${first}.${last}`;
    } else if (randPattern < 0.7) {
      // Pattern 2: department/institutional
      local = DEPTS[Math.floor(Math.random() * DEPTS.length)];
      // Add a random suffix occasionally to ensure uniqueness for depts
      if (Math.random() > 0.5) {
        local += Math.floor(Math.random() * 99).toString().padStart(2, '0');
      }
    } else {
      // Pattern 3: initial.lastname or first_initial
      const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      local = `${first[0]}${last}${Math.floor(Math.random() * 99)}`;
    }
    
    email = `${local.toLowerCase()}@${domain}`;

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
