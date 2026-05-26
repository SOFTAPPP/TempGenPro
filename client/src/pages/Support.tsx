import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, MessageSquare, Send, CheckCircle, HelpCircle } from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import SEO from '../components/SEO';

const Support: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      showNotification('Please fill out all fields before sending.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/support', { name, email, message });
      setSubmitted(true);
      showNotification('Support inquiry sent successfully!', 'success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.detail || 'Failed to submit inquiry. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '6rem 1.5rem 3rem' }}>
      <SEO
        title="Support Center | TempGenPro"
        description="Contact the TempGenPro support team for assistance with temporary email services, account setups, or feature inquiries."
        keywords="temp email support, disposable mail help, tempgenpro contact, privacy help"
      />

      <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}
          >
            <HelpCircle size={32} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-bold)', marginBottom: '0.5rem' }}
          >
            Support Center
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}
          >
            Have a question or running into an issue? Drop us a line.
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card glass"
              style={{ padding: '2.5rem', border: '1px solid var(--border)' }}
            >
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="name" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-bold)', fontSize: '1rem', transition: 'all 0.3s' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="email" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                      style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-bold)', fontSize: '1rem', transition: 'all 0.3s' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="message" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Message</label>
                  <div style={{ position: 'relative' }}>
                    <MessageSquare size={18} style={{ position: 'absolute', left: '16px', top: '18px', color: 'var(--text-muted)' }} />
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue or question in detail..."
                      rows={5}
                      required
                      style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-bold)', fontSize: '1rem', transition: 'all 0.3s', resize: 'vertical' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', padding: '1.1rem', borderRadius: '14px', marginTop: '1rem', justifyContent: 'center', fontSize: '1rem' }}
                >
                  {loading ? (
                    'Transmitting...'
                  ) : (
                    <>
                      <Send size={18} /> Send Message
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '3.5rem', background: 'rgba(182, 139, 245, 0.03)', border: '2px dashed var(--primary)', borderRadius: '24px' }}
            >
              <CheckCircle size={56} color="var(--primary)" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-bold)', marginBottom: '1rem' }}>Inquiry Transmitted</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                Your message has been sent to our support queue. A representative will contact you at <strong>{email}</strong> if a reply is required.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="btn btn-secondary"
                style={{ padding: '0.8rem 2rem', borderRadius: '12px' }}
              >
                Send Another Message
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Support;
