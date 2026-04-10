import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare } from 'lucide-react';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="footer" style={{ textAlign: 'center' }}>
      <div className="container">
        <div className="logo" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Logo iconSize={14} showText />
        </div>

        <div className="footer-links" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <Link to="/privacy" className="nav-link" style={{ fontSize: '0.85rem' }}>Privacy Policy</Link>
          <Link to="/terms" className="nav-link" style={{ fontSize: '0.85rem' }}>Terms of Service</Link>
          <a href="mailto:aritradatt39@gmail.com" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <Mail size={14} /> Support
          </a>
          <a href="https://wa.me/918100474669" target="_blank" rel="noopener noreferrer" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <MessageSquare size={14} /> WhatsApp
          </a>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, opacity: 0.6 }}>
          © {new Date().getFullYear()} TempGenPro. Premium Relay Systems.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
