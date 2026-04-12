import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, UserX, Scale } from 'lucide-react';

const Terms: React.FC = () => {
  return (
    <div className="container" style={{ padding: '4rem 1.25rem', maxWidth: '800px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="hero-title" style={{ fontSize: '3rem', marginBottom: '2rem' }}>
          Terms of <span className="gradient-text">Service</span>
        </h1>

        <div className="card glass" style={{ padding: '3rem', lineHeight: '1.8' }}>
          <section style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <Scale size={20} color="var(--primary)" /> 1. Acceptance of Terms
            </h3>
            <p style={{ color: 'var(--text)' }}>
              By accessing and using TempGenPro, you agree to be bound by these Terms of Service. Our service provides temporary, disposable email addresses for privacy and testing purposes only.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem', borderLeft: '4px solid var(--secondary)', paddingLeft: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: 'var(--secondary)' }}>
              <AlertTriangle size={20} /> 2. Strict Prohibited Activities
            </h3>
            <p style={{ color: 'var(--text-bold)', fontWeight: 600 }}>
              The following activities will result in an immediate and permanent ban:
            </p>
            <ul style={{ color: 'var(--text)', marginTop: '0.5rem', listStyle: 'none' }}>
              <li>• Creating fake social media accounts for impersonation.</li>
              <li>• Using our service to harm, harass, or stalk individuals.</li>
              <li>• Engaging in phishing, spamming, or fraudulent activities.</li>
              <li>• Distributing malware or illegal content.</li>
              <li>• Bypassing security measures or automated scraping of our API.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <UserX size={20} color="var(--primary)" /> 3. Account Termination
            </h3>
            <p style={{ color: 'var(--text)' }}>
              We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. <strong>Banned accounts will not be restored under any circumstances if found violating the prohibited activities mentioned above.</strong>
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <Shield size={20} color="var(--primary)" /> 4. Virtual Numbers & Premium Tunnels
            </h3>
            <p style={{ color: 'var(--text)' }}>
              Usage of upcoming virtual numbers (WhatsApp/SMS) and premium social-ready domains is subject to additional fair-use policies. These services are intended for personal privacy and legitimate professional research. Any automated bulk-registration or commercial exploitation is strictly prohibited and will result in non-refundable termination.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <AlertTriangle size={20} color="var(--primary)" /> 5. Disclaimer of Warranty
            </h3>
            <p style={{ color: 'var(--text)' }}>
              TempGenPro is provided "as is" and "as available". We make no warranties regarding the reliability, security, or performance of the email delivery service. Temporary data may be lost or deleted at any time.
            </p>
          </section>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '3rem' }}>
            Last updated: April 10, 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Terms;
