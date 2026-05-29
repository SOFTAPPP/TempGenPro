import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle, Edit2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import SEO from '../components/SEO';

interface TempEmail {
  id: number;
  email: string;
  isActive: boolean;
}

const SendMail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [emails, setEmails] = useState<TempEmail[]>([]);
  const [selectedFrom, setSelectedFrom] = useState('');
  const [toEmail, setToEmail] = useState(location.state?.toEmail || '');
  const [subject, setSubject] = useState(location.state?.subject || '');
  const [body, setBody] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetchingEmails, setFetchingEmails] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchUserEmails = async () => {
      try {
        const res = await api.get('/emails');
        setEmails(res.data);
        
        // Determine default sender email
        const passedEmail = location.state?.fromEmail;
        if (passedEmail && res.data.some((e: TempEmail) => e.email === passedEmail)) {
          setSelectedFrom(passedEmail);
        } else if (res.data.length > 0) {
          setSelectedFrom(res.data[0].email);
        }
      } catch (err) {
        console.error('Failed to fetch user emails', err);
        showNotification('Could not load your active email addresses.', 'error');
      } finally {
        setFetchingEmails(false);
      }
    };

    fetchUserEmails();
  }, [location.state, showNotification]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFrom) {
      showNotification('Please select a sender email address.', 'error');
      return;
    }
    if (!toEmail.trim()) {
      showNotification('Please specify a recipient email address.', 'error');
      return;
    }
    if (!subject.trim()) {
      showNotification('Please add a subject.', 'error');
      return;
    }
    if (!body.trim()) {
      showNotification('Please enter the email body content.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/emails/send', {
        from_email: selectedFrom,
        to_email: toEmail,
        subject: subject,
        body: body
      });
      
      setSubmitted(true);
      showNotification('Email dispatched successfully!', 'success');
      setToEmail('');
      setSubject('');
      setBody('');
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.detail || 'Failed to dispatch email. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem', minHeight: 'calc(100vh - var(--nav-height))' }}>
      <SEO
        title="Send Anonymous Email | TempGenPro"
        description="Compose and dispatch anonymous emails securely using your TempGenPro temporary relay addresses."
        keywords="send anonymous email, temp email, temporary relay, private communication"
      />

      <div style={{ maxWidth: '650px', width: '100%', margin: '0 auto' }}>
        {/* Header and Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          <button 
            onClick={() => navigate('/inbox')}
            className="btn btn-secondary" 
            style={{ padding: '0.6rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> <span className="mobile-hidden">Back to Inbox</span>
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-bold)', margin: 0, letterSpacing: '-0.02em' }}>Compose Message</h1>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {fetchingEmails ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
            </div>
          ) : emails.length === 0 ? (
            <motion.div
              key="no-emails"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card glass"
              style={{ padding: '3rem 2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-bold)', marginBottom: '0.75rem' }}>No Active Relay Nodes</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                You must deploy at least one active temporary email node to send messages.
              </p>
              <button
                onClick={() => navigate('/inbox')}
                className="btn btn-primary"
                style={{ padding: '0.8rem 2rem', borderRadius: '12px' }}
              >
                Go to Console & Deploy
              </button>
            </motion.div>
          ) : !submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card glass"
              style={{ padding: '2rem', border: '1px solid var(--border)' }}
            >
              <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* From Field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="from-select" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>From (Select Relay Node)</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <select
                      id="from-select"
                      value={selectedFrom}
                      onChange={(e) => setSelectedFrom(e.target.value)}
                      required
                      style={{ 
                        width: '100%', 
                        padding: '1rem 1rem 1rem 3rem', 
                        background: 'rgba(0,0,0,0.2)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '12px', 
                        color: 'var(--text-bold)', 
                        fontSize: '0.95rem', 
                        transition: 'all 0.3s',
                        appearance: 'none',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {emails.map((e) => (
                        <option key={e.id} value={e.email} style={{ background: 'var(--bg-secondary)', color: 'var(--text-bold)' }}>
                          {e.email}
                        </option>
                      ))}
                    </select>
                    {/* Custom Arrow */}
                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', width: '0', height: '0', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '6px solid var(--text-muted)' }}></div>
                  </div>
                </div>

                {/* To Field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="to-email" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>To Recipient</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      id="to-email"
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      placeholder="recipient@example.com"
                      required
                      style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-bold)', fontSize: '0.95rem', transition: 'all 0.3s' }}
                    />
                  </div>
                </div>

                {/* Subject Field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="subject" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Subject</label>
                  <div style={{ position: 'relative' }}>
                    <Edit2 size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject line"
                      required
                      style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-bold)', fontSize: '0.95rem', transition: 'all 0.3s' }}
                    />
                  </div>
                </div>

                {/* Body Field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="body" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Message Body</label>
                  <textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Compose your secure email content here..."
                    rows={8}
                    required
                    style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-bold)', fontSize: '0.95rem', transition: 'all 0.3s', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', padding: '1rem', borderRadius: '14px', marginTop: '1rem', justifyContent: 'center', fontSize: '1rem', fontWeight: 900 }}
                >
                  {loading ? (
                    'Routing Dispatch...'
                  ) : (
                    <>
                      <Send size={18} /> Transmit Email
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
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-bold)', marginBottom: '1rem' }}>Email Dispatched</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                Your message has been successfully routed via the secure tunnel of <strong>{selectedFrom}</strong>.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn btn-primary"
                  style={{ padding: '0.8rem 2rem', borderRadius: '12px', width: '100%', justifyContent: 'center' }}
                >
                  Send Another Email
                </button>
                <button
                  onClick={() => navigate('/inbox')}
                  className="btn btn-secondary"
                  style={{ padding: '0.8rem 2rem', borderRadius: '12px', width: '100%', justifyContent: 'center' }}
                >
                  Return to Inbox Console
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SendMail;
