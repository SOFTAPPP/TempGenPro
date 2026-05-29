import { Mail } from 'lucide-react';
import React from 'react';
import Logo from './Logo';
import SmartLink from './SmartLink';

const Footer: React.FC = () => {
  return (
    <footer className="footer" style={{ textAlign: 'center' }}>
      <div className="container">
        <div className="logo" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Logo iconSize={18} showText />
        </div>

        <div className="footer-links" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <SmartLink to="/privacy" className="nav-link" style={{ fontSize: '0.85rem' }}>Privacy Policy</SmartLink>
          <SmartLink to="/terms" className="nav-link" style={{ fontSize: '0.85rem' }}>Terms of Service</SmartLink>
          <a href="/support" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <Mail size={14} style={{ flexShrink: 0 }} /> Support
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
