import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ChevronLeft, Clock, Copy, Ghost, Inbox as InboxIcon, Mail, MessageSquare, Plus, RefreshCw, Shield, Trash2, Wand2, X, Zap, Send, Pen, ArrowRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { socketService } from '../services/socket';

interface TempEmail {
  id: number;
  email: string;
  createdAt: string;
  expiresAt: string;
  _count: { messages: number };

  // Synthetic Persona Generator Fields
  personaName?: string;
  personaJob?: string;
  personaBio?: string;
  personaAvatar?: string;
  camouflageEnabled: boolean;
}

interface Message {
  id: number;
  sender: string;
  subject: string;
  body: string;
  receivedAt: string;
  otpCode?: string;
  verificationLink?: string;
  trackersBlocked: number;
}

const stripHtml = (html: string): string => {
  if (!html) return '';
  let clean = html.replace(/<(head|script|style|title)[^>]*>[\s\S]*?<\/\1>/gi, '');
  clean = clean.replace(/<\/?[^>]+(>|$)/g, ' ');
  clean = clean
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  return clean.replace(/\s+/g, ' ').trim();
};


const stripEmailQuotes = (text: string) => {
  if (!text) return '';
  const parts = text.split(/(On\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[\s\S]*?wrote:)/i);
  let cleaned = parts[0];
  cleaned = cleaned.replace(/^>.*$/gm, '');
  return cleaned.trim();
};

const cleanRawEmail = (email: string): string => {
  if (!email) return '';
  let cleanEmail = email;
  const match = email.match(/<([^>]+)>/);
  if (match) {
    cleanEmail = match[1];
  }
  const parts = cleanEmail.split('@');
  if (parts.length < 2) return cleanEmail;
  const localPart = parts[0];
  const domain = parts[1];

  const isSystemLocal = /^[0-9a-f]{8,}[-+]|bounces|bounce|notification|noreply|no-reply/i.test(localPart) || localPart.length > 25;
  if (isSystemLocal) {
    if (localPart.toLowerCase().startsWith('bounces') || localPart.toLowerCase().startsWith('bounce')) {
      return `bounce@${domain}`;
    }
    if (localPart.toLowerCase().startsWith('noreply') || localPart.toLowerCase().startsWith('no-reply')) {
      return `noreply@${domain}`;
    }
    return `service@${domain}`;
  }
  return cleanEmail;
};



const getThreadParticipant = (sender: string) => {
  if (sender.startsWith('OUTBOUND:')) {
    return cleanRawEmail(sender.replace('OUTBOUND:', '').trim());
  }
  return cleanRawEmail(sender);
};

const getThreadSubject = (subject: string) => {
  if (!subject) return '(No Subject)';
  return subject.replace(/^(Re|Fwd):\s*/i, '').trim();
};

type Thread = {
  id: string;
  participant: string;
  subject: string;
  messages: Message[];
  latestMessageAt: string;
  trackersBlocked: number;
};

const getEmailBodyToRender = (body: string): string => {
  if (!body) return '';
  if (body.includes('--- mail_boundary ---')) {
    const parts = body.split('--- mail_boundary ---');
    const htmlPart = parts.find(p => /<\/?[a-z][\s\S]*>/i.test(p) || p.includes('<!DOCTYPE'));
    if (htmlPart) {
      return htmlPart.trim();
    }
    const textPart = parts.find(p => p.trim().length > 0);
    return textPart ? textPart.trim() : body;
  }
  return body;
};

const getLinkContext = (subject: string, link: string) => {
  const s = (subject || '').toLowerCase();
  const l = (link || '').toLowerCase();
  if (s.includes('password') || l.includes('password') || l.includes('reset')) return 'Reset Password';
  if (s.includes('verify') || s.includes('confirm') || l.includes('verify') || l.includes('confirm')) return 'Verify Email';
  if (s.includes('activate') || l.includes('activate')) return 'Activate Account';
  if (s.includes('login') || s.includes('sign in') || l.includes('login') || l.includes('sign-in')) return 'Secure Login';
  return 'Access Secure Link';
};


const formatSender = (sender: string, subject?: string): string => {
  if (!sender) return 'Unknown';
  if (sender.startsWith('OUTBOUND:')) {
    return `To: ${sender.replace('OUTBOUND:', '').trim()}`;
  }

  const parts = sender.split('@');
  if (parts.length < 2) return sender;

  const localPart = parts[0];
  const domainPart = parts[1].toLowerCase();

  if (subject) {
    const knownBrandsInSubject = [
      'ChatGPT', 'Blackbox AI', 'BlackboxAI', 'GitHub', 'LinkedIn', 'Google', 'Amazon',
      'Facebook', 'Netflix', 'Discord', 'Slack', 'Stripe', 'PayPal', 'Steam', 'Microsoft',
      'OpenAI', 'Apple', 'Spotify', 'Twitter', 'Instagram', 'Zoom', 'Adobe', 'Figma',
      'Vercel', 'Netlify', 'Heroku', 'DigitalOcean', 'Cloudflare', 'AWS', 'Atlassian'
    ];
    for (const brand of knownBrandsInSubject) {
      const escaped = brand.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(subject)) {
        return brand === 'BlackboxAI' ? 'Blackbox AI' : brand;
      }
    }
  }

  const isSystemLocal = /^[0-9a-f]{8,}[-+]|bounces|bounce|notification|noreply|no-reply/i.test(localPart) || localPart.length > 25;

  const getFriendlyDomainName = (domain: string): string => {
    let clean = domain.replace(/^(send|bounce|bounces|mail|email|reply|notification|notifications|info|support|alert|alerts|marketing|news|newsletter|msg|hello|service|services|aws|ses)\./i, '');
    const domainParts = clean.split('.');
    if (domainParts.length >= 2) {
      let mainName = domainParts[domainParts.length - 2];
      if (['co', 'com', 'org', 'net', 'edu', 'gov'].includes(mainName) && domainParts.length >= 3) {
        mainName = domainParts[domainParts.length - 3];
      }
      return mainName;
    }
    return domainParts[0] || '';
  };

  const friendlyDomain = getFriendlyDomainName(domainPart);

  const capitalize = (str: string): string => {
    if (!str) return '';
    const mappings: Record<string, string> = {
      'blackboxai': 'Blackbox AI',
      'openai': 'OpenAI',
      'chatgpt': 'ChatGPT',
      'github': 'GitHub',
      'google': 'Google',
      'linkedin': 'LinkedIn',
      'facebook': 'Facebook',
      'instagram': 'Instagram',
      'twitter': 'Twitter',
      'x': 'X',
      'netflix': 'Netflix',
      'spotify': 'Spotify',
      'amazon': 'Amazon',
      'microsoft': 'Microsoft',
      'apple': 'Apple',
      'slack': 'Slack',
      'discord': 'Discord',
      'zoom': 'Zoom',
      'stripe': 'Stripe',
      'paypal': 'PayPal'
    };
    const lower = str.toLowerCase();
    if (mappings[lower]) return mappings[lower];

    return str.split(/[-_]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (isSystemLocal && friendlyDomain) {
    return capitalize(friendlyDomain);
  }

  if (!isSystemLocal) {
    const genericLocals = [
      'support', 'info', 'noreply', 'no-reply', 'contact', 'hello', 'admin', 'billing',
      'jobs', 'careers', 'help', 'team', 'feedback', 'security', 'hr', 'reply', 'replies',
      'service', 'services', 'alert', 'alerts', 'notification', 'notifications', 'news',
      'newsletter', 'marketing', 'sales', 'orders', 'updates', 'update', 'verify',
      'verification', 'otp', 'auth', 'register', 'confirm', 'mail', 'email', 'postmaster'
    ];
    if (genericLocals.includes(localPart.toLowerCase()) && friendlyDomain) {
      return capitalize(friendlyDomain);
    }
    return capitalize(localPart);
  }
  return friendlyDomain ? capitalize(friendlyDomain) : capitalize(localPart);
};



const extractOtpFromText = (subject: string, body: string): string | null => {
  const cleanBody = (text: string): string => {
    if (!text) return '';
    let clean = text.replace(/<(head|script|style|title)[^>]*>[\s\S]*?<\/\1>/gi, '');
    clean = clean.replace(/<\/?[^>]+(>|$)/g, ' ');
    clean = clean
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
    return clean;
  };

  const clean = cleanBody(body);

  const patterns = [
    // Pattern 1: Hyphenated alphanumeric (e.g. WPW-YP3, G-123456) with optional spaces
    /\b[a-zA-Z0-9]{2,6}\s*-\s*[a-zA-Z0-9]{2,6}\b/g,
    // Pattern 2: Alphanumeric containing both letters and digits (e.g. A1B2C3)
    /\b(?=[a-zA-Z]*\d)(?=\d*[a-zA-Z])[a-zA-Z0-9]{4,10}\b/g,
    // Pattern 3: Pure digits (4 to 8 digits)
    /\b\d{4,8}\b/g,
    // Pattern 4: Space separated digits like 123 456
    /\b\d{3,6}[-\s]+\d{3,6}\b/g
  ];

  const yearBlacklist = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

  // Check subject first
  if (subject) {
    for (const pattern of patterns) {
      const matches = subject.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (/^\d+$/.test(match)) {
            if (!yearBlacklist.includes(match)) {
              return match;
            }
          } else {
            return match;
          }
        }
      }
    }
  }

  // Check body
  if (clean) {
    for (const pattern of patterns) {
      const matches = clean.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (/^\d+$/.test(match)) {
            if (!yearBlacklist.includes(match)) {
              return match;
            }
          } else {
            return match;
          }
        }
      }
    }
  }

  // Fallback: check if subject has any digits
  if (subject) {
    const subjectDigits = subject.match(/\b\d{4,8}\b/g);
    if (subjectDigits && subjectDigits.length > 0) {
      return subjectDigits[0];
    }
  }

  // Fallback: check if body has any digits (even if they are years)
  if (clean) {
    const bodyDigits = clean.match(/\b\d{4,8}\b/g);
    if (bodyDigits && bodyDigits.length > 0) {
      for (const match of bodyDigits) {
        if (!yearBlacklist.includes(match)) {
          return match;
        }
      }
      return null;
    }
  }

  return null;
};

const ConfirmationModal: React.FC<{
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type: 'danger' | 'warning';
}> = ({ show, onClose, onConfirm, title, message, type }) => (
  <AnimatePresence>
    {show && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-card"
          style={{ position: 'relative', maxWidth: '450px', width: '100%', padding: '2.5rem', border: `1px solid ${type === 'danger' ? '#ef4444' : '#f59e0b'}`, textAlign: 'center', zIndex: 3001 }}
        >
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: type === 'danger' ? '#ef4444' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <AlertTriangle size={30} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-bold)' }}>{title}</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>{message}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%' }}>Cancel</button>
            <button
              onClick={onConfirm}
              className="btn"
              style={{ width: '100%', background: type === 'danger' ? '#ef4444' : '#f59e0b', color: 'white' }}
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const parseStreamedEmail = (text: string) => {
  let subject = '';
  let body = '';

  // Clean up any potential markdown wraps
  let cleanText = text;
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
  }

  const subjectMatch = cleanText.match(/SUBJECT:\s*/i);
  const bodyMatch = cleanText.match(/\n?BODY:\s*\n?/i);

  if (subjectMatch) {
    const subjectStart = subjectMatch.index! + subjectMatch[0].length;
    if (bodyMatch) {
      const bodyStart = bodyMatch.index! + bodyMatch[0].length;
      subject = cleanText.substring(subjectStart, bodyMatch.index!).trim();
      body = cleanText.substring(bodyStart).trim();
    } else {
      subject = cleanText.substring(subjectStart).trim();
    }
  } else {
    if (bodyMatch) {
      const bodyStart = bodyMatch.index! + bodyMatch[0].length;
      body = cleanText.substring(bodyStart).trim();
    } else {
      subject = cleanText.trim();
    }
  }

  return { subject, body };
};

const AiGeneratorModal: React.FC<{
  show: boolean;
  onClose: () => void;
}> = ({ show, onClose }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);
  const { showNotification } = useNotification();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult({ subject: '', body: '' });
    try {
      const AI_API_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:5005';
      const response = await fetch(`${AI_API_BASE_URL}/generate-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body received from server.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulatedText += decoder.decode(value, { stream: true });

        const { subject, body } = parseStreamedEmail(accumulatedText);
        setResult({ subject, body });
      }

      showNotification('Professional email generated successfully!');
    } catch (err) {
      console.error(err);
      showNotification('Failed to generate email. Make sure AI service is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard');
  };

  return (
    <AnimatePresence>
      {show && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card"
            style={{ position: 'relative', maxWidth: '600px', width: '100%', padding: '2.5rem', border: '1px solid var(--primary)', zIndex: 4001, overflowY: 'auto', maxHeight: '90vh' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wand2 size={20} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-bold)' }}>AI Email Generator</h3>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>What is the email about?</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Asking for a refund for a damaged product..."
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-bold)', minHeight: '100px', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 900, marginBottom: '2rem' }}
            >
              {loading ? <RefreshCw size={20} className="animate-spin" /> : <><Wand2 size={18} /> GENERATE PROFESSIONAL EMAIL</>}
            </button>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-light)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase' }}>Generated Content</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => copyToClipboard(`Subject: ${result.subject}\n\n${result.body}`)} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}>
                      <Copy size={14} /> COPY ALL
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>Subject:</p>
                  <p style={{ fontWeight: 800, color: 'var(--text-bold)', margin: 0 }}>{result.subject}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>Body:</p>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                    {result.body}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const MAX_EMAILS = 5;

const Inbox: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [emails, setEmails] = useState<TempEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<TempEmail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const threads = React.useMemo(() => {
    const threadMap: Record<string, Thread> = {};
    messages.forEach(msg => {
      const participant = getThreadParticipant(msg.sender) || 'Unknown';
      const cleanSubj = getThreadSubject(msg.subject);
      const threadId = `${participant}|${cleanSubj}`;

      if (!threadMap[threadId]) {
        threadMap[threadId] = {
          id: threadId,
          participant,
          subject: cleanSubj,
          messages: [],
          latestMessageAt: msg.receivedAt,
          trackersBlocked: 0
        };
      }
      
      threadMap[threadId].messages.push(msg);
      threadMap[threadId].trackersBlocked += msg.trackersBlocked;
      
      if (new Date(msg.receivedAt).getTime() > new Date(threadMap[threadId].latestMessageAt).getTime()) {
        threadMap[threadId].latestMessageAt = msg.receivedAt;
      }
    });

    return Object.values(threadMap).sort((a, b) => 
      new Date(b.latestMessageAt).getTime() - new Date(a.latestMessageAt).getTime()
    );
  }, [messages]);

  const selectedThread = threads.find(t => t.id === selectedThreadId) || null;
  const [msgLoading, setMsgLoading] = useState(false);
  const [usePersona, setUsePersona] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMobileMessages, setShowMobileMessages] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [socketStatus, setSocketStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread || !selectedEmail) return;
    setIsSendingReply(true);
    try {
      await api.post('/emails/send', {
        from_email: selectedEmail.email,
        to_email: selectedThread.participant,
        subject: selectedThread.subject.startsWith('Re:') ? selectedThread.subject : `Re: ${selectedThread.subject}`,
        body: replyText
      });
      setReplyText('');
      showNotification('Reply sent successfully!', 'success');
      setTimeout(() => fetchMessages(selectedEmail.id, true), 1000);
    } catch (err: any) {
      showNotification(err.response?.data?.detail || 'Failed to send reply', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning';
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'danger'
  });

  useEffect(() => {
    if (confirmState.show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [confirmState.show]);

  const fetchEmails = React.useCallback(async () => {
    try {
      const res = await api.get('/emails');
      setEmails(res.data);
      if (res.data.length > 0 && !selectedEmailRef.current) {
        if (window.innerWidth > 900) {
          setSelectedEmail(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching emails');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = React.useCallback(async (emailId: number, silent = false) => {
    if (!silent) setMsgLoading(true);
    try {
      const res = await api.get(`/emails/${emailId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages');
    } finally {
      if (!silent) setMsgLoading(false);
    }
  }, []);

  const fetchMessageDetail = React.useCallback(async (msgId: number, currentBody: string) => {
    // ⚡ Only fetch full detail if body appears truncated (ends with '...')
    if (!currentBody.endsWith('...')) return;
    try {
      const res = await api.get(`/emails/messages/${msgId}`);
      // Update in place once full body arrives
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, body: res.data.body } : m));
    } catch (err) {
      // Silently fail - user already sees the truncated body
    }
  }, []);

  useEffect(() => {
    fetchEmails();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60);
    return () => clearInterval(timer);
  }, [fetchEmails]);

  const selectedEmailRef = React.useRef(selectedEmail);
  useEffect(() => {
    selectedEmailRef.current = selectedEmail;
  }, [selectedEmail]);

  // ⚡ Global Socket Connection
  useEffect(() => {
    if (user) {
      const socket = socketService.connect();
      const updateStatus = () => setSocketStatus(socket.connected ? 'connected' : 'disconnected');
      socket.on('connect', updateStatus);
      socket.on('disconnect', updateStatus);
      updateStatus();

      socketService.onGlobalEmail(({ email }) => {
        // ⚡ Update the sidebar counts instantly
        setEmails(prevEmails =>
          prevEmails.map(e =>
            e.email === email
              ? { ...e, _count: { ...e._count, messages: (e._count?.messages || 0) + 1 } }
              : e
          )
        );

        // ⚡ Show a Toast Notification if it's not the currently active email
        if (selectedEmailRef.current?.email !== email) {
          showNotification(`New Packet Received: ${email}`, 'success');
        }
      });

      return () => {
        socketService.off('new_email_global');
        socket.off('connect', updateStatus);
        socket.off('disconnect', updateStatus);
      };
    }
  }, [user]);

  // 🔄 Smart Polling Fallback (Backup for Socket Connectivity)
  useEffect(() => {
    if (selectedEmail && socketStatus !== 'connected') {
      const pollInterval = setInterval(() => {
        console.log('[Polling] Socket offline, fetching latest packets...');
        fetchMessages(selectedEmail.id, true);
      }, 15000); // 15s poll when disconnected
      return () => clearInterval(pollInterval);
    }
  }, [selectedEmail, socketStatus, fetchMessages]);

  // ⚡ Specific Inbox Socket
  useEffect(() => {
    if (selectedEmail) {
      fetchMessages(selectedEmail.id);
      setSelectedThreadId(null); // Reset detail view when switching relay
      setShowMobileMessages(true);
      socketService.joinInbox(selectedEmail.email);
      socketService.onNewEmail((newMessage: Message) => {
        setMessages(prev => {
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [newMessage, ...prev];
        });
      });
      return () => {
        socketService.offNewEmail();
      };
    }
  }, [selectedEmail]);

  const getTimeRemaining = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    const diff = expiry.getTime() - currentTime.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const generateNew = React.useCallback(async (type?: string) => {
    setIsGenerating(true);
    try {
      const res = await api.post('/emails/generate', { type, includePersona: usePersona });
      const newNode = {
        ...res.data,
        _count: res.data._count || { messages: 0 }
      };
      setEmails(prev => [newNode, ...prev]);
      setSelectedEmail(newNode);
      const successMsg = type === 'social' ? 'Social Relay (mysocialrelay.com) Deployed.' :
        type === 'main' ? 'Main Relay (tempgenpro.com) Deployed.' :
          'Relay Node Deployed Successfully.';
      showNotification(successMsg);
    } catch (err: any) {
      if (err.response?.status === 403) {
        showNotification(err.response.data.error || 'Inventory limit reached.', 'error');
      } else {
        console.error('Deployment error:', err);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [showNotification, usePersona]);

  const deleteEmail = React.useCallback((id: number) => {
    setConfirmState({
      show: true,
      title: 'DISCONNECT RELAY',
      message: 'Are you sure you want to delete this temporary email? All messages will be permanently lost.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/emails/${id}`);
          setEmails(prev => prev.filter(e => e.id !== id));
          if (selectedEmail?.id === id) {
            setSelectedEmail(null);
            setShowMobileMessages(false);
          }
          setConfirmState(prev => ({ ...prev, show: false }));
          showNotification('Relay Node Disconnected.');
        } catch (err) {
          showNotification('Failed to disconnect relay.', 'error');
        }
      }
    });
  }, [selectedEmail, showNotification]);

  const handleDeleteMessage = (id: number) => {
    setConfirmState({
      show: true,
      title: 'ERASE PACKET',
      message: 'Are you sure you want to permanently delete this specific message?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/emails/messages/${id}`);
          setMessages(messages.filter(m => m.id !== id));
          setSelectedThreadId(null);
          setConfirmState(prev => ({ ...prev, show: false }));
          showNotification('Packet Permanently Erased.');
        } catch (err) {
          showNotification('Failed to erase packet.', 'error');
        }
      }
    });
  };

  const handleToggleCamouflage = async (id: number) => {
    try {
      const res = await api.post(`/emails/${id}/camouflage`);
      setEmails(prev => prev.map(e => e.id === id ? { ...e, camouflageEnabled: res.data.camouflageEnabled } : e));
      if (selectedEmail?.id === id) {
        setSelectedEmail(prev => prev ? { ...prev, camouflageEnabled: res.data.camouflageEnabled } : null);
      }
      showNotification(res.data.camouflageEnabled ? 'Camouflage Mode Activated (AI Noise Engaged)' : 'Camouflage Mode Deactivated');
    } catch (err) {
      showNotification('Failed to toggle camouflage', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  const renderMessageBody = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--primary)', textDecoration: 'underline', wordBreak: 'break-all' }}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };


  return (
    <div className="inbox-container">
      <ConfirmationModal
        show={confirmState.show}
        onClose={() => setConfirmState(prev => ({ ...prev, show: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
      />

      <AiGeneratorModal
        show={showAiModal}
        onClose={() => setShowAiModal(false)}
      />

      <AnimatePresence>
        {showCopyToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="copy-toast" style={{ position: 'fixed', bottom: '2rem', left: '50%', zIndex: 4000, background: 'var(--primary)', color: '#000', padding: '0.8rem 1.5rem', borderRadius: '100px', fontWeight: 900, boxShadow: '0 10px 40px rgba(182, 139, 245, 0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Copy size={16} /> Data Copied
          </motion.div>
        )}
      </AnimatePresence>

      <div className="inbox-layout">

        {/* Sidebar: Private Relay Nodes */}
        <aside className={`glass-sidebar ${showMobileMessages ? 'mobile-hidden' : ''}`}>
          <div className="sidebar-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-bold)' }}>RELAY NODES</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: socketStatus === 'connected' ? '#10b981' : '#ef4444' }}></div>
                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)' }}>{socketStatus === 'connected' ? 'SECURE' : 'OFFLINE'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {(user as any)?.role === 'ADMIN' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '50px', border: '1px solid var(--border)', marginRight: '4px' }}>
                  <button
                    className="btn btn-sm"
                    onClick={() => generateNew('main')}
                    disabled={isGenerating}
                    title="Deploy on tempgenpro.com"
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '50px',
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      border: 'none',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    Main
                  </button>
                  <div style={{ width: '1px', height: '12px', background: 'var(--border)' }}></div>
                  <button
                    className="btn btn-sm"
                    onClick={() => generateNew('social')}
                    disabled={isGenerating}
                    title="Deploy on mysocialrelay.com"
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '50px',
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      background: 'rgba(182, 139, 245, 0.15)',
                      color: 'var(--primary)',
                      border: 'none',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
                  >
                    Relay
                  </button>
                </div>
              )}
              {(user as any)?.role !== 'ADMIN' && (
                <div className="limit-badge">
                  <Mail size={12} />
                  <span>{emails.length}/{MAX_EMAILS}</span>
                </div>
              )}
              {((user as any)?.role === 'ADMIN' || emails.length < MAX_EMAILS) && (
                <button className="btn btn-primary btn-nav-round" onClick={() => generateNew()} disabled={isGenerating} style={{ width: '38px', height: '38px', borderRadius: '50%' }}>
                  {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={20} />}
                </button>
              )}
              <button
                className="btn btn-secondary btn-nav-round"
                onClick={() => setShowAiModal(true)}
                title="AI Email Generator"
                style={{ width: '38px', height: '38px', borderRadius: '50%', color: 'var(--primary)' }}
              >
                <Wand2 size={20} />
              </button>
            </div>
          </div>
          <div className="sidebar-content" style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* ⚡ Identity Generator Toggle */}
            <div style={{ padding: '0.75rem 0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ color: usePersona ? 'var(--primary)' : 'var(--text-muted)' }}>
                  <Ghost size={14} />
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-bold)', margin: 0 }}>GENERATE PERSONA</p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', margin: 0 }}>AI Identity for Node</p>
                </div>
              </div>
              <label
                className="switch"
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '34px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={usePersona}
                  onChange={(e) => setUsePersona(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  className="slider"
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: usePersona ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    transition: '0.4s',
                    borderRadius: '34px',
                    boxShadow: usePersona ? '0 0 10px var(--primary-shadow)' : 'none'
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      content: '""',
                      height: '12px', width: '12px',
                      left: usePersona ? '18px' : '3px',
                      bottom: '3px',
                      backgroundColor: usePersona ? '#000' : 'var(--text-muted)',
                      transition: '0.4s',
                      borderRadius: '50%'
                    }}
                  />
                </span>
              </label>
            </div>
            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={24} className="animate-spin text-primary" />
              </div>
            ) : emails.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                  <AlertTriangle size={24} opacity={0.3} />
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-bold)', marginBottom: '0.5rem' }}>No Active Nodes</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '2rem' }}>Deploy your first communication tunnel to begin.</p>
                <button onClick={() => generateNew()} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', fontSize: '0.8rem', boxShadow: '0 0 20px var(--primary-glow)' }}>
                  <Plus size={16} /> Deploy Node
                </button>
              </div>
            ) : (
              emails.map(email => (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`email-item ${selectedEmail?.id === email.id ? 'active' : ''}`}
                  style={{ padding: '1.2rem', borderRadius: '16px', marginBottom: '0.75rem', cursor: 'pointer', position: 'relative', border: selectedEmail?.id === email.id ? '1px solid var(--primary)' : '1px solid var(--border)', transition: 'all 0.3s ease', background: selectedEmail?.id === email.id ? 'rgba(182, 139, 245, 0.08)' : 'rgba(255,255,255,0.01)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, marginBottom: '6px' }}>
                    <span style={{ color: selectedEmail?.id === email.id ? 'var(--primary)' : 'var(--text-bold)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{email.email.split('@')[0]}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteEmail(email.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', padding: 0, opacity: 0.8 }}><Trash2 size={15} /></button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {getTimeRemaining(email.expiresAt)}</span>
                    <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900 }}>{email._count.messages} PKTS</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </aside>

        {/* Main Console: Gmail System */}
        <div className={`glass-main ${!showMobileMessages ? 'mobile-hidden' : ''}`}>
          <AnimatePresence mode="wait">
            {!selectedEmail ? (
              <motion.div
                key="none"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: '2rem' }}
              >
                <div style={{ position: 'relative', marginBottom: '3rem' }}>
                  <div style={{ position: 'absolute', inset: -40, background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', opacity: 0.4, borderRadius: '50%', filter: 'blur(40px)' }}></div>
                  <div style={{ width: '120px', height: '120px', borderRadius: '35%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', position: 'relative', backdropFilter: 'blur(10px)' }}>
                    <InboxIcon size={48} opacity={0.6} />
                  </div>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-bold)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Initialize Interception</h2>
                <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.6, marginBottom: '2.5rem' }}>Connect to a secure relay node from the terminal panel on the left to monitor decentralized data transmissions.</p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAiModal(true)}
                  className="btn btn-primary"
                  style={{
                    padding: '1.2rem 2.5rem',
                    borderRadius: '16px',
                    fontSize: '1rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 0 30px var(--primary-glow)',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
                    color: '#000',
                    border: 'none'
                  }}
                >
                  <Wand2 size={22} /> WRITE PROFESSIONAL EMAIL (AI)
                </motion.button>

                <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem', opacity: 0.4 }}>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-bold)' }}>256-bit</div><p style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800 }}>Encryption</p></div>
                  <div style={{ height: '30px', width: '1px', background: 'var(--border)' }}></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-bold)' }}>Zero</div><p style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800 }}>Log Policy</p></div>
                  <div style={{ height: '30px', width: '1px', background: 'var(--border)' }}></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-bold)' }}>Instant</div><p style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800 }}>Shredding</p></div>
                </div>
              </motion.div>
            ) : selectedThread ? (
              /* --- PACKET READER (DETAIL VIEW) --- */
              <motion.div
                key="detail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}
              >
                <div className="inbox-msg-detail-topbar" style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
                  <button onClick={() => setSelectedThreadId(null)} className="btn btn-secondary btn-sm" style={{ padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 800 }}>
                    <ChevronLeft size={18} /> BACK TO INBOX
                  </button>
                  <div style={{ height: '24px', width: '1px', background: 'var(--border)' }}></div>
                  <button onClick={() => { selectedThread.messages.forEach(m => handleDeleteMessage(m.id)); setSelectedThreadId(null); }} className="btn btn-nav-round" style={{ width: '36px', height: '36px', color: '#ef4444' }}>
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="inbox-msg-detail-body" style={{ flex: 1, overflowY: 'auto', padding: '4rem 2rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%', flex: 1 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2.5rem', lineHeight: 1.1, color: 'var(--text-bold)', wordBreak: 'break-word' }}>{selectedThread.subject}</h1>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
                    {selectedThread.messages.slice().reverse().map((msg) => {
                      const bodyToRender = getEmailBodyToRender(msg.body);
                      const cleanBodyToRender = stripEmailQuotes(bodyToRender);
                      const isHtml = /<\/?(html|body|div|p|br|table|strong|b|em|span|a|img|ul|li|h[1-6])[^>]*>/i.test(cleanBodyToRender) || cleanBodyToRender.includes('<!DOCTYPE');
                      
                      const otpToRender = extractOtpFromText(msg.subject, bodyToRender) || msg.otpCode || null;
                      const isOutbound = msg.sender.startsWith('OUTBOUND:');
                      if (isHtml) {
                        return (
                          <div key={msg.id} style={{ width: '100%', marginBottom: '2.5rem', opacity: msg.id === selectedThread.messages[0].id ? 1 : 0.8, transition: 'opacity 0.2s' }}>
                            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                               <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                 {formatSender(msg.sender, msg.subject)[0].toUpperCase()}
                               </div>
                               <div>
                                 <div style={{ fontWeight: 800 }}>{formatSender(msg.sender, msg.subject)}</div>
                                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '4px' }}>
                                   <div style={{ display: 'flex', gap: '8px' }}><span style={{ opacity: 0.5, width: '40px' }}>From:</span> <span>{msg.sender.includes('@') && msg.sender.split('@')[0].length > 25 ? `support@${msg.sender.split('@')[1]}` : msg.sender}</span></div>
                                   <div style={{ display: 'flex', gap: '8px' }}><span style={{ opacity: 0.5, width: '40px' }}>To:</span> <span>{selectedEmail.email}</span></div>
                                   <div style={{ display: 'flex', gap: '8px' }}><span style={{ opacity: 0.5, width: '40px' }}>Date:</span> <span>{new Date(msg.receivedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
                                 </div>
                               </div>
                            </div>
                            
                            {msg?.verificationLink ? (
                               <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                                 <div className="otp-card glass-card" style={{ background: 'rgba(182, 139, 245, 0.03)', border: '2px solid var(--primary)', borderRadius: '24px', padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', width: 'fit-content' }}>
                                   <div style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.3em', color: 'var(--primary)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>ACTION REQUIRED</div>
                                   <motion.a 
                                     href={msg.verificationLink} 
                                     target="_blank" 
                                     rel="noopener noreferrer" 
                                     className="btn btn-primary otp-btn" 
                                     onClick={() => {
                                       navigator.clipboard.writeText(msg.verificationLink || '');
                                       showNotification('Verification link copied to clipboard');
                                     }}
                                     whileHover={{ scale: 1.03, translateY: -2 }} 
                                     whileTap={{ scale: 0.97, translateY: 0 }} 
                                     style={{ padding: '1rem 3rem', borderRadius: '14px', fontWeight: 900, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'var(--primary)', color: '#000', textDecoration: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(182, 139, 245, 0.4)' }}
                                   >
                                     {getLinkContext(msg.subject, msg.verificationLink)} <ArrowRight size={20} />
                                   </motion.a>
                                 </div>
                               </div>
                            ) : otpToRender ? (
                               <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                                 <div className="otp-card glass-card" style={{ background: 'rgba(182, 139, 245, 0.03)', border: '2px solid var(--primary)', borderRadius: '24px', padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', width: 'fit-content' }}>
                                   <div style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.3em', color: 'var(--primary)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>SECURITY VERIFICATION CODE</div>
                                   <div className="otp-code-display" style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '0.4em', fontFamily: 'monospace', color: 'var(--text-bold)', textShadow: '0 0 20px var(--primary-glow)', marginBottom: '1.5rem' }}>{otpToRender}</div>
                                   <motion.button onClick={() => copyToClipboard(otpToRender)} className="btn btn-primary otp-btn" whileHover={{ scale: 1.03, translateY: -2 }} whileTap={{ scale: 0.97, translateY: 0 }} style={{ padding: '1rem 3rem', borderRadius: '14px', fontWeight: 900, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: '#000', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(182, 139, 245, 0.4)' }}><Copy size={20} /> COPY CODE</motion.button>
                                 </div>
                               </div>
                            ) : null}

                            <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)', background: '#ffffff', minHeight: '600px' }}>
                               <iframe
                                  title="Packet Content"
                                  srcDoc={`
                                    <html>
                                      <head>
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                        <base target="_blank">
                                        <style>
                                          html, body {
                                            margin: 0; padding: 0; background-color: #ffffff; color: #222222;
                                            max-width: 100% !important; overflow-x: hidden !important;
                                          }
                                          body {
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                            padding: 24px; line-height: 1.5; box-sizing: border-box !important;
                                          }
                                          img { max-width: 100% !important; height: auto !important; }
                                          a { color: #b68bf5; text-decoration: underline; }
                                          * { box-sizing: border-box !important; }
                                          table { width: 100% !important; }
                                          td { word-break: break-word !important; }
                                        </style>
                                      </head>
                                      <body>${cleanBodyToRender}</body>
                                    </html>
                                  `}
                                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                                  style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none', background: '#ffffff' }}
                               />
                            </div>
                          </div>
                        );
                      }

                      return (
                      <div key={msg.id} style={{ 
                        opacity: msg.id === selectedThread.messages[0].id ? 1 : 0.8, 
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOutbound ? 'flex-end' : 'flex-start',
                        marginBottom: '1rem',
                        width: '100%'
                      }}>
                        <div className="inbox-thread-msg-bubble-wrapper" style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexDirection: isOutbound ? 'row-reverse' : 'row' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isOutbound ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: isOutbound ? '#000' : 'var(--text-bold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', flexShrink: 0 }}>
                            {formatSender(msg.sender, msg.subject)[0].toUpperCase()}
                          </div>
                          
                          <div className="inbox-thread-msg-bubble-content" style={{
                            background: isOutbound ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                            color: isOutbound ? '#000' : 'var(--text)',
                            borderBottomLeftRadius: isOutbound ? '20px' : '4px',
                            borderBottomRightRadius: isOutbound ? '4px' : '20px',
                            border: isOutbound ? 'none' : '1px solid var(--border-light)',
                          }}>
                             {msg?.verificationLink ? (
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                  <div className="otp-card glass-card" style={{ background: isOutbound ? 'rgba(0,0,0,0.1)' : 'rgba(182, 139, 245, 0.03)', border: isOutbound ? 'none' : '2px solid var(--primary)', borderRadius: '24px', padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'fit-content', boxShadow: isOutbound ? 'none' : '0 8px 32px rgba(0,0,0,0.2)' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.3em', color: isOutbound ? '#000' : 'var(--primary)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>ACTION REQUIRED</div>
                                    <motion.a 
                                      href={msg.verificationLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="btn btn-primary otp-btn" 
                                      onClick={() => {
                                        navigator.clipboard.writeText(msg.verificationLink || '');
                                        showNotification('Verification link copied to clipboard');
                                      }}
                                      whileHover={{ scale: 1.03, translateY: -2 }} 
                                      whileTap={{ scale: 0.97, translateY: 0 }} 
                                      style={{ padding: '1rem 3rem', borderRadius: '14px', fontWeight: 900, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'var(--primary)', color: '#000', textDecoration: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(182, 139, 245, 0.4)' }}
                                    >
                                      {getLinkContext(msg.subject, msg.verificationLink)} <ArrowRight size={20} />
                                    </motion.a>
                                  </div>
                                </div>
                             ) : otpToRender ? (
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                  <div className="otp-card glass-card" style={{ background: isOutbound ? 'rgba(0,0,0,0.1)' : 'rgba(182, 139, 245, 0.03)', border: isOutbound ? 'none' : '2px solid var(--primary)', borderRadius: '24px', padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'fit-content', boxShadow: isOutbound ? 'none' : '0 8px 32px rgba(0,0,0,0.2)' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.3em', color: isOutbound ? '#000' : 'var(--primary)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>SECURITY VERIFICATION CODE</div>
                                    <div className="otp-code-display" style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '0.3em', color: isOutbound ? '#000' : '#ffffff', textShadow: isOutbound ? 'none' : '0 0 20px rgba(255,255,255,0.3)', marginBottom: '1.5rem', fontFamily: 'monospace' }}>{otpToRender}</div>
                                    <motion.button onClick={() => copyToClipboard(otpToRender)} className="btn btn-primary otp-btn" whileHover={{ scale: 1.03, translateY: -2 }} whileTap={{ scale: 0.97, translateY: 0 }} style={{ padding: '1rem 3rem', borderRadius: '14px', fontWeight: 900, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px', background: isOutbound ? '#000' : 'var(--primary)', color: isOutbound ? 'var(--primary)' : '#000', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(182, 139, 245, 0.4)' }}><Copy size={20} /> COPY CODE</motion.button>
                                  </div>
                                </div>
                             ) : null}

                             <div style={{ fontSize: '1.05rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all', width: '100%' }}>
                               {renderMessageBody(cleanBodyToRender)}
                             </div>
                          </div>
                        </div>
                        
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--text-muted)', 
                          marginTop: '8px', 
                          padding: isOutbound ? '0 50px 0 0' : '0 0 0 50px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {new Date(msg.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.trackersBlocked > 0 && (
                            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Shield size={10} /> {msg.trackersBlocked}
                            </span>
                          )}
                        </div>
                      </div>
                      )})}
                    </div>
                  </div>
                </div>

                {user?.role === 'ADMIN' && selectedThread?.messages[0] && !(/<\/?(html|body|div|p|br|table|strong|b|em|span|a|img|ul|li|h[1-6])[^>]*>/i.test(stripEmailQuotes(getEmailBodyToRender(selectedThread.messages[0].body))) || getEmailBodyToRender(selectedThread.messages[0].body).includes('<!DOCTYPE')) && (
                  <div className="inbox-reply-container" style={{ 
                    borderTop: '1px solid var(--border)', 
                    background: 'rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', gap: '1rem' }}>
                      <textarea 
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        style={{ 
                          flex: 1, 
                          background: 'rgba(255,255,255,0.05)', 
                          border: '1px solid var(--border-light)', 
                          borderRadius: '16px', 
                          padding: '1rem 1.5rem',
                          color: 'var(--text)',
                          fontSize: '1rem',
                          resize: 'none',
                          minHeight: '60px',
                          fontFamily: 'inherit'
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                      />
                      <button 
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || isSendingReply}
                        className="btn btn-primary"
                        style={{
                          borderRadius: '16px',
                          padding: '0 2rem',
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {isSendingReply ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              /* --- PACKET LIST (GMAIL VIEW) --- */
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <div className="inbox-email-header">
                  <div className="inbox-header-left">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMobileMessages(false); }}
                      className="btn btn-secondary btn-sm mobile-visible"
                      style={{ padding: '0.6rem', borderRadius: '12px' }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="mobile-hidden" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mail size={20} />
                    </div>
                    <div className="inbox-header-left-title">
                      <h2 className="inbox-email-title">{selectedEmail.email}</h2>
                      <span className="inbox-email-subtitle">Active Tunnel Pipeline</span>
                    </div>
                  </div>
                  <div className="inbox-header-actions">
                    <button
                      onClick={() => handleToggleCamouflage(selectedEmail.id)}
                      className={`btn btn-sm ${selectedEmail.camouflageEnabled ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        borderRadius: '10px',
                        padding: '0.5rem 0.75rem',
                        background: selectedEmail.camouflageEnabled ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: selectedEmail.camouflageEnabled ? '#000' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        minWidth: 'fit-content'
                      }}
                      title={selectedEmail.camouflageEnabled ? 'AI Noise Active' : 'Engage Camouflage'}
                    >
                      {selectedEmail.camouflageEnabled ? <Zap size={14} fill="currentColor" /> : <Ghost size={14} />}
                      <span className="mobile-hidden">CAMOUFLAGE: {selectedEmail.camouflageEnabled ? 'ON' : 'OFF'}</span>
                      <span className="mobile-visible">CAMO: {selectedEmail.camouflageEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                    <button onClick={() => copyToClipboard(selectedEmail.email)} className="btn btn-nav-round btn-copy" style={{ width: '34px', height: '34px' }} title="Copy Address"><Copy size={14} /></button>
                    <button onClick={() => fetchMessages(selectedEmail.id)} className="btn btn-nav-round btn-refresh" style={{ width: '34px', height: '34px' }} title="Refresh List"><RefreshCw size={14} className={msgLoading ? 'animate-spin' : ''} /></button>
                  </div>
                </div>

                {/* Identity Multiplexer: Persona Card */}
                {selectedEmail.personaName && (
                  <div className="persona-banner" style={{ padding: '1.5rem 2.5rem', background: 'rgba(182, 139, 245, 0.03)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <img src={selectedEmail.personaAvatar} alt="" style={{ width: '60px', height: '60px', borderRadius: '18px', border: '2px solid var(--primary)', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-bold)' }}>{selectedEmail.personaName}</h4>
                        <span className="badge" style={{ fontSize: '0.6rem', background: 'var(--primary)', color: '#000', padding: '2px 8px' }}>IDENTITY ASSIGNED</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>{selectedEmail.personaJob}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', maxWidth: '600px' }}>"{selectedEmail.personaBio}"</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => copyToClipboard(`Name: ${selectedEmail.personaName}\nJob: ${selectedEmail.personaJob}\nBio: ${selectedEmail.personaBio}`)} className="btn btn-secondary btn-sm mobile-hidden" style={{ borderRadius: '10px' }}>
                        <Copy size={14} /> COPY IDENTITY
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {msgLoading && messages.length === 0 ? (
                    <div style={{ padding: '6rem', textAlign: 'center' }}><RefreshCw size={40} className="animate-spin text-primary" /></div>
                  ) : messages.length === 0 ? (
                    <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                        <MessageSquare size={32} opacity={0.2} />
                      </div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Awaiting Transmissions</h3>
                      <p style={{ color: 'var(--text-muted)' }}>Incoming packets will manifest here in real-time.</p>
                    </div>
                  ) : (
                    <div className="gmail-list">
                      {threads.map(thread => {
                        const lastMsg = thread.messages[thread.messages.length - 1];
                        return (
                        <div
                          key={thread.id}
                          onClick={() => {
                            setSelectedThreadId(thread.id);
                            if (lastMsg) fetchMessageDetail(lastMsg.id, lastMsg.body);
                          }}
                          className="gmail-row"
                          style={{
                            display: 'flex',
                            padding: '1.25rem 2.5rem',
                            borderBottom: '1px solid var(--border-light)',
                            cursor: 'pointer',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                            gap: '2.5rem'
                          }}
                        >
                          <div className="gmail-row-sender" style={{ width: '180px', flexShrink: 0, fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-bold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {thread.participant}
                          </div>
                          <div className="gmail-row-body" style={{ flex: 1, display: 'flex', gap: '0.75rem', minWidth: 0, alignItems: 'baseline' }}>
                            <span className="gmail-subject" style={{ fontWeight: 800, color: 'var(--text-bold)', whiteSpace: 'nowrap', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{thread.subject}</span>
                            <span className="gmail-body-snippet" style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>- {stripHtml(getEmailBodyToRender(lastMsg?.body || '')).substring(0, 120)}</span>
                          </div>
                          <div className="gmail-row-time" style={{ width: '120px', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                            {lastMsg?.sender.startsWith('OUTBOUND:') && (
                              <span style={{ fontSize: '0.6rem', fontWeight: 900, background: 'rgba(182, 139, 245, 0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px' }}>SENT</span>
                            )}
                            {thread.trackersBlocked > 0 && (
                              <span title={`${thread.trackersBlocked} Trackers Purged`}>
                                <Shield size={14} style={{ color: '#10b981' }} />
                              </span>
                            )}
                            {new Date(thread.latestMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )})}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {selectedEmail && !selectedThread && user?.role === 'ADMIN' && (
            <button
              onClick={() => {
                navigate('/sendmail', { state: { fromEmail: selectedEmail.email } });
              }}
              className="sendmail-fab"
              title="Compose New Email"
            >
              <Pen size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;