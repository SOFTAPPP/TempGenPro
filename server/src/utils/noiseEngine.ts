import prisma from '../utils/prisma';
import { emitNewEmail, emitToUser } from '../utils/socket';

const NOISE_TEMPLATES = [
  {
    sender: "newsletter@insights-tech.info",
    subject: "Monthly System Intelligence Briefing: April 2026",
    body: "Hello,\n\nIn this month’s briefing, we cover the rapid evolution of decentralized cloud infrastructure and the impact of P2P relay nodes on data sovereignty.\n\nKey Insights:\n1. Zero-Knowledge proofs are becoming standard.\n2. Latency reduction in edge computing is at an all-time high.\n\nKeep your systems optimized.\n\nRegards,\nThe Insights Tech Team"
  },
  {
    sender: "billing-noreply@saas-managed-infra.com",
    subject: "Monthly Usage Statement: Zero Usage Alert",
    body: "Hello User,\n\nYour account has been active for 24 hours with zero resource consumption. This is just a courtesy notification to ensure your relay tunnels are functioning as expected.\n\nView Dashboard: https://saas-managed-infra.com/dashboard\n\nSupport Team"
  },
  {
    sender: "security@global-p2p.net",
    subject: "Security Advisory: Node Reputation Signal",
    body: "Warning: Your recent node deployment at tempgenpro.com has been verified as SECURE.\n\nNo vulnerabilities detected. Your encryption protocols are up to date.\n\nSecurity Audit: https://global-p2p.net/integrity-check-2938\n\nGlobal P2P Security"
  }
];

export const generateNoiseForEmail = async (tempEmailId: number, email: string, userId: number | null) => {
  const template = NOISE_TEMPLATES[Math.floor(Math.random() * NOISE_TEMPLATES.length)];

  const message = await prisma.message.create({
    data: {
      tempEmailId,
      sender: template.sender,
      subject: template.subject,
      body: template.body,
      trackersBlocked: 0 // Noise emails are "safe" internal simulations
    }
  });

  // Broadcast to frontend
  emitNewEmail(email, message);
  if (userId) {
    emitToUser(userId, 'new_email_global', { email, message });
  }
};

/**
 * Periodically sends "noise" emails to nodes with camouflage enabled.
 */
export const startNoiseEngine = () => {
  console.log('[Noise Engine] Started. Simulation cycle: 15 minutes.');
  
  setInterval(async () => {
    try {
      const targetEmails = await prisma.tempEmail.findMany({
        where: { camouflageEnabled: true, isActive: true },
        select: { id: true, email: true, userId: true }
      });

      console.log(`[Noise Engine] Injecting noise into ${targetEmails.length} active camouflage tunnels...`);

      for (const node of targetEmails) {
        // ⚡ Don't send every cycle, random chance for organic feel
        if (Math.random() > 0.6) {
          await generateNoiseForEmail(node.id, node.email, node.userId);
        }
      }
    } catch (err) {
      console.error('[Noise Engine Error]:', err);
    }
  }, 1000 * 60 * 15); // Every 15 minutes
};
