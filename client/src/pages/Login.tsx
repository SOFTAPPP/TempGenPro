import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User as UserIcon, ArrowRight, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Logo from '../components/Logo';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// Uses environment variable for Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

const Login: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [oauthButtonWidth, setOauthButtonWidth] = useState(354);

  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const clampedWidth = Math.min(400, Math.max(200, width));
        setOauthButtonWidth(clampedWidth);
      }
    };
    updateWidth();
    const timer = setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  const { user, login, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/inbox');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { identifier, password });
      login(res.data.user, res.data.token);
      showNotification(`System Access Granted. Welcome, ${res.data.user.username}.`);

      if (res.data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/inbox');
      }
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.detail.includes('Account not verified')) {
        // User needs to verify OTP
        showNotification("Your account is not verified. Sending a new OTP...", "info");
        try {
          await api.post('/auth/resend-otp', { email: identifier });
          setStep(2);
        } catch (resendErr) {
          setError("Failed to resend OTP. Please try again.");
        }
      } else if (err.response?.status === 403) {
        navigate('/suspended');
        return;
      } else {
        const msg = err.response?.data?.detail || err.response?.data?.error || 'Incorrect or invalid credentials';
        setError(msg);
        showNotification(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-email', { email: identifier, otp });
      showNotification("Email verified successfully!", "success");
      login(res.data.user, res.data.token);
      navigate('/inbox');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post('/auth/resend-otp', { email: identifier });
      showNotification("A new OTP has been sent.", "success");
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend OTP');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await api.post('/auth/oauth/google', { token: credentialResponse.credential });
      login(res.data.user, res.data.token);
      showNotification("Logged in with Google successfully!", "success");
      navigate('/inbox');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google authentication failed');
    }
  };


  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '4rem 1.5rem' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
          style={{ width: '100%', maxWidth: '450px', padding: '3rem', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Logo iconSize={24} />
            </div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {step === 1 ? 'Welcome Back' : 'Verify Email'}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {step === 1 ? 'Securely access your temporary inboxes.' : `Enter the OTP sent to your email.`}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                textAlign: 'center'
              }}
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleLoginSubmit}>
                  <div className="form-group">
                    <label className="input-label">Username or Email</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        placeholder="Ex: cybernexus_99 or me@email.com"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                      />
                      <UserIcon size={18} className="input-icon" />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                    <label className="input-label">Password</label>
                    <div className="input-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your secure password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ paddingRight: '3.5rem' }}
                      />
                      <Lock size={18} className="input-icon" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '1rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px'
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', justifyContent: 'center' }} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" size={22} /> : <>Access Account <ArrowRight size={20} /></>}
                  </button>
                </form>

                <div style={{ marginTop: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>OR CONTINUE WITH</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                <div className="oauth-container" ref={containerRef}>
                  {/* Google Login with Overlay Trick */}
                  <div style={{ position: 'relative', width: oauthButtonWidth, height: '40px' }}>
                    <button 
                      type="button"
                      className="oauth-btn"
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        zIndex: 1,
                        pointerEvents: 'none'
                      }}
                    >
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </button>
                    <div style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%', 
                      opacity: 0.01, 
                      zIndex: 2,
                      cursor: 'pointer',
                      overflow: 'hidden'
                    }}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Login Failed')}
                        useOneTap
                        width={oauthButtonWidth.toString()}
                      />
                    </div>
                  </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Create one for free</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleVerifySubmit}>
                  <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                    <label className="input-label">Verification Code (OTP)</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        placeholder="Enter the 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        maxLength={6}
                        style={{ letterSpacing: '0.2rem', textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
                      />
                      <CheckCircle size={18} className="input-icon" />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', justifyContent: 'center' }} disabled={loading || otp.length < 6}>
                    {loading ? <Loader2 className="animate-spin" size={22} /> : <>Verify Account <ArrowRight size={20} /></>}
                  </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Didn't receive the email? <button onClick={handleResendOtp} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Click to resend</button>
                </p>
                <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>Back to login</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
