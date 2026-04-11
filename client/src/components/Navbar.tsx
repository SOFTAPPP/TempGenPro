import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  const handleLogout = () => {
    showNotification('Identity Disconnected. Session terminated.');
    setTimeout(() => {
      logout();
      window.location.href = '/login';
    }, 1000);
  };

  return (
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

        {/* Mobile Toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mobile-menu"
        >
          <SmartLink to="/" onClick={() => setMobileMenuOpen(false)}>Home</SmartLink>
          <SmartLink to="/features" onClick={() => setMobileMenuOpen(false)}>Features</SmartLink>
          {isAuthenticated ? (
            <>
              {user?.role === 'ADMIN' && (
                <SmartLink to="/admin" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</SmartLink>
              )}
              <SmartLink to="/inbox" onClick={() => setMobileMenuOpen(false)}>Inbox</SmartLink>
              <SmartLink to="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</SmartLink>
              <button onClick={handleLogout} className="btn btn-primary">Logout</button>
            </>
          ) : (
            <>
              <SmartLink to="/login" onClick={() => setMobileMenuOpen(false)}>Login</SmartLink>
              <SmartLink to="/signup" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>Get Started</SmartLink>
            </>
          )}
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
