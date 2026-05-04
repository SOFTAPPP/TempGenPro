import prisma from './prisma';
import { generatePersona } from './personaGenerator';

const FIRST_NAMES = ['james', 'mary', 'robert', 'patricia', 'john', 'jennifer', 'michael', 'linda', 'william', 'elizabeth', 'david', 'barbara', 'richard', 'susan', 'joseph', 'jessica', 'thomas', 'sarah', 'charles', 'karen', 'christopher', 'nancy', 'daniel', 'lisa', 'matthew', 'betty', 'anthony', 'margaret', 'mark', 'sandra'];
const LAST_NAMES = ['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis', 'rodriguez', 'martinez', 'hernandez', 'lopez', 'gonzalez', 'wilson', 'anderson', 'thomas', 'taylor', 'moore', 'jackson', 'martin', 'lee', 'perez', 'thompson', 'white', 'harris', 'sanchez', 'clark', 'ramirez', 'lewis', 'robinson'];
const DEPTS = ['support', 'billing', 'info', 'contact', 'sales', 'hr', 'marketing', 'dev', 'admin', 'accounts', 'security', 'legal', 'official', 'team', 'service', 'help', 'no-reply', 'inquiry', 'office', 'feedback', 'press'];

export const generateUniqueEmail = async (userId?: number, forcedDomain?: string, includePersona: boolean = false) => {
  const domainsStr = process.env.EMAIL_DOMAINS || process.env.EMAIL_DOMAIN || 'tempgenpro.com';
  const domains = domainsStr.split(',').map(d => d.trim());
  
  let email = '';
  let isUnique = false;

  while (!isUnique) {
    const domain = forcedDomain || domains[Math.floor(Math.random() * domains.length)];
    const randPattern = Math.random();
    let local = '';

    if (randPattern < 0.5) {
      // Pattern 1: firstname.lastname (Most common professional)
      const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const last = LAST_NAMES[LAST_NAMES.length - 1 - Math.floor(Math.random() * LAST_NAMES.length)]; // Random but distributed
      local = `${first}.${last}`;
      // Occasionally add a year or number for uniqueness
      if (Math.random() > 0.8) local += Math.floor(Math.random() * 99);
    } else if (randPattern < 0.8) {
      // Pattern 2: department/institutional
      local = DEPTS[Math.floor(Math.random() * DEPTS.length)];
      if (Math.random() > 0.6) {
        local += Math.floor(Math.random() * 99).toString().padStart(2, '0');
      }
    } else {
      // Pattern 3: initial.lastname or first_initial
      const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      local = Math.random() > 0.5 ? `${first[0]}${last}` : `${first}${last[0]}`;
      local += Math.floor(Math.random() * 99);
    }
    
    email = `${local.toLowerCase()}@${domain}`;

    const existing = await prisma.tempEmail.findUnique({ where: { email } });
    if (!existing) isUnique = true;
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const persona = includePersona ? generatePersona() : null;

  return await prisma.tempEmail.create({
    data: {
      email,
      userId,
      expiresAt,
      personaName: persona?.name || null,
      personaJob: persona?.job || null,
      personaBio: persona?.bio || null,
      personaAvatar: persona?.avatar || null,
      camouflageEnabled: false
    }
  });
};
