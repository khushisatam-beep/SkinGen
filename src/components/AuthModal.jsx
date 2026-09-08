import React, { useState } from 'react';
import { X, Lock, Mail, User } from 'lucide-react';
// // useContext: Accessing global user update functions
import { useApp } from '../context/AppContext';

export default function AuthModal() {
  // // useContext: Consuming user and modal controls from AppContext
  const { user, setUser, isAuthModalOpen, setIsAuthModalOpen, triggerNotification } = useApp();

  // // useState: Modal tab, inputs, and checkbox
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState(user?.email || 'jeet.patel@skingen.ai');
  const [name, setName] = useState(user?.name || 'Jeet');
  const [password, setPassword] = useState('••••••••');
  const [rememberMe, setRememberMe] = useState(true);

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setUser(prev => ({
      ...prev,
      name: name.trim(),
      email: email.trim(),
      avatarInitial: name.trim().charAt(0).toUpperCase()
    }));

    triggerNotification(`Logged in successfully as ${name.trim()}!`);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsAuthModalOpen(false)}>
      <div className="auth-card-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className="modal-close-btn"
          onClick={() => setIsAuthModalOpen(false)}
          title="Close modal"
        >
          ✕
        </button>

        {/* Logo matching media_1788884329303.png */}
        <img src="/logo.svg" alt="SkinGen Logo" className="auth-modal-logo" />

        <h3>Welcome to SkinGen</h3>
        <p className="auth-subtitle">Precision Dermatological Guidance</p>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* User Name Field */}
          <div className="auth-input-group">
            <label htmlFor="auth-name">Your Full Name</label>
            <input
              id="auth-name"
              type="text"
              className="auth-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jeet"
              required
            />
          </div>

          {/* Email Field */}
          <div className="auth-input-group">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Field */}
          <div className="auth-input-group">
            <label htmlFor="auth-pwd">Password</label>
            <input
              id="auth-pwd"
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
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault();
                triggerNotification('Password reset link dispatched to registered email.');
              }}
              style={{ color: '#5e6f65', textDecoration: 'none' }}
            >
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn-auth-submit">
            {activeTab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
