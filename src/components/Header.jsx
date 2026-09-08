import React from 'react';
import { Bell, HelpCircle, Sun, Moon } from 'lucide-react';
// // useContext: Accessing global user name and theme
import { useApp } from '../context/AppContext';

export default function Header() {
  // // useContext: Extracting user profile and theme from AppContext
  const {
    user,
    theme,
    toggleTheme,
    setIsAuthModalOpen,
    triggerNotification
  } = useApp();

  return (
    <header className="header">
      <div className="header-welcome">
        {/* User name provided globally via useContext */}
        <h2>Welcome back, {user?.name || 'Khushi'}</h2>
        <p>Here is your dermatological overview for today.</p>
      </div>

      <div className="header-actions">
        {/* Notification Bell */}
        <button
          className="icon-btn"
          title="Notifications"
          onClick={() => triggerNotification('Daily UV index advisory: moderate sun protection advised.')}
        >
          <Bell size={18} />
          <span className="badge-dot" />
        </button>

        {/* Theme Toggle Button */}
        <button
          className="icon-btn"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          onClick={toggleTheme}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Help & Support */}
        <button
          className="icon-btn"
          title="Clinical Support"
          onClick={() => triggerNotification('Clinical support helpline: 1-800-SKINGEN or support@skingen.ai')}
        >
          <HelpCircle size={18} />
        </button>

        {/* User Avatar & Profile Modal Trigger */}
        <div
          className="user-avatar-btn"
          onClick={() => setIsAuthModalOpen(true)}
          title="User Account / Settings"
        >
          <div className="avatar-circle">
            {user?.avatarInitial || 'J'}
          </div>
          <span className="user-name-label">{user?.name || 'Jeet'}</span>
        </div>
      </div>
    </header>
  );
}
