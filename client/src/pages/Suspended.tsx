import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Suspended: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="suspended-screen" style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#0a0a0f',
      padding: '1.5rem',
      overflow: 'hidden'
    }}>
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.1) 0%, transparent 70%)',
        opacity: 0.5 
      }}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          maxWidth: '550px', 
          width: '100%', 
          padding: '3rem', 
          textAlign: 'center',
          background: 'rgba(16, 17, 21, 0.8)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '32px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '24px', 
          background: 'rgba(239, 68, 68, 0.1)', 
          color: '#ef4444', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 2rem',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <ShieldAlert size={40} />
        </div>

        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 900, 
          color: '#fff', 
          marginBottom: '1rem',
          letterSpacing: '-0.04em'
        }}>
          Access Restricted
        </h1>

        <p style={{ 
          color: 'rgba(255, 255, 255, 0.6)', 
          fontSize: '1.1rem', 
          lineHeight: 1.6, 
          marginBottom: '2.5rem' 
        }}>
          Our system has flagged your account for a <span style={{ color: '#ef4444', fontWeight: 800 }}>Security Violation</span>. You have been restricted from using our relay network.
        </p>

        <div style={{ 
          background: 'rgba(0, 0, 0, 0.3)', 
          padding: '1.5rem', 
          borderRadius: '20px', 
          textAlign: 'left',
          marginBottom: '3rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '1rem' }}>REASON FOR BAN</h4>
          <ul style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', paddingLeft: '1.2rem', lineHeight: 1.8 }}>
            <li>Usage of restricted platform keywords (Facebook/Instagram).</li>
            <li>Policy violation detected in real-time transmission.</li>
          </ul>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          <a 
            href="mailto:support@tempgenpro.com" 
            className="btn btn-primary" 
            style={{ padding: '1.1rem', borderRadius: '14px', width: '100%', justifyContent: 'center' }}
          >
            <Mail size={18} /> Contact Support to Appeal
          </a>
          <button 
            onClick={handleLogout} 
            className="btn btn-secondary" 
            style={{ padding: '1.1rem', borderRadius: '14px', width: '100%', justifyContent: 'center' }}
          >
            <LogOut size={18} /> Exit System
          </button>
        </div>

        <button 
          onClick={() => window.location.href = '/terms'}
          style={{ 
            marginTop: '2.5rem', 
            background: 'none', 
            border: 'none', 
            color: 'rgba(255, 255, 255, 0.3)', 
            fontSize: '0.8rem', 
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Review Terms of Service
        </button>
      </motion.div>
    </div>
  );
};

export default Suspended;
