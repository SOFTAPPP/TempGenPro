import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar, Activity, MessageSquare, Key, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ProfileData {
  username: string;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    tempEmails: number;
  };
  totalMessages: number;
}

const Profile: React.FC = () => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '4rem 1.25rem' }}>
      <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <Link to="/inbox" className="btn btn-secondary btn-sm" style={{ marginBottom: '2rem', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        <div className="badge mb-3">Member Intelligence</div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em', color: 'var(--text-bold)' }}>Account Nexus</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>Manage your digital identity and relay performance.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card"
          style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, padding: '2rem', opacity: 0.1 }}>
            <User size={120} />
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={24} className="text-primary" /> Identity Specs
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '8px', display: 'block' }}>Verified Username</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-bold)' }}>
                <User size={20} className="text-primary" /> {profile?.username}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '8px', display: 'block' }}>Primary Communication</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-bold)' }}>
                <Mail size={20} className="text-primary" /> {profile?.email}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '8px', display: 'block' }}>Clearance Level</label>
              <div className="badge" style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem', background: 'rgba(182, 139, 245, 0.1)', color: 'var(--primary)', fontWeight: 900 }}>
                {profile?.role === 'ADMIN' ? 'Level 5 Administrator' : 'Standard Operative'}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '8px', display: 'block' }}>Service Established</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                <Calendar size={20} /> {new Date(profile?.createdAt || '').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card"
            style={{ padding: '2.5rem' }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Utility Performance</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '20px', textAlign: 'center' }}>
                <Activity className="text-primary" style={{ margin: '0 auto 1rem' }} />
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{profile?._count.tempEmails}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Relays</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '20px', textAlign: 'center' }}>
                <MessageSquare className="text-primary" style={{ margin: '0 auto 1rem' }} />
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{profile?.totalMessages}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Packets Routed</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card"
            style={{ padding: '2.5rem' }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Security Protocol</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Key size={18} /> Cycle Access Key (Password)
              </button>
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                <Shield size={18} /> Terminate Current Session
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
