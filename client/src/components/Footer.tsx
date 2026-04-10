import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare } from 'lucide-react';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="footer" style={{ textAlign: 'center' }}>
      <div className="container">
        <div className="logo" style={{ justifyContent: 'center', marginBottom: '2.5rem' }}>
          <Logo iconSize={16} showText />
        </div>
        
        <div className="footer-links" style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
          <Link to="/privacy" className="nav-link">Privacy Policy</Link>
          <Link to="/terms" className="nav-link">Terms of Service</Link>
          <a href="mailto:aritradatt39@gmail.com" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} /> Support Email
          </a>
          <a href="https://wa.me/918100474669" target="_blank" rel="noopener noreferrer" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} /> WhatsApp
          </a>
        </div>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          © {new Date().getFullYear()} TempGenPro. All rights reserved. Keep your inbox safe.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
