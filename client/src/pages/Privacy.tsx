import React from 'react';
import { motion } from 'framer-motion';
import { Lock, EyeOff, Trash2, Database } from 'lucide-react';

const Privacy: React.FC = () => {
  return (
    <div className="container" style={{ padding: '8rem 0', maxWidth: '800px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="hero-title" style={{ fontSize: '3rem', marginBottom: '2rem' }}>
          Privacy <span className="gradient-text">Policy</span>
        </h1>

        <div className="card glass" style={{ padding: '3rem', lineHeight: '1.8' }}>
          <section style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <EyeOff size={20} color="var(--primary)" /> 1. Data Collection
            </h3>
            <p style={{ color: 'var(--text)' }}>
              While we prioritize your privacy, we collect basic technical information such as your device's IP address and browser type when you access our services. this is used solely for security monitoring, platform optimization, and preventing abuse of our temporary email infrastructure.
            </p>
          </section>


          <section style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <Trash2 size={20} color="var(--primary)" /> 2. Automatic Deletion
            </h3>
            <p style={{ color: 'var(--text)' }}>
              All emails received by your temporary addresses are automatically and permanently deleted from our servers after 24 hours. Once deleted, this information cannot be recovered by you or our staff.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <Lock size={20} color="var(--primary)" /> 3. Security
            </h3>
            <p style={{ color: 'var(--text)' }}>
              We use industry-standard SSL encryption to protect your data in transit. Our infrastructure is designed to minimize the attack surface and keep your temporary communications private.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <Database size={20} color="var(--primary)" /> 4. Cookies
            </h3>
            <p style={{ color: 'var(--text)' }}>
              We use minimal local storage and cookies only for essential functionality, such as keeping you logged in if you create an account. We do not use third-party tracking or advertising cookies.
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

export default Privacy;
