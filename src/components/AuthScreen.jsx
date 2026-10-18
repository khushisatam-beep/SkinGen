import React, { useState } from 'react';
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useApp, deriveNameFromEmail } from '../context/AppContext';

/**
 * AuthScreen Component
 * Standalone, full-screen authentication interface for SkinGen.
 */
export default function AuthScreen() {
  const { login } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Handle Login submission
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    // Check if account was previously registered
    let accountName = '';
    try {
      const savedUsers = JSON.parse(localStorage.getItem('skingen_users_db') || '{}');
      if (savedUsers[cleanEmail.toLowerCase()]?.name) {
        accountName = savedUsers[cleanEmail.toLowerCase()].name;
      }
    } catch {
      accountName = '';
    }

    // If no stored name, derive from email local part or fallback to neutral
    if (!accountName) {
      accountName = deriveNameFromEmail(cleanEmail);
    }

    login({
      name: accountName,
      email: cleanEmail,
      avatarInitial: accountName ? accountName.charAt(0).toUpperCase() : 'U'
    });
  };

  // Handle Sign Up submission
  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 4) {
      setErrorMessage('Password must be at least 4 characters for this demo.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    login({
      name: name.trim(),
      email: email.trim(),
      avatarInitial: name.trim().charAt(0).toUpperCase()
    });
  };

  // Handle Forgot Password submission
  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setSuccessNotice(
      `Demo password reset request recorded for ${email.trim()}. (Simulated client-side only — no real email dispatched).`
    );
  };

  return (
    <div className="auth-screen-layout">
      <div className="auth-card-standalone">
        {/* Brand Header */}
        <div className="auth-header-brand">
          <img src="/logo.svg" alt="SkinGen Logo" className="auth-screen-logo" />
          <h1 className="auth-title">SkinGen</h1>
          <span className="auth-tagline">PRECISION DERMATOLOGICAL GUIDANCE</span>
        </div>

        {/* Tab Switcher */}
        {mode !== 'forgot' ? (
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessNotice('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
                setSuccessNotice('');
              }}
            >
              Create Account
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', margin: '14px 0 10px 0' }}>
            <h3 style={{ fontSize: '17px', color: 'var(--text-main)', fontWeight: 700 }}>
              Reset Demo Password
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Enter your registered clinical email to simulate password recovery
            </p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="auth-alert-box error">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Notice */}
        {successNotice && (
          <div className="auth-alert-box success">
            <CheckCircle2 size={15} />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Form: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ marginTop: '14px' }}>
            <div className="auth-input-group">
              <label htmlFor="login-email">Registered Email</label>
              <input
                id="login-email"
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@example.com"
                required
              />
            </div>

            <div className="auth-input-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="auth-footer-row">
              <label className="remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setErrorMessage('');
                  setSuccessNotice('');
                }}
                className="text-link-btn"
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn-auth-submit">
              <span>Sign In</span>
              <ArrowRight size={15} />
            </button>
          </form>
        )}

        {/* Form: SIGN UP */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUpSubmit} style={{ marginTop: '14px' }}>
            <div className="auth-input-group">
              <label htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                type="text"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Your Full Name"
                required
              />
            </div>

            <div className="auth-input-group">
              <label htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@example.com"
                required
              />
            </div>

            <div className="auth-input-group">
              <label htmlFor="signup-password">Create Password</label>
              <input
                id="signup-password"
                type="password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 4 characters"
                required
              />
            </div>

            <div className="auth-input-group">
              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <input
                id="signup-confirm-password"
                type="password"
                className="auth-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
              />
            </div>

            <button type="submit" className="btn-auth-submit" style={{ marginTop: '12px' }}>
              <span>Create Account & Continue</span>
              <ArrowRight size={15} />
            </button>
          </form>
        )}

        {/* Form: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} style={{ marginTop: '14px' }}>
            <div className="auth-input-group">
              <label htmlFor="forgot-email">Account Email Address</label>
              <input
                id="forgot-email"
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@example.com"
                required
              />
            </div>

            <button type="submit" className="btn-auth-submit">
              <span>Send Demo Recovery Link</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                  setSuccessNotice('');
                }}
                className="text-link-btn"
                style={{ fontWeight: 600 }}
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Footer Disclaimer */}
        <p className="auth-disclaimer-text">
          SkinGen Clinical Guidance • Client-Side Demonstration Mode
        </p>
      </div>
    </div>
  );
}
