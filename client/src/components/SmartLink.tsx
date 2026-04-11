import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';

/**
 * SmartLink Props
 * customPrefetch: If true, will start loading the page code when user hovers intentionally.
 */
interface SmartLinkProps extends LinkProps {
  customPrefetch?: boolean;
}

/**
 * SmartLink: A high-performance Link component.
 * It "predicts" where the user is going but uses intentionality-detection to avoid lag.
 */
const SmartLink: React.FC<SmartLinkProps> = ({ to, customPrefetch = true, children, ...props }) => {
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * INTENT DETECTION:
   * We only start the download if the user hovers for more than 100ms.
   * This prevents "accidental" prefetches when moving the mouse across the screen.
   */
  const handleMouseEnter = () => {
    if (!customPrefetch) return;

    prefetchTimer.current = setTimeout(() => {
      const destination = typeof to === 'string' ? to : to.pathname;
      if (destination) {
        // Triggering dynamic import to prime the cache
        switch (destination) {
          case '/': import('../pages/Home'); break;
          case '/inbox': import('../pages/Inbox'); break;
          case '/features': import('../pages/Features'); break;
          case '/login': import('../pages/Login'); break;
          case '/signup': import('../pages/Signup'); break;
          case '/profile': import('../pages/Profile'); break;
          case '/admin': import('../pages/AdminDashboard'); break;
          case '/privacy': import('../pages/Privacy'); break;
          case '/terms': import('../pages/Terms'); break;
          default: break;
        }

      }
    }, 100); // 100ms buffer for smoother overall performance
  };

  const cancelPrefetch = () => {
    if (prefetchTimer.current) {
      clearTimeout(prefetchTimer.current);
    }
  };

  return (
    <Link 
      to={to} 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={cancelPrefetch}
      onTouchStart={handleMouseEnter} 
      {...props}
    >
      {children}
    </Link>
  );
};

export default SmartLink;


