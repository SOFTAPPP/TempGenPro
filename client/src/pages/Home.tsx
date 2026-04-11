import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Mail, Copy, Star, ArrowRight, MessageSquare, Globe, HelpCircle } from 'lucide-react';
import SmartLink from '../components/SmartLink';
import SEO from '../components/SEO';

const Home: React.FC = () => {
  const [tempEmail, setTempEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePreview = () => {
    setLoading(true);
    setTempEmail(null); // Clear old one if regenerating to show loader
    setTimeout(() => {
      const local = Math.random().toString(36).substring(2, 10);
      setTempEmail(`${local}@tempgenpro.com`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="container">
      <SEO 
        title="TempGenPro | Elite Temporary Email & Anonymous Relay"
        description="Ghost your digital footprint with the most advanced temporary email system. Generate anonymous emails and virtual numbers for secure social media signups."
        keywords="temporary email, anonymous mail, temp mail, disposable email address, virtual whatsapp numbers, test email, verify social media"
      />
      {/* Hero Section */}
      <section className="hero-section" style={{ paddingTop: 'clamp(8rem, 15vh, 12rem)', paddingBottom: '3rem', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="badge" style={{ padding: '0.8rem 1.5rem', marginBottom: '3rem' }}>
            <Star size={14} fill="currentColor" style={{ marginRight: '8px' }} />
            <span>THE ELITE TEMPORARY RELAY SYSTEM</span>
          </div>

          <h1 className="hero-title" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: 0.9, marginBottom: '2rem' }}>
            Ghost Your <br />
            <span className="gradient-text">Digital Footprint.</span>
          </h1>

          <p className="hero-subtitle" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', maxWidth: '750px', lineHeight: 1.6, marginBottom: '4rem' }}>
            The premier high-performance relay system for developers, researchers, and professionals.
            Secure your primary identity from surveillance, marketing spam, and data exposure.
          </p>

          <div className="hero-actions" style={{ marginBottom: (tempEmail || loading) ? '5rem' : '0' }}>
            <SmartLink to="/signup" className="btn btn-primary btn-lg" style={{ padding: '1.2rem 3rem', borderRadius: '18px' }}>
              Create Account <ArrowRight size={20} />
            </SmartLink>
            <button
              onClick={generatePreview}
              className="btn btn-secondary btn-lg"
              disabled={loading}
              style={{ padding: '1.2rem 3rem', borderRadius: '18px', background: 'rgba(255,255,255,0.03)' }}
            >
              <Zap size={20} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Routing...' : 'Establish Free Demo'}
              {loading && (
                <motion.div
                  className="btn-loader-progress"
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 1.5, ease: "linear" }}
                />
              )}
            </button>
          </div>
        </motion.div>

        {/* Dynamic Preview Card / Loader */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="preview-card-wrapper"
              style={{ marginTop: '5rem' }}
            >
              <div className="glass-card preview-card skeleton-card" style={{ maxWidth: '650px', padding: '3rem', borderStyle: 'dashed' }}>
                <div className="skeleton-line" style={{ width: '40%', height: '12px', marginBottom: '1.5rem' }}></div>
                <div className="skeleton-line" style={{ width: '85%', height: '40px', marginBottom: '3rem' }}></div>
                <div className="skeleton-line" style={{ width: '100%', height: '60px', borderRadius: '100px' }}></div>
              </div>
            </motion.div>
          ) : tempEmail && (
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.95, y: 60 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="preview-card-wrapper"
              style={{ marginTop: '5rem' }}
            >
              <div className="glass-card preview-card" style={{ maxWidth: '650px', padding: '3.5rem', margin: '0 auto', textAlign: 'left', background: 'linear-gradient(135deg, rgba(182, 139, 245, 0.05) 0%, rgba(210, 86, 86, 0.05) 100%)' }}>
                <div className="preview-card-header" style={{ marginBottom: '3rem' }}>
                  <div style={{ flex: 1 }}>
                    <p className="preview-label" style={{ fontWeight: 900, fontSize: '0.8rem' }}>Active Transmission Endpoint</p>
                    <h3 className="preview-email" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: 'var(--text-bold)', letterSpacing: '-0.03em' }}>{tempEmail}</h3>
                  </div>
                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={() => navigator.clipboard.writeText(tempEmail)}
                    style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.05)', width: '50px', height: '50px' }}
                  >
                    <Copy size={22} />
                  </button>
                </div>

                <div className="preview-status" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', padding: '1.2rem 2rem' }}>
                  <div className="pulse-dot"></div>
                  <span style={{ color: 'var(--text-bold)', fontSize: '1rem', fontWeight: 600 }}>Secured Tunnel Standby...</span>
                </div>

                <div style={{ marginTop: '3.5rem' }}>
                  <SmartLink to="/signup" className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', borderRadius: '16px' }}>
                    Secure This Relay Permanently <ArrowRight size={20} />
                  </SmartLink>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>


      {/* Features Grid */}
      <section id="features" style={{ padding: '4rem 0 8rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.25rem' }}>Why TempGenPro?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>The most advanced temporary email system ever built.</p>
        </div>


        <div className="features-grid">
          {[
            {
              icon: <Shield />,
              title: "Privacy First",
              desc: "No personal data required. We use military-grade encryption to ensure your real identity stays hidden.",
            },
            {
              icon: <Zap />,
              title: "Instant Setup",
              desc: "Generate addresses in one click. No registration needed for basic use, but full accounts unlock more power.",
            },
            {
              icon: <Mail />,
              title: "Multiple Inboxes",
              desc: "Manage multiple active temporary addresses simultaneously. Up to 25 unique inboxes for business power users.",
            }
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card feature-card"
            >
              <div className="feature-icon-wrapper">
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '8rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Simple, <span className="gradient-text">Transparent</span> Pricing</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>Choose the plan that best fits your privacy needs.</p>
        </div>

        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {[
            {
              name: "Free Basics",
              price: "0",
              features: ["5 Active Inboxes", "24h Auto-Deletion", "Basic Support", "Mobile Optimized"],
              btn: "Get Started",
              popular: false
            },
            {
              name: "Premium",
              price: "9",
              features: ["10 Active Inboxes", "7-Day History", "Priority Support", , "Faster Delivery"],
              btn: "Go Premium",
              popular: true
            },
            {
              name: "Business",
              price: "29",
              features: ["25 Active Inboxes", "Permanent Addresses", "Custom Domains", "Direct Support", "API Access"],
              btn: "Scale Now",
              popular: false
            }
          ].map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`card pricing-card ${plan.popular ? 'popular' : ''}`}
              style={{
                position: 'relative',
                border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--border)',
                transform: plan.popular ? 'scale(1.05)' : 'none',
                zIndex: plan.popular ? 2 : 1
              }}
            >
              {plan.popular && (
                <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: '#101115', padding: '4px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  Most Popular
                </div>
              )}
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{plan.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '2rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 800 }}>${plan.price}</span>
                <span style={{ color: 'var(--text-muted)' }}>/month</span>
              </div>
              <ul style={{ listStyle: 'none', marginBottom: '2.5rem' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem', color: 'var(--text)' }}>
                    <Shield size={16} color="var(--primary)" /> {f}
                  </li>
                ))}
              </ul>
              <SmartLink to="/signup" className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', fontSize: '1rem' }}>
                {plan.btn}
              </SmartLink>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🧩 SEO Section: Frequently Asked Questions */}
      <section style={{ padding: '8rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.25rem' }}>Searcher <span className="gradient-text">Insights</span></h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Everything you need to know about disposable email and privacy tech.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2.5rem' }}>
          {[
            {
              q: "What is a Temporary Email Generator?",
              a: "A temporary email generator provides disposable email addresses that self-destruct after a specific time. TempGenPro is the premium standard for high-performance, anonymous inboxes used to bypass social media trackers and avoid marketing spam."
            },
            {
              q: "How does 10 Minute Mail work for verification?",
              a: "When you use our '10 minute mail' style nodes, you get an instant endpoint to receive verification codes (OTPs) from services like Netflix or Facebook. They're perfect for one-time account activations where you don't want to use your real identity."
            },
            {
              q: "Is Temp Mail safe for social media signups?",
              a: "Yes. Our 'Temp Mail' system uses high-reputation relay domains (Social-Ready Relays) and AI Personas. This means services perceive your disposable account as a real, organic human user rather than a bot."
            },
            {
              q: "Can I get a Temporary Number for WhatsApp?",
              a: "Coming soon is our 'Permanent Virtual Number' system. Until then, our 'Temporary Email' relay system is the most secure way to handle anonymous account creations and digital interactions."
            }
          ].map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card glass" 
              style={{ padding: '2.5rem', borderLeft: '3px solid var(--primary)' }}
            >
              <h4 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HelpCircle size={20} color="var(--primary)" /> {item.q}
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.8 }}>{item.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🚀 Coming Soon: The Innovation Roadmap */}
      <section style={{ padding: '8rem 0', overflow: 'hidden' }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(182, 139, 245, 0.08) 0%, rgba(0,0,0,0) 100%)',
            border: '2px solid rgba(182, 139, 245, 0.2)',
            padding: '5rem',
            borderRadius: '48px',
            position: 'relative'
          }}
        >
          <div style={{ position: 'absolute', top: '2rem', right: '3rem', display: 'flex', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
          </div>

          <div style={{ maxWidth: '800px' }}>
            <div className="badge" style={{ marginBottom: '1.5rem', background: 'rgba(182, 139, 245, 0.1)', color: 'var(--primary)' }}>
              <span>Q3 2026</span>
            </div>
            <h2 style={{ fontSize: '4.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
              The Future of <span className="gradient-text">Elite Privacy.</span>
            </h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '4rem', lineHeight: 1.6 }}>
              We are expanding the TempGenPro ecosystem to provide absolute anonymity across all digital communication layers.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <motion.div
                whileHover={{ y: -10 }}
                style={{ background: 'rgba(0,0,0,0.3)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border)' }}
              >
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <MessageSquare size={24} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>Permanent WhatsApp</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>Deploy exclusive, virtual WhatsApp numbers for permanent private Business communication without revealing your personal SIM details.</p>
                <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', fontWeight: 900, color: '#25D366', textTransform: 'uppercase' }}>Coming Soon</div>
              </motion.div>

              <motion.div
                whileHover={{ y: -10 }}
                style={{ background: 'rgba(0,0,0,0.3)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border)' }}
              >
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(182, 139, 245, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Globe size={24} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>Social-Ready Relays</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>Business Plans will unlock premium 'High-Reputation' domains which can be used to create accounts on social media platforms like Facebook, Instagram, and many more.</p>
                <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase' }}>Coming Soon</div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
