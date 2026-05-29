import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, ArrowRight, ChevronDown, ChevronUp, Copy, Edit2, Eye, EyeOff, Globe, Key, MessageSquare, RefreshCw, Save, Search, Shield, Trash2, Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { socketService } from '../services/socket';

interface FullUser {
  id: number;
  username: string;
  email: string;
  role: string;
  isBanned: boolean;
  password?: string;
  rawPassword?: string;
  createdAt: string;
  tempEmails: {
    id: number;
    email: string;
    isActive: boolean;
    createdAt: string;
    messages: {
      id: number;
      sender: string;
      subject: string;
      body: string;
      receivedAt: string;
      otpCode?: string;
      trackersBlocked?: number;
      verificationLink?: string;
    }[];
  }[];
}

const formatSender = (sender: string, subject?: string): string => {
  if (!sender) return 'Unknown';

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

const getEmailBodyToRender = (body: string): string => {
  if (!body) return '';
  const isHtml = /<\/?(html|body|div|p|br|table|strong|b|em|span|a|img|ul|li|h[1-6])[^>]*>/i.test(body) || body.includes('<!DOCTYPE');
  
  if (isHtml && body.includes('--- mail_boundary ---')) {
    const parts = body.split('--- mail_boundary ---');
    const htmlPart = parts.find(p => /<\/?[a-z][\s\S]*>/i.test(p) || p.includes('<!DOCTYPE'));
    return htmlPart ? htmlPart.trim() : body;
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
    // Pattern 1: Hyphenated alphanumeric (e.g. WPW-YP3, G-123456)
    /\b[a-zA-Z0-9]{2,6}-[a-zA-Z0-9]{2,6}\b/g,
    // Pattern 2: Alphanumeric containing both letters and digits (e.g. A1B2C3)
    /\b(?=[a-zA-Z]*\d)(?=\d*[a-zA-Z])[a-zA-Z0-9]{4,10}\b/g,
    // Pattern 3: Pure digits (4 to 8 digits)
    /\b\d{4,8}\b/g
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
      return bodyDigits[0];
    }
  }

  return null;
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

interface Stats {
  totalUsers: number;
  totalTempEmails: number;
  activeTempEmails: number;
  totalMessages: number;
}

interface VisitorLog {
  id: number;
  ip: string;
  userAgent: string;
  path: string;
  timestamp: string;
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
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-card"
          style={{ position: 'relative', maxWidth: '450px', width: '100%', padding: '2.5rem', border: `1px solid ${type === 'danger' ? '#ef4444' : '#f59e0b'}`, textAlign: 'center' }}
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

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [usersData, setUsersData] = useState<FullUser[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'visitors'>('users');

  // Admin controls state
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ username: '', email: '' });
  const [resettingPassword, setResettingPassword] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [processingBan, setProcessingBan] = useState<number | null>(null);
  const [processingUpdate, setProcessingUpdate] = useState<number | null>(null);
  const [processingReset, setProcessingReset] = useState<number | null>(null);

  // Create Manual Identity State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', role: 'USER' });
  const [processingCreate, setProcessingCreate] = useState(false);
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);
  const [showPasswordInList, setShowPasswordInList] = useState<Record<number, boolean>>({});

  // Custom Confirmation Modal State
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes, visitorsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats'),
        api.get('/admin/visitors')
      ]);
      setUsersData(usersRes.data);
      setStats(statsRes.data);
      setVisitorLogs(visitorsRes.data);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchData();

      // ⚡ Real-time Admin Synchronization
      socketService.connect();
      socketService.joinAdmin('ADMIN');

      socketService.onAdminStats((newStats: any) => {
        console.log('[Socket] 🛡️ Nexus update received:', newStats);
        setStats(prev => ({ ...prev, ...newStats }));
      });

      socketService.onAdminUserRefresh(() => {
        console.log('[Socket] 🛡️ Refreshing user network...');
        fetchData();
      });

      return () => {
        socketService.off('admin_stats_update');
        socketService.off('admin_user_refresh');
      };
    }
  }, [user]);

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" />;
  }

  const handleDeleteUser = (id: number) => {
    setConfirmState({
      show: true,
      title: 'ANNIHILATE USER',
      message: 'CRITICAL ACTION: This will permanently wipe this identity and all associated relays from the existence. This cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${id}`);
          setUsersData(usersData.filter(u => u.id !== id));
          setConfirmState(prev => ({ ...prev, show: false }));
          showNotification('User Identity Purged.');
        } catch (err: any) {
          showNotification(err.response?.data?.error || 'Failed to delete user.', 'error');
        }
      }
    });
  };

  const handleToggleBan = async (id: number, currentStatus: boolean) => {
    setProcessingBan(id);
    try {
      await api.post(`/admin/users/${id}/ban`);
      setUsersData(usersData.map(u => u.id === id ? { ...u, isBanned: !currentStatus } : u));
      showNotification(currentStatus ? 'User Status: RESTORED' : 'User Status: SUSPENDED', currentStatus ? 'success' : 'info');
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to toggle ban status.', 'error');
    } finally {
      setProcessingBan(null);
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    setConfirmState({
      show: true,
      title: 'PURGE PACKET',
      message: 'Are you sure you want to permanently erase this message from the database?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/messages/${messageId}`);
          fetchData();
          setConfirmState(prev => ({ ...prev, show: false }));
          showNotification('Packet Erased from Nexus.');
        } catch (err) {
          showNotification('Failed to delete message.', 'error');
        }
      }
    });
  };

  const handleDeleteEmail = (emailId: number) => {
    setConfirmState({
      show: true,
      title: 'SCRUB RELAY',
      message: 'Are you sure you want to decouple this relay from the node? All intercepted packets will be lost.',
      type: 'warning',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/temp-emails/${emailId}`);
          fetchData(); // Refresh data to show changes
          setConfirmState(prev => ({ ...prev, show: false }));
          showNotification('Relay Scrubbed Successfully.');
        } catch (err) {
          showNotification('Failed to delete relay.', 'error');
        }
      }
    });
  };

  const handleUpdateUser = async (id: number) => {
    setProcessingUpdate(id);
    try {
      const res = await api.patch(`/admin/users/${id}`, editForm);
      setUsersData(usersData.map(u => u.id === id ? { ...u, ...res.data } : u));
      setEditingUser(null);
      showNotification('User Profile Synchronized.');
    } catch (err) {
      showNotification('Failed to update user.', 'error');
    } finally {
      setProcessingUpdate(null);
    }
  };

  const handleResetPassword = async (id: number) => {
    if (!newPassword) return showNotification('New Access Key required.', 'error');
    setProcessingReset(id);
    try {
      await api.put(`/admin/users/${id}/password`, { newPassword });
      setResettingPassword(null);
      setNewPassword('');
      showNotification('User Password Overridden.');
    } catch (err) {
      showNotification('Failed to reset password.', 'error');
    } finally {
      setProcessingReset(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.username || !createForm.email || !createForm.password) {
      return showNotification('All fields are required.', 'error');
    }
    setProcessingCreate(true);
    try {
      await api.post('/admin/users', createForm);
      showNotification('Manually established identity successfully.');
      setShowCreateModal(false);
      setCreateForm({ username: '', email: '', password: '', role: 'USER' });
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to establish identity.', 'error');
    } finally {
      setProcessingCreate(false);
    }
  };

  const togglePasswordVisibility = (userId: number) => {
    setShowPasswordInList(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const startEditing = (u: FullUser) => {
    setEditingUser(u.id);
    setEditForm({ username: u.username, email: u.email });
  };

  const filteredUsers = usersData.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container" style={{ padding: '4rem 1rem', maxWidth: '1600px' }}>
      <ConfirmationModal
        show={confirmState.show}
        onClose={() => setConfirmState(prev => ({ ...prev, show: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
      />

      <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <div className="badge mb-3">Administrator Protocol</div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em', color: 'var(--text-bold)' }}>Nexus Core</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>System-wide relay monitoring and user infrastructure management.</p>
      </header>

      {/* Stats Grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {[
            { label: 'Total Nodes', value: stats.totalUsers, icon: <Users size={20} />, trend: '+4% this week' },
            { label: 'Active Relays', value: stats.totalTempEmails, icon: <Activity size={20} />, trend: 'Live' },
            { label: 'Traffic IPs', value: (stats as any).totalVisitorLogs || visitorLogs.length, icon: <Globe size={20} />, trend: 'Monitored' },
            { label: 'Packets Routed', value: stats.totalMessages, icon: <MessageSquare size={20} />, trend: 'Synchronized' }
          ].map((s, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="glass-card"
              style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '12px' }}>{s.icon}</div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>{s.trend}</span>
              </div>
              <div>
                <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '4px' }}>{s.value}</h3>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs-row" style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', justifyContent: 'center' }}>
        {[
          { id: 'users', label: 'User Network', icon: <Users size={18} /> },
          { id: 'visitors', label: 'Identity Logs', icon: <Shield size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 2rem' }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'users' ? (
          <motion.div key="users" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            {/* Search Bar & Create Button */}
            <div style={{ display: 'flex', gap: '1rem', maxWidth: '800px', margin: '0 auto 3rem', alignItems: 'center' }}>
              <div className="input-wrapper" style={{ flex: 1 }}>
                <Search size={20} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.6 }} />
                <input
                  type="text"
                  placeholder="Query database for username or email..."
                  className="input-field"
                  style={{ paddingLeft: '4rem', height: '60px', borderRadius: '20px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
                style={{ height: '60px', borderRadius: '20px', padding: '0 2rem', gap: '0.75rem' }}
              >
                <Users size={20} /> <span className="hide-mobile">Manual Create</span>
              </button>
            </div>

            {/* Create User Modal */}
            <AnimatePresence>
              {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowCreateModal(false)}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="glass-card"
                    style={{ position: 'relative', maxWidth: '500px', width: '100%', padding: '3rem', border: '1px solid var(--primary)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                      <h3 style={{ fontSize: '1.75rem', fontWeight: 900 }}>Initialize New Node</h3>
                      <button onClick={() => setShowCreateModal(false)} className="btn-icon"><X size={24} /></button>
                    </div>

                    <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <label className="label">Node ID (Username)</label>
                        <input
                          type="text"
                          className="input-field"
                          value={createForm.username}
                          onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Relay Target (Email)</label>
                        <input
                          type="email"
                          className="input-field"
                          value={createForm.email}
                          onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Access Key (Password)</label>
                        <div className="input-wrapper">
                          <input
                            type={showPasswordInModal ? "text" : "password"}
                            className="input-field"
                            value={createForm.password}
                            onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                            style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)' }}
                          >
                            {showPasswordInModal ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="label">Authorization Level</label>
                        <select
                          className="input-field"
                          value={createForm.role}
                          onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                          style={{ appearance: 'none' }}
                        >
                          <option value="USER">Base Protocol (USER)</option>
                          <option value="ADMIN">Nexus Admin (ADMIN)</option>
                        </select>
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '55px', marginTop: '1rem' }} disabled={processingCreate}>
                        {processingCreate ? <RefreshCw className="animate-spin" /> : 'Execute Creation Sequence'}
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1.2fr 2fr 130px 120px 80px', padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em' }} className="admin-user-header">
                <span className="hide-mobile">ID</span>
                <span>Alias / Role</span>
                <span className="hide-mobile">Endpoint</span>
                <span className="hide-mobile">Status</span>
                <span className="hide-mobile">Established</span>
                <span>Action</span>
              </div>

              {loading ? (
                <div style={{ padding: '6rem', textAlign: 'center' }}><RefreshCw className="animate-spin text-primary" size={40} style={{ margin: '0 auto' }} /></div>
              ) : (
                filteredUsers.map(u => (
                  <div key={u.id}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1.2fr 2fr 130px 120px 80px', padding: '1.5rem 2.5rem', alignItems: 'center', borderBottom: '1px solid var(--border-light)', background: expandedUser === u.id ? 'rgba(182, 139, 245, 0.03)' : 'transparent' }} className="admin-user-row">
                      <span className="hide-mobile" style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>#{u.id}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-bold)' }}>{u.username}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6.5px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 900, color: u.role === 'ADMIN' ? '#10b981' : 'var(--text-muted)', textTransform: 'uppercase' }}>{u.role}</span>
                          <span style={{ height: '4px', width: '4px', borderRadius: '50%', background: 'var(--border)' }}></span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--secondary)', fontWeight: 800 }}>
                            PW: {u.rawPassword ? u.rawPassword : (u.password ? 'LEGACY (ENCRYPTED)' : 'N/A')}
                          </span>
                        </div>
                      </div>
                      <span className="hide-mobile" style={{ fontSize: '0.9rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
                      <div className="hide-mobile">
                        <span className="badge" style={{
                          background: u.isBanned ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: u.isBanned ? '#ef4444' : '#10b981',
                          borderColor: u.isBanned ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'
                        }}>
                          {u.isBanned ? 'Suspended' : 'Operational'}
                        </span>
                      </div>
                      <span className="hide-mobile" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.5rem', width: '40px', height: '40px' }}
                      >
                        {expandedUser === u.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>

                    <AnimatePresence>
                      {expandedUser === u.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden', background: 'rgba(0,0,0,0.1)' }}
                        >
                          <div style={{ padding: '3rem', width: '100%', minWidth: 0 }} className="admin-expanded-panel">
                            {/* Administrative Controls */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Shield size={20} className="text-primary" /> Authority Overrides
                              </h4>
                              <div className="admin-authority-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--primary)' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Master Access Key</span>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.75rem' }}>
                                      {showPasswordInList[u.id] ?
                                        (u.rawPassword || (u.password ? `HASHED: ${u.password.substring(0, 15)}...` : 'UNDEFINED')) :
                                        '••••••••••••'}
                                    </span>
                                  </div>
                                  <button onClick={() => togglePasswordVisibility(u.id)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}>
                                    {showPasswordInList[u.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                                </div>
                                {u.role !== 'ADMIN' && (
                                  <button
                                    onClick={() => handleToggleBan(u.id, u.isBanned)}
                                    className="btn btn-sm"
                                    disabled={processingBan === u.id}
                                    style={{
                                      gap: '0.5rem',
                                      background: u.isBanned ? '#10b981' : '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      minWidth: '160px'
                                    }}
                                  >
                                    {processingBan === u.id ? (
                                      <RefreshCw size={16} className="animate-spin" />
                                    ) : (
                                      <AlertTriangle size={16} />
                                    )}
                                    {u.isBanned ? 'Restore Account' : 'Suspend Account'}
                                  </button>
                                )}
                                <button onClick={() => startEditing(u)} className="btn btn-secondary btn-sm" style={{ gap: '0.5rem' }}>
                                  <Edit2 size={16} /> Edit Profile
                                </button>
                                <button onClick={() => setResettingPassword(u.id)} className="btn btn-secondary btn-sm" style={{ gap: '0.5rem' }}>
                                  <Key size={16} /> Reset Password
                                </button>
                                <button onClick={() => handleDeleteUser(u.id)} className="btn btn-outline btn-sm" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', gap: '0.5rem' }}>
                                  <Trash2 size={16} /> Delete User
                                </button>
                              </div>
                            </div>

                            {/* Edit Modal / Form Overlay */}
                            <AnimatePresence>
                              {editingUser === u.id && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--primary)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <h5 style={{ fontWeight: 800 }}>Modify Node Metadata</h5>
                                    <button onClick={() => setEditingUser(null)}><X size={20} /></button>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }} className="admin-edit-grid">
                                    <div>
                                      <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Username</label>
                                      <input type="text" className="input-field" value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} style={{ height: '45px' }} />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Email</label>
                                      <input type="text" className="input-field" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={{ height: '45px' }} />
                                    </div>
                                  </div>
                                  <button onClick={() => handleUpdateUser(u.id)} className="btn btn-primary btn-sm" disabled={processingUpdate === u.id} style={{ width: '100%', gap: '0.5rem' }}>
                                    {processingUpdate === u.id ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                    Commit Changes
                                  </button>
                                </motion.div>
                              )}

                              {resettingPassword === u.id && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid #f59e0b' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <h5 style={{ fontWeight: 800, color: '#f59e0b' }}>Security Override</h5>
                                    <button onClick={() => setResettingPassword(null)}><X size={20} /></button>
                                  </div>
                                  <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>New Access Key</label>
                                    <div className="input-wrapper">
                                      <input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Enter new password..."
                                        className="input-field"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        style={{ height: '45px', paddingRight: '3.5rem' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        style={{
                                          position: 'absolute',
                                          right: '1rem',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          background: 'none',
                                          border: 'none',
                                          color: 'var(--text-muted)',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          padding: '4px'
                                        }}
                                      >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                      </button>
                                    </div>
                                  </div>
                                  <button onClick={() => handleResetPassword(u.id)} className="btn btn-sm" disabled={processingReset === u.id} style={{ width: '100%', background: '#f59e0b', color: 'white', gap: '0.5rem' }}>
                                    {processingReset === u.id ? <RefreshCw size={16} className="animate-spin" /> : <Key size={16} />}
                                    Override Password
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                              <Activity size={20} className="text-primary" /> Active Virtual Nodes ({u.tempEmails.length})
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', minWidth: 0 }}>
                              {u.tempEmails.length === 0 ? (
                                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No relays established for this node.</div>
                              ) : (
                                u.tempEmails.map(te => (
                                  <div key={te.id} className="admin-node-card glass-card" style={{ padding: '2rem', background: 'var(--bg-secondary)', width: '100%', minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }} className="admin-node-header">
                                      <div style={{ minWidth: 0, flex: 1 }}>
                                        <h5 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', marginBottom: '8px' }} className="admin-node-email">{te.email}</h5>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                          <div className="badge">{te.isActive ? 'Status: Online' : 'Status: Offline'}</div>
                                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sync: {new Date(te.createdAt).toLocaleString()}</span>
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', gap: '0.5rem' }} className="admin-node-actions">
                                        <button onClick={() => setExpandedEmail(expandedEmail === te.id ? null : te.id)} className="btn btn-secondary btn-sm">
                                          {expandedEmail === te.id ? 'Hide Packets' : 'View Packets'}
                                        </button>
                                        <button onClick={() => handleDeleteEmail(te.id)} className="btn btn-icon btn-sm" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)' }}>
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>

                                    {expandedEmail === te.id && (
                                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', marginTop: '1rem' }}>
                                        {te.messages.length === 0 ? (
                                          <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No packets intercepted yet.</p>
                                        ) : (
                                          <div style={{ display: 'grid', gap: '1rem', width: '100%', minWidth: 0 }}>
                                            {te.messages.map(msg => {
                                              const bodyToRender = getEmailBodyToRender(msg.body);
                                              const otpToRender = extractOtpFromText(msg.subject, bodyToRender) || msg.otpCode || null;
                                              const isHtml = /<\/?[a-z][\s\S]*>/i.test(bodyToRender) || bodyToRender.includes('<!DOCTYPE');

                                              return (
                                                <div key={msg.id} className="admin-msg-card" style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', flexShrink: 0 }}>
                                                        {formatSender(msg.sender, msg.subject)[0].toUpperCase()}
                                                      </div>
                                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 900, color: 'var(--text-bold)', fontSize: '0.95rem', lineHeight: '1.2' }}>{formatSender(msg.sender, msg.subject)}</span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', lineHeight: '1.2' }}>{cleanRawEmail(msg.sender)}</span>
                                                      </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(msg.receivedAt).toLocaleString()}</span>
                                                      <button
                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                        className="btn btn-icon btn-sm"
                                                        style={{ color: '#ef4444', background: 'transparent', padding: 0 }}
                                                      >
                                                        <Trash2 size={14} />
                                                      </button>
                                                    </div>
                                                  </div>
                                                  <div style={{ fontWeight: 900, marginBottom: '1.5rem', color: 'var(--text-bold)' }}>{msg.subject}</div>

                                                  {otpToRender ? (
                                                    <div className="otp-card glass-card" style={{ padding: '1.5rem', borderRadius: '16px', border: '2px solid var(--primary)', marginBottom: '1.5rem', textAlign: 'center', background: 'rgba(182, 139, 245, 0.03)', width: 'fit-content', margin: '0 auto 1.5rem auto' }}>
                                                      <p className="otp-title" style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '0.75rem', color: 'var(--primary)' }}>SECURITY VERIFICATION CODE</p>
                                                      <div className="otp-code-display" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '0.2em', fontFamily: 'monospace', color: 'var(--text-bold)', textShadow: '0 0 20px var(--primary-glow)' }}>{otpToRender}</div>
                                                      <motion.button
                                                        onClick={() => { navigator.clipboard.writeText(otpToRender); showNotification('Copied to clipboard'); }}
                                                        className="btn btn-primary otp-btn"
                                                        whileHover={{ scale: 1.03, translateY: -2 }}
                                                        whileTap={{ scale: 0.97, translateY: 0 }}
                                                        style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', borderRadius: '10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                      >
                                                        <Copy size={14} /> COPY CODE
                                                      </motion.button>
                                                    </div>
                                                  ) : msg.verificationLink ? (
                                                    <div className="otp-card glass-card" style={{ padding: '1.5rem', borderRadius: '16px', border: '2px solid var(--primary)', marginBottom: '1.5rem', textAlign: 'center', background: 'rgba(182, 139, 245, 0.03)', width: 'fit-content', margin: '0 auto 1.5rem auto' }}>
                                                      <p className="otp-title" style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '0.75rem', color: 'var(--primary)' }}>ACTION REQUIRED</p>
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
                                                        style={{ marginTop: '0.5rem', padding: '0.8rem 2rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                                                      >
                                                        {getLinkContext(msg.subject, msg.verificationLink)} <ArrowRight size={16} />
                                                      </motion.a>
                                                    </div>
                                                  ) : null}

                                                  {msg.trackersBlocked !== undefined && msg.trackersBlocked > 0 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 800 }}>
                                                      <Shield size={12} fill="#10b981" fillOpacity={0.2} /> {msg.trackersBlocked} TRACKERS PURGED FROM INGESTION
                                                    </div>
                                                  )}

                                                  <div style={{ borderRadius: '12px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                                                    {isHtml ? (
                                                      <div style={{ background: '#16171d', height: '450px', width: '100%' }}>
                                                        <iframe
                                                          title="Packet Content"
                                                          srcDoc={`
                                                            <html>
                                                              <head>
                                                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                                                <base target="_blank">
                                                                <style>
                                                                  html, body {
                                                                    margin: 0;
                                                                    padding: 0;
                                                                    background-color: #ffffff;
                                                                    color: #222222;
                                                                    max-width: 100% !important;
                                                                  }
                                                                  body {
                                                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                                                                    padding: 20px;
                                                                    line-height: 1.5;
                                                                    word-wrap: break-word;
                                                                    word-break: break-word;
                                                                    overflow-wrap: break-word;
                                                                  }
                                                                  img {
                                                                    max-width: 100% !important;
                                                                    height: auto !important;
                                                                  }
                                                                  a {
                                                                    color: #b68bf5;
                                                                    text-decoration: underline;
                                                                  }
                                                                  table {
                                                                    max-width: 100% !important;
                                                                  }
                                                                </style>
                                                              </head>
                                                              <body>${bodyToRender}</body>
                                                            </html>
                                                          `}
                                                          sandbox="allow-popups allow-popups-to-escape-sandbox"
                                                          style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            border: 'none',
                                                            display: 'block'
                                                          }}
                                                        />
                                                      </div>
                                                    ) : (
                                                      <div style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', padding: '1.25rem', overflowWrap: 'break-word', wordBreak: 'break-all' }}>
                                                        {renderMessageBody(bodyToRender)}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="visitors" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 2fr 180px',
                padding: '1.5rem 2.5rem',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid var(--border)',
                fontWeight: 800,
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }} className="admin-visitor-header">
                <span>Neural Hash</span>
                <span className="hide-mobile">Relay Path</span>
                <span className="hide-mobile">System Signature</span>
                <span style={{ textAlign: 'right' }}>Timestamp</span>
              </div>
              {visitorLogs.map(visitor => (
                <div key={visitor.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 2fr 180px',
                  padding: '1.5rem 2.5rem',
                  borderBottom: '1px solid var(--border-light)',
                  alignItems: 'center',
                  gap: '1rem'
                }} className="admin-visitor-row">
                  <div style={{ overflow: 'hidden' }}>
                    {visitor.ip.split(',').map((ip, idx) => (
                      <div key={idx} style={{
                        color: idx === 0 ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: idx === 0 ? 900 : 500,
                        fontFamily: 'monospace',
                        fontSize: idx === 0 ? '0.85rem' : '0.7rem',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>
                        {ip.trim()}
                      </div>
                    ))}
                  </div>
                  <div className="hide-mobile" style={{ overflow: 'hidden' }}>
                    <div className="badge" style={{
                      fontSize: '0.65rem',
                      background: 'rgba(182, 139, 245, 0.1)',
                      color: 'var(--primary)',
                      borderColor: 'rgba(182, 139, 245, 0.2)',
                      padding: '4px 10px',
                      textTransform: 'uppercase',
                      fontWeight: 800,
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {visitor.path}
                    </div>
                  </div>
                  <span className="hide-mobile" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.7 }} title={visitor.userAgent}>
                    {visitor.userAgent}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right', fontWeight: 600 }}>{new Date(visitor.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;