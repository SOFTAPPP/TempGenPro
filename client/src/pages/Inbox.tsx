import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Copy, RefreshCw, MessageSquare, Clock, Inbox as InboxIcon, ChevronLeft, Mail, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface TempEmail {
  id: number;
  email: string;
  createdAt: string;
  expiresAt: string;
  _count: { messages: number };
}

interface Message {
  id: number;
  sender: string;
  subject: string;
  body: string;
  receivedAt: string;
  otpCode?: string;
}

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

const MAX_EMAILS = 5;

const Inbox: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [emails, setEmails] = useState<TempEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<TempEmail | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [showMobileMessages, setShowMobileMessages] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [socketStatus, setSocketStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

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
      if (res.data.length > 0 && !selectedEmail) {
        if (window.innerWidth > 900) {
          setSelectedEmail(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching emails');
    } finally {
      setLoading(false);
    }
  }, [selectedEmail]);

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

  const fetchMessageDetail = React.useCallback(async (msgId: number) => {
    try {
      const res = await api.get(`/emails/messages/${msgId}/detail`);
      setSelectedMessage(res.data);
      // Also update the message in the list so it's cached
      setMessages(prev => prev.map(m => m.id === msgId ? res.data : m));
    } catch (err) {
      console.error('Error fetching message detail');
    }
  }, []);

  useEffect(() => {
    fetchEmails();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60);
    return () => clearInterval(timer);
  }, [fetchEmails]);

  // ⚡ Global Socket Connection
  useEffect(() => {
    if (user) {
      const socket = socketService.connect();
      const updateStatus = () => setSocketStatus(socket.connected ? 'connected' : 'disconnected');
      socket.on('connect', updateStatus);
      socket.on('disconnect', updateStatus);
      updateStatus();

      socketService.onGlobalEmail(({ email }) => {
        setEmails(prevEmails =>
          prevEmails.map(e =>
            e.email === email
              ? { ...e, _count: { ...e._count, messages: (e._count?.messages || 0) + 1 } }
              : e
          )
        );
      });

      return () => {
        socketService.off('new_email_global');
        socket.off('connect', updateStatus);
        socket.off('disconnect', updateStatus);
      };
    }
  }, [user]);

  // ⚡ Specific Inbox Socket
  useEffect(() => {
    if (selectedEmail) {
      fetchMessages(selectedEmail.id);
      setSelectedMessage(null); // Reset detail view when switching relay
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

  const generateNew = React.useCallback(async () => {
    setIsGenerating(true);
    try {
      const res = await api.post('/emails/generate');
      const newNode = {
        ...res.data,
        _count: res.data._count || { messages: 0 }
      };
      setEmails(prev => [newNode, ...prev]);
      setSelectedEmail(newNode);
      showNotification('Relay Node Deployed Successfully.');
    } catch (err: any) {
      if (err.response?.status === 403) {
        showNotification(err.response.data.error || 'Inventory limit reached.', 'error');
      } else {
        console.error('Deployment error:', err);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [showNotification]);

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
          setSelectedMessage(null);
          setConfirmState(prev => ({ ...prev, show: false }));
          showNotification('Packet Permanently Erased.');
        } catch (err) {
          showNotification('Failed to erase packet.', 'error');
        }
      }
    });
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
          <div className="sidebar-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-bold)' }}>Relay Nodes</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: socketStatus === 'connected' ? '#10b981' : '#ef4444' }}></div>
                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)' }}>{socketStatus === 'connected' ? 'SECURE' : 'OFFLINE'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {(user as any)?.role !== 'ADMIN' && (
                <div className="limit-badge">
                  <Mail size={12} />
                  <span>{emails.length}/{MAX_EMAILS}</span>
                </div>
              )}
              {((user as any)?.role === 'ADMIN' || emails.length < MAX_EMAILS) && (
                <button className="btn btn-primary btn-nav-round" onClick={generateNew} disabled={isGenerating} style={{ width: '38px', height: '38px', borderRadius: '50%' }}>
                  {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={20} />}
                </button>
              )}
            </div>
          </div>
          <div className="sidebar-content" style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                <button onClick={generateNew} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', fontSize: '0.8rem', boxShadow: '0 0 20px var(--primary-glow)' }}>
                  <Plus size={16} /> Deploy Node
                </button>
              </div>
            ) : (
              emails.map(email => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`email-item ${selectedEmail?.id === email.id ? 'active' : ''}`}
                  style={{ padding: '1.2rem', borderRadius: '16px', marginBottom: '0.75rem', cursor: 'pointer', position: 'relative', border: '1px solid transparent', transition: 'all 0.3s ease', background: selectedEmail?.id === email.id ? 'rgba(182, 139, 245, 0.08)' : 'rgba(255,255,255,0.01)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, marginBottom: '6px' }}>
                    <span style={{ color: selectedEmail?.id === email.id ? 'var(--primary)' : 'var(--text-bold)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{email.email.split('@')[0]}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteEmail(email.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', padding: 0, opacity: 0.5 }}><Trash2 size={13} /></button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> {getTimeRemaining(email.expiresAt)}</span>
                    <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900 }}>{email._count.messages} PKTS</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </aside>

        {/* Main Console: Gmail System */}
        <main className={`glass-main ${!showMobileMessages ? 'mobile-hidden' : ''}`}>
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
                <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.6 }}>Connect to a secure relay node from the terminal panel on the left to monitor decentralized data transmissions.</p>

                <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem', opacity: 0.4 }}>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-bold)' }}>256-bit</div><p style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800 }}>Encryption</p></div>
                  <div style={{ height: '30px', width: '1px', background: 'var(--border)' }}></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-bold)' }}>Zero</div><p style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800 }}>Log Policy</p></div>
                  <div style={{ height: '30px', width: '1px', background: 'var(--border)' }}></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-bold)' }}>Instant</div><p style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800 }}>Shredding</p></div>
                </div>
              </motion.div>
            ) : selectedMessage ? (
              /* --- PACKET READER (DETAIL VIEW) --- */
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}
              >
                <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
                  <button onClick={() => setSelectedMessage(null)} className="btn btn-secondary btn-sm" style={{ padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 800 }}>
                    <ChevronLeft size={18} /> BACK TO INBOX
                  </button>
                  <div style={{ height: '24px', width: '1px', background: 'var(--border)' }}></div>
                  <button onClick={() => handleDeleteMessage(selectedMessage.id)} className="btn btn-nav-round" style={{ width: '36px', height: '36px', color: '#ef4444' }}>
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '4rem 2rem' }}>
                  <div style={{ maxWidth: '850px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2.5rem', lineHeight: 1.1, color: 'var(--text-bold)' }}>{selectedMessage.subject}</h1>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>
                          {selectedMessage.sender[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 900, color: 'var(--text-bold)', margin: 0, fontSize: '1.1rem' }}>{selectedMessage.sender}</p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Directed to: {selectedEmail.email}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{new Date(selectedMessage.receivedAt).toLocaleDateString()}</p>
                        <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>{new Date(selectedMessage.receivedAt).toLocaleTimeString()}</p>
                      </div>
                    </div>

                    {selectedMessage.otpCode && (
                      <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '24px', border: '2px solid var(--primary)', marginBottom: '4rem', textAlign: 'center', background: 'rgba(182, 139, 245, 0.03)' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '1.5rem', color: 'var(--primary)' }}>SECURITY VERIFICATION CODE</p>
                        <div style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '0.4em', fontFamily: 'monospace', color: 'var(--text-bold)', textShadow: '0 0 20px var(--primary-glow)' }}>{selectedMessage.otpCode}</div>
                        <button onClick={() => copyToClipboard(selectedMessage.otpCode || '')} className="btn btn-primary" style={{ marginTop: '2rem', padding: '1rem 3rem', borderRadius: '14px' }}>
                          <Copy size={20} /> COPY CODE
                        </button>
                      </div>
                    )}

                    <div style={{ fontSize: '1.15rem', lineHeight: 1.9, color: 'var(--text)', whiteSpace: 'pre-wrap', padding: '2.5rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', overflowWrap: 'break-word', wordBreak: 'break-all' }}>
                      {renderMessageBody(selectedMessage.body)}
                    </div>
                  </div>
                </div>
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
                <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowMobileMessages(false); }} 
                      className="btn btn-secondary btn-sm mobile-visible" 
                      style={{ padding: '0.6rem', borderRadius: '12px' }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="mobile-hidden" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Mail size={20} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>{selectedEmail.email}</h2>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Tunnel Pipeline</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => copyToClipboard(selectedEmail.email)} className="btn btn-nav-round btn-copy" title="Copy Address"><Copy size={16} /></button>
                    <button onClick={() => fetchMessages(selectedEmail.id)} className="btn btn-nav-round btn-refresh" title="Refresh List"><RefreshCw size={16} className={msgLoading ? 'animate-spin' : ''} /></button>
                  </div>
                </div>

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
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          onClick={() => {
                            setSelectedMessage(msg);
                            fetchMessageDetail(msg.id);
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
                          <div style={{ width: '180px', flexShrink: 0, fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-bold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {msg.sender.split('@')[0]}
                          </div>
                          <div style={{ flex: 1, display: 'flex', gap: '0.75rem', minWidth: 0, alignItems: 'baseline' }}>
                            <span style={{ fontWeight: 800, color: 'var(--text-bold)', whiteSpace: 'nowrap', fontSize: '0.95rem' }}>{msg.subject}</span>
                            <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>- {msg.body.substring(0, 120)}</span>
                          </div>
                          <div style={{ width: '100px', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, whiteSpace: 'nowrap' }}>
                            {new Date(msg.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Inbox;
