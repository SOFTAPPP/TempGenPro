import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Mail, Server, Smartphone, Globe, Lock, Cpu, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const Features: React.FC = () => {
  const mainFeatures = [
    {
      icon: <Cpu size={32} />,
      title: "Synthetic Persona",
      desc: "Deploy relay nodes with high-fidelity AI-generated identities including names, professional roles, and avatars to maximize signup success rates.",
      color: "var(--primary)"
    },
    {
      icon: <Shield size={32} />,
      title: "AI Camouflage",
      desc: "Engage the Noise Engine to simulate organic background activity and background traffic, bypassing aggressive behavioral bot detection patterns.",
      color: "#8eb5ee"
    },
    {
      icon: <Zap size={32} />,
      title: "Privacy Shield",
      desc: "Our advanced De-Tracker technology automatically purges spy pixels and tracking parameters (UTMs) from incoming packets in real-time.",
      color: "#ffffff"
    }
  ];

  const secondaryFeatures = [
    { icon: <Lock />, title: "256-bit Interception", desc: "Military-grade encryption protocols protect every data transmission through our secure relay tunnels." },
    { icon: <Mail />, title: "Catch-All Pipelines", desc: "Monitor entire domains with interceptor-grade catch-all support, ensuring no transmission goes undetected." },
    { icon: <Globe />, title: "Global Edge Network", desc: "Ultra-low latency delivery via distributed interceptor nodes across Cloudflare's global edge network." },
    { icon: <Smartphone />, title: "Mobile Optimized", desc: "A flawless, responsive terminal experience across desktop, tablet, and mobile devices." },
    { icon: <CheckCircle />, title: "Zero Log Policy", desc: "We operate on a strict zero-log infrastructure. Your temporary communications remain private and untraceable." },
    { icon: <Server />, title: "Dedicated Architecture", desc: "Running on high-performance infrastructure for 99.9% uptime and near-instant packet delivery." }
  ];

  return (
    <div className="container" style={{ padding: '6rem 0' }}>
      <SEO
        title="Privacy Features | Elite Anonymity Tools | TempGenPro"
        description="Explore advanced privacy features like Synthetic Personas, AI Camouflage Noise Engine, and Privacy Shield. Protect your identity with state-of-the-art relay systems."
        keywords="ai persona, ai camouflage, noise engine, de-tracker, privacy shield, anonymous signup features"
      />
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
          The trusted standard for developers, academic researchers, and business professionals
          seeking secure, high-performance disposable email infrastructure for every workflow.
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
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>10M+</h2>
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
      {/* 🚀 Feature Roadmap */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.25rem' }}>Innovation <span className="gradient-text">Roadmap</span></h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>We're building the most complete anonymity ecosystem on the web.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '8rem' }}>
        <div className="card" style={{ padding: '2.5rem', border: '1px solid rgba(37, 211, 102, 0.2)', position: 'relative' }}>
          <span className="badge" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', fontSize: '0.65rem' }}>COMING SOON</span>
          <h4 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-bold)' }}>Permanent WhatsApp</h4>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Secure, dedicated virtual numbers for WhatsApp business and personal use without a physical SIM card.</p>
        </div>
        <div className="card" style={{ padding: '2.5rem', border: '1px solid rgba(182, 139, 245, 0.2)', position: 'relative' }}>
          <span className="badge" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(182, 139, 245, 0.1)', color: 'var(--primary)', fontSize: '0.65rem' }}>COMING SOON</span>
          <h4 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-bold)' }}>Social Media Relays</h4>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Premium and optimized domains for creating accounts on social media platforms like Facebook, Instagram, and many more.</p>
        </div>
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
        <p style={{ color: 'var(--text-muted)', marginBottom: '3.5rem', fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto 3.5rem' }}>Join the global community of developers, researchers, and professionals who secure their primary inbox with TempGenPro.</p>
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
