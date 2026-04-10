import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Mail, Server, Smartphone, Globe, Lock, Cpu, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Features: React.FC = () => {
  const mainFeatures = [
    {
      icon: <Shield size={32} />,
      title: "Top-Tier Privacy",
      desc: "All incoming emails are automatically deleted after 24 hours. We never log your real IP address or personal data.",
      color: "var(--primary)"
    },
    {
      icon: <Zap size={32} />,
      title: "Real-time Delivery",
      desc: "Our high-speed infrastructure ensures emails arrive in your temp inbox in less than 200ms—faster than a blink.",
      color: "#8eb5ee"
    },
    {
      icon: <Mail size={32} />,
      title: "Catch-All Support",
      desc: "Receive emails sent to ANY address on our domain. Perfect for testing signup flows or bypassing address-specific limits.",
      color: "#ffffff"
    }
  ];

  const secondaryFeatures = [
    { icon: <Cpu />, title: "Auto-OTP Extraction", desc: "Our AI automatically finds and highlights verification codes for you." },
    { icon: <Globe />, title: "Global DNS", desc: "Ultra-low latency delivery via Cloudflare's global edge network." },
    { icon: <Lock />, title: "End-to-End Encryption", desc: "Your temp inboxes are protected with industry-standard SSL." },
    { icon: <Server />, title: "Dedicated Infrastructure", desc: "Running on high-performance Hostinger VPS for 99.9% uptime." },
    { icon: <Smartphone />, title: "Mobile Optimized", desc: "A flawless experience across desktop, tablet, and mobile devices." },
    { icon: <CheckCircle />, title: "No Registration", desc: "Use basic features instantly without ever having to create an account." }
  ];

  return (
    <div className="container" style={{ padding: '6rem 0' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: '8rem' }}>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-title"
          style={{ marginBottom: '1.5rem' }}
        >
          Everything you need for <br />
          <span className="gradient-text">Complete Privacy</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hero-subtitle"
        >
          Discover why thousands of developers and privacy-conscious users
          rely on TempGenPro for their disposable email needs.
        </motion.p>
      </section>

      {/* Main Feature Grid */}
      <div className="features-grid" style={{ marginBottom: '8rem' }}>
        {mainFeatures.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="card feature-card"
          >
            <div className="feature-icon-wrapper" style={{ background: 'var(--primary-light)', padding: '1rem', marginBottom: '2rem' }}>
              {f.icon}
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '1.25rem' }}>{f.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.7 }}>{f.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Pro Stats Section */}
      <section className="card" style={{ padding: '4rem', marginBottom: '8rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', borderRadius: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', textAlign: 'center' }}>
          <div>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>50M+</h2>
            <p style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Emails Processed</p>
          </div>
          <div>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#3b82f6', marginBottom: '0.5rem' }}>24/7</h2>
            <p style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>System Uptime</p>
          </div>
          <div>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#10b981', marginBottom: '0.5rem' }}>&lt;1s</h2>
            <p style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Delivery Time</p>
          </div>
        </div>
      </section>

      {/* Secondary Features Grid */}
      <div className="features-grid" style={{ marginBottom: '8rem' }}>
        {secondaryFeatures.map((f, i) => (
          <motion.div
            whileHover={{ y: -5 }}
            key={i}
            className="card"
            style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', padding: '2rem' }}
          >
            <div className="feature-icon-wrapper" style={{ width: '48px', height: '48px', minWidth: '48px', marginBottom: 0 }}>
              {f.icon}
            </div>
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700, color: 'var(--text-bold)' }}>{f.title}</h4>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="card"
        style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--bg-secondary)', border: '1px solid var(--primary-border)', borderRadius: '40px' }}
      >
        <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Ready to Take Control?</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3.5rem', fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto 3.5rem' }}>Join thousands of users who are already protecting their real inbox from marketing spam and security threats.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Get Started for Free
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>
      </motion.section>
    </div>
  );
};

export default Features;
