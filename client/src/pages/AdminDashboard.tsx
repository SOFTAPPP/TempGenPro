import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MessageSquare, Users, Search, ChevronDown, ChevronUp, RefreshCw, Activity, Globe, Trash2, Edit2, Key, Save, X, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Navigate } from 'react-router-dom';

interface FullUser {
  id: number;
  username: string;
  email: string;
  role: string;
  isBanned: boolean;
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
    }[];
  }[];
}

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
    try {
      await api.post(`/admin/users/${id}/ban`);
      setUsersData(usersData.map(u => u.id === id ? { ...u, isBanned: !currentStatus } : u));
      showNotification(currentStatus ? 'User Status: RESTORED' : 'User Status: SUSPENDED', currentStatus ? 'success' : 'info');
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to toggle ban status.', 'error');
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
          await api.delete(`/admin/emails/${emailId}`);
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
    try {
      const res = await api.patch(`/admin/users/${id}`, editForm);
      setUsersData(usersData.map(u => u.id === id ? { ...u, ...res.data } : u));
      setEditingUser(null);
      showNotification('User Profile Synchronized.');
    } catch (err) {
      showNotification('Failed to update user.', 'error');
    }
  };

  const handleResetPassword = async (id: number) => {
    if (!newPassword) return showNotification('New Access Key required.', 'error');
    try {
      await api.put(`/admin/users/${id}/password`, { newPassword });
      setResettingPassword(null);
      setNewPassword('');
      showNotification('User Password Overridden.');
    } catch (err) {
      showNotification('Failed to reset password.', 'error');
    }
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
    <div className="container" style={{ padding: '8rem 1rem 4rem' }}>
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
            { label: 'Traffic IPs', value: visitorLogs.length, icon: <Globe size={20} />, trend: 'Monitored' },
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
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', justifyContent: 'center' }}>
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
            {/* Search Bar */}
            <div className="input-wrapper" style={{ maxWidth: '600px', margin: '0 auto 3rem' }}>
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

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1.5fr 1fr 1fr 100px 80px', padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                <span className="hide-mobile">ID</span>
                <span>Alias / Role</span>
                <span>Endpoint</span>
                <span className="hide-mobile">Status</span>
                <span className="hide-mobile">Established</span>
                <span>Action</span>
              </div>

              {loading ? (
                <div style={{ padding: '6rem', textAlign: 'center' }}><RefreshCw className="animate-spin text-primary" size={40} style={{ margin: '0 auto' }} /></div>
              ) : (
                filteredUsers.map(u => (
                  <div key={u.id}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1.5fr 1fr 1fr 100px 80px', padding: '1.5rem 2.5rem', alignItems: 'center', borderBottom: '1px solid var(--border-light)', background: expandedUser === u.id ? 'rgba(182, 139, 245, 0.03)' : 'transparent' }}>
                      <span className="hide-mobile" style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>#{u.id}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-bold)' }}>{u.username}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: u.role === 'ADMIN' ? '#10b981' : 'var(--text-muted)', textTransform: 'uppercase' }}>{u.role}</span>
                      </div>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
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
                          <div style={{ padding: '3rem' }}>
                            {/* Administrative Controls */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Shield size={20} className="text-primary" /> Authority Overrides
                              </h4>
                              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => handleToggleBan(u.id, u.isBanned)}
                                  className="btn btn-sm"
                                  style={{
                                    gap: '0.5rem',
                                    background: u.isBanned ? '#10b981' : '#ef4444',
                                    color: 'white',
                                    border: 'none'
                                  }}
                                >
                                  <AlertTriangle size={16} /> {u.isBanned ? 'Restore Account' : 'Suspend Account'}
                                </button>
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
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                      <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Username</label>
                                      <input type="text" className="input-field" value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} style={{ height: '45px' }} />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Email</label>
                                      <input type="text" className="input-field" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={{ height: '45px' }} />
                                    </div>
                                  </div>
                                  <button onClick={() => handleUpdateUser(u.id)} className="btn btn-primary btn-sm" style={{ width: '100%', gap: '0.5rem' }}>
                                    <Save size={16} /> Commit Changes
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
                                  <button onClick={() => handleResetPassword(u.id)} className="btn btn-sm" style={{ width: '100%', background: '#f59e0b', color: 'white', gap: '0.5rem' }}>
                                    <Key size={16} /> Override Password
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                              <Activity size={20} className="text-primary" /> Active Virtual Nodes ({u.tempEmails.length})
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                              {u.tempEmails.length === 0 ? (
                                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No relays established for this node.</div>
                              ) : (
                                u.tempEmails.map(te => (
                                  <div key={te.id} className="glass-card" style={{ padding: '2rem', background: 'var(--bg-secondary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                      <div>
                                        <h5 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', marginBottom: '8px' }}>{te.email}</h5>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                          <div className="badge">{te.isActive ? 'Status: Online' : 'Status: Offline'}</div>
                                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sync: {new Date(te.createdAt).toLocaleString()}</span>
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                                          <div style={{ display: 'grid', gap: '1rem' }}>
                                            {te.messages.map(msg => (
                                              <div key={msg.id} style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>{msg.sender}</span>
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
                                                <div style={{ fontWeight: 900, marginBottom: '1rem' }}>{msg.subject}</div>
                                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{msg.body}</div>
                                              </div>
                                            ))}
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
              }}>
                <span>Neural Hash</span>
                <span>Relay Path</span>
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
                }}>
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
                  <div style={{ overflow: 'hidden' }}>
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
