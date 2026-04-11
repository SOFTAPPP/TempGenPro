import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Mail, Copy, Star, ArrowRight } from 'lucide-react';
import SmartLink from '../components/SmartLink';

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
    </div>
  );
};

export default Home;
