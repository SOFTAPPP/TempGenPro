import React, { lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import './index.css';

// Code Splitting for performance
const Home = lazy(() => import('./pages/Home'));
const Inbox = lazy(() => import('./pages/Inbox'));
const SendMail = lazy(() => import('./pages/sendmail'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Features = lazy(() => import('./pages/Features'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Suspended = lazy(() => import('./pages/Suspended'));
const Deleted = lazy(() => import('./pages/Deleted'));
const Support = lazy(() => import('./pages/Support'));

const LoadingFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', background: 'var(--bg)' }}>
    <Loader2 className="animate-spin" size={48} color="var(--primary)" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/inbox" element={<ProtectedRoute><PageWrapper><Inbox /></PageWrapper></ProtectedRoute>} />
          <Route path="/sendmail" element={<ProtectedRoute><PageWrapper><SendMail /></PageWrapper></ProtectedRoute>} />
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
          <Route path="/features" element={<PageWrapper><Features /></PageWrapper>} />
          <Route path="/admin" element={<ProtectedRoute><PageWrapper><AdminDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
          <Route path="/privacy" element={<PageWrapper><Privacy /></PageWrapper>} />
          <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
          <Route path="/suspended" element={<PageWrapper><Suspended /></PageWrapper>} />
          <Route path="/deleted" element={<PageWrapper><Deleted /></PageWrapper>} />
          <Route path="/support" element={<PageWrapper><Support /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.15 }}
  >
    {children}
  </motion.div>
);

import { NotificationProvider } from './context/NotificationContext';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isLockdownPage = location.pathname === '/suspended' || location.pathname === '/deleted';

  return (
    <div className="app-container">
      {!isLockdownPage && <Navbar />}
      <main>
        <AnimatedRoutes />
      </main>
      {!isLockdownPage && <Footer />}
    </div>
  );
};
const App: React.FC = () => {
  const HelmetProviderSafe = HelmetProvider as any;
  return (
    <HelmetProviderSafe>
      <Router>
        <ScrollToTop />
        <NotificationProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </NotificationProvider>
      </Router>
    </HelmetProviderSafe>
  );
};

export default App;
