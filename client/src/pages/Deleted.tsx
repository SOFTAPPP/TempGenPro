import React from 'react';
import { motion } from 'framer-motion';
import { UserX, LogIn, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Deleted: React.FC = () => {
  const { logout } = useAuth();

  const handleReturn = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="deleted-screen" style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#0d0d12',
      padding: '1.5rem',
      overflow: 'hidden'
    }}>
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(182, 139, 245, 0.03) 0%, transparent 70%)',
        opacity: 0.5 
      }}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          maxWidth: '500px', 
          width: '100%', 
          padding: '3.5rem', 
          textAlign: 'center',
          background: 'rgba(16, 17, 21, 0.8)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '32px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '24px', 
          background: 'rgba(255, 255, 255, 0.03)', 
          color: 'var(--text-muted)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 2.5rem',
          border: '1px solid var(--border)'
        }}>
          <UserX size={40} />
        </div>

        <h1 style={{ 
          fontSize: '2.25rem', 
          fontWeight: 900, 
          color: '#fff', 
          marginBottom: '1rem',
          letterSpacing: '-0.04em'
        }}>
          Identity Terminated
        </h1>

        <p style={{ 
          color: 'rgba(255, 255, 255, 0.5)', 
          fontSize: '1.05rem', 
          lineHeight: 1.6, 
          marginBottom: '3rem' 
        }}>
          This account has been <span style={{ color: 'var(--primary)', fontWeight: 700 }}>permanently blocked</span> and all associated relay nodes have been purged from the network by an administrator.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          <button 
            onClick={handleReturn} 
            className="btn btn-primary" 
            style={{ padding: '1.1rem', borderRadius: '14px', width: '100%', justifyContent: 'center' }}
          >
            <LogIn size={18} /> Re-verify Identity
          </button>
          <a 
            href="mailto:support@tempgenpro.com" 
            className="btn btn-secondary" 
            style={{ padding: '1.1rem', borderRadius: '14px', width: '100%', justifyContent: 'center' }}
          >
            <Mail size={18} /> Inquire with Nexus
          </a>
        </div>

        <p style={{ marginTop: '2.5rem', color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.8rem' }}>
          Identity hash: {Math.random().toString(36).substring(7).toUpperCase()}
        </p>
      </motion.div>
    </div>
  );
};

export default Deleted;
