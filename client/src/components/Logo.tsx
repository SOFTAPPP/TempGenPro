import { Mail, Zap } from 'lucide-react';
import React from 'react';

interface LogoProps {
  size?: number;
  iconSize?: number;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 24, iconSize, showText = false }) => {
  const iSize = iconSize || size;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--primary)',
        borderRadius: '12px',
        width: iSize * 2,
        height: iSize * 2,
        color: '#101115',
        boxShadow: '0 4px 15px rgba(182, 139, 245, 0.3)',
        flexShrink: 0
      }}>
        <Mail size={iSize} strokeWidth={2.5} style={{ flexShrink: 0 }} />
        <Zap
          size={iSize / 1.5}
          fill="currentColor"
          style={{
            position: 'absolute',
            top: `-${iSize / 4}px`,
            right: `-${iSize / 4}px`,
            color: '#fff',
            filter: 'drop-shadow(0 0 8px #fff)',
            stroke: '#101115',
            strokeWidth: '2px',
            flexShrink: 0
          }}
        />
      </div>
      {showText && <span className="logo-text gradient-text" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', fontWeight: 900, flexShrink: 0 }}>TempGenPro</span>}
    </div>
  );
};

export default Logo;
