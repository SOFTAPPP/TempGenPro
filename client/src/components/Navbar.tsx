import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, LogOut, Menu, X, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Logo from './Logo';
import SmartLink from './SmartLink';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    showNotification('Identity Disconnected. Session terminated.');
    setTimeout(() => {
      logout();
      window.location.href = '/login';
    }, 1000);
  };

  return (
    <>
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-container">
          <SmartLink to="/" className="logo">
            <Logo iconSize={14} showText />
          </SmartLink>

          {/* Desktop Nav */}
          <div className="desktop-nav">
            <SmartLink to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</SmartLink>
            <SmartLink to="/features" className={`nav-link ${location.pathname === '/features' ? 'active' : ''}`}>Features</SmartLink>

            {isAuthenticated ? (
              <div className="nav-actions">
                {user?.role === 'ADMIN' && (
                  <SmartLink to="/admin" className="btn btn-secondary btn-sm">
                    <LayoutDashboard size={16} /> Admin
                  </SmartLink>
                )}
                <SmartLink to="/inbox" className="btn btn-primary btn-sm">
                  <Mail size={16} /> Inbox
                </SmartLink>
                <SmartLink to="/profile" className="btn btn-secondary btn-nav-round" title="Profile Settings">
                  <User size={18} />
                </SmartLink>
                <button onClick={handleLogout} className="btn btn-secondary btn-nav-round" title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="nav-actions">
                <SmartLink to="/login" className="nav-link">Login</SmartLink>
                <SmartLink to="/signup" className="btn btn-primary btn-sm">Get Started</SmartLink>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer — rendered in a portal-like manner outside the nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                zIndex: 1998,
              }}
            />

            {/* Drawer Panel — slides in from RIGHT */}
            <motion.div
              key="drawer-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '80vw',
                maxWidth: '320px',
                background: 'var(--bg-secondary)',
                borderLeft: '1px solid var(--border)',
                zIndex: 1999,
                display: 'flex',
                flexDirection: 'column',
                padding: '0',
                overflowY: 'auto',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
              }}
            >
              {/* Drawer Header */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <Logo iconSize={14} showText />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-bold)',
                    borderRadius: '10px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Links */}
              <nav style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {[
                  { to: '/', label: 'Home' },
                  { to: '/features', label: 'Features' },
                  ...(isAuthenticated && user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin Dashboard' }] : []),
                  ...(isAuthenticated ? [{ to: '/inbox', label: 'Inbox' }, { to: '/profile', label: 'Profile' }] : []),
                  ...(!isAuthenticated ? [{ to: '/login', label: 'Login' }] : []),
                ].map(link => (
                  <SmartLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '0.9rem 1.25rem',
                      borderRadius: '12px',
                      fontWeight: 600,
                      fontSize: '1rem',
                      color: location.pathname === link.to ? 'var(--primary)' : 'var(--text)',
                      background: location.pathname === link.to ? 'rgba(182, 139, 245, 0.08)' : 'transparent',
                      border: location.pathname === link.to ? '1px solid rgba(182, 139, 245, 0.15)' : '1px solid transparent',
                      transition: 'all 0.2s ease',
                      display: 'block',
                    }}
                  >
                    {link.label}
                  </SmartLink>
                ))}

                {/* Auth Buttons */}
                <div style={{ marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {isAuthenticated ? (
                    <button
                      onClick={handleLogout}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', borderRadius: '14px', padding: '1rem' }}
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  ) : (
                    <SmartLink
                      to="/signup"
                      className="btn btn-primary"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ width: '100%', justifyContent: 'center', borderRadius: '14px', padding: '1rem', textAlign: 'center' }}
                    >
                      Get Started
                    </SmartLink>
                  )}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
