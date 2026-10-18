import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Moon,
  Sun,
  Bell,
  Shield,
  Sliders,
  History,
  Info,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  KeyRound,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const {
    user,
    setUser,
    theme,
    toggleTheme,
    assessmentHistory,
    currentAssessment,
    setActiveTab,
    triggerNotification,
    logout
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [measurementUnit, setMeasurementUnit] = useState('metric'); // 'metric' | 'imperial'
  const [uvThreshold, setUvThreshold] = useState('moderate');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [spfReminders, setSpfReminders] = useState(true);
  const [demoPwdSuccess, setDemoPwdSuccess] = useState('');

  // Keep input fields synchronized whenever global user state updates
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  // Save profile updates
  const handleSaveProfile = (e) => {
    e.preventDefault();
    const cleanName = profileName.trim();
    if (!cleanName) return;
    const cleanEmail = profileEmail.trim();

    const updatedUser = {
      ...user,
      name: cleanName,
      email: cleanEmail,
      avatarInitial: cleanName.charAt(0).toUpperCase()
    };

    setUser(updatedUser);

    try {
      localStorage.setItem('skingen_current_user', JSON.stringify(updatedUser));
      if (cleanEmail) {
        const savedUsers = JSON.parse(localStorage.getItem('skingen_users_db') || '{}');
        savedUsers[cleanEmail.toLowerCase()] = updatedUser;
        localStorage.setItem('skingen_users_db', JSON.stringify(savedUsers));
      }
    } catch (err) {
      console.error('Error saving updated profile:', err);
    }

    triggerNotification('User profile settings updated successfully.');
  };

  // Reset local data
  const handleResetLocalData = () => {
    if (window.confirm('Reset all saved local assessments back to baseline defaults?')) {
      localStorage.removeItem('skingen_assessment_data');
      triggerNotification('Local clinical data reset to default baseline.');
      window.location.reload();
    }
  };

  // Demo password change handler
  const handleDemoPasswordChange = (e) => {
    e.preventDefault();
    setDemoPwdSuccess('Demo credential change recorded (Simulated client-side only).');
    setTimeout(() => setDemoPwdSuccess(''), 4000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'preferences', label: 'Assessment Preferences', icon: Sliders },
    { id: 'history', label: 'Assessment Archive', icon: History },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Account Security', icon: Shield },
    { id: 'privacy', label: 'Privacy & Data', icon: Trash2 },
    { id: 'about', label: 'About', icon: Info }
  ];

  return (
    <div className="card-panel" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Settings Header */}
      <div className="card-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={22} color="#275941" />
          <h3>System & Clinical Settings</h3>
        </div>
        <button className="btn-secondary" onClick={() => setActiveTab('dashboard')}>
          <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Dashboard
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="settings-nav-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`settings-nav-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveSubTab(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="settings-content-body">
        {/* TAB 1: PROFILE */}
        {activeSubTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="settings-form-section">
            <h4 className="settings-section-title">Patient Profile Details</h4>
            <p className="settings-section-desc">
              Manage your display name and registered email for dermatological records.
            </p>

            <div className="form-group" style={{ maxWidth: '440px' }}>
              <label className="form-label" htmlFor="settings-name">Full Name</label>
              <input
                id="settings-name"
                type="text"
                className="form-input"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g. Your Full Name"
                required
              />
            </div>

            <div className="form-group" style={{ maxWidth: '440px' }}>
              <label className="form-label" htmlFor="settings-email">Email Address</label>
              <input
                id="settings-email"
                type="email"
                className="form-input"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="e.g. name@example.com"
                required
              />
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-primary">
                Save Profile Changes
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveTab('userform')}
              >
                Open Full Clinical Form
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: APPEARANCE */}
        {activeSubTab === 'appearance' && (
          <div className="settings-form-section">
            <h4 className="settings-section-title">Interface Appearance</h4>
            <p className="settings-section-desc">
              Choose your preferred visual presentation theme.
            </p>

            <div className="settings-toggle-row">
              <div>
                <strong>Theme Mode</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Currently active: <span style={{ textTransform: 'capitalize' }}>{theme} Mode</span>
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={toggleTheme}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                <span>Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: PREFERENCES */}
        {activeSubTab === 'preferences' && (
          <div className="settings-form-section">
            <h4 className="settings-section-title">Skin Assessment Parameters</h4>
            <p className="settings-section-desc">
              Customize units and UV sensitivity levels for AI evaluations.
            </p>

            <div className="form-group" style={{ maxWidth: '400px' }}>
              <label className="form-label">Water Intake Measurement Units</label>
              <select
                className="form-input"
                value={measurementUnit}
                onChange={(e) => setMeasurementUnit(e.target.value)}
              >
                <option value="metric">Metric (Liters / Day)</option>
                <option value="imperial">Imperial (Fluid Ounces / Day)</option>
              </select>
            </div>

            <div className="form-group" style={{ maxWidth: '400px' }}>
              <label className="form-label">UV Sensitivity Warning Threshold</label>
              <select
                className="form-input"
                value={uvThreshold}
                onChange={(e) => setUvThreshold(e.target.value)}
              >
                <option value="moderate">Moderate UV Index (&gt; 3.0)</option>
                <option value="high">High UV Index (&gt; 6.0)</option>
                <option value="very_high">Very High UV Index (&gt; 8.0)</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 4: ASSESSMENT ARCHIVE */}
        {activeSubTab === 'history' && (
          <div className="settings-form-section">
            <h4 className="settings-section-title">Assessment History & Archived Scans</h4>
            <p className="settings-section-desc">
              Review your logged skin health scores and past recommendations.
            </p>

            {assessmentHistory && assessmentHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {assessmentHistory.map((item, idx) => (
                  <div key={idx} className="archive-history-card">
                    <div>
                      <strong>Score: {item.score} / 100 ({item.riskLevel} Risk)</strong>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Skin Type: {item.skinType} • Water: {item.waterIntake}L • Sun: {item.sunExposure}h • {item.lastAssessmentDate}
                      </p>
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={() => setActiveTab('result')}
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="archive-history-card">
                <div>
                  <strong>Active Baseline Assessment: {currentAssessment?.score || 62} / 100</strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Skin Type: {currentAssessment?.skinType || 'Combination'} • Risk: {currentAssessment?.riskLevel || 'Moderate'}
                  </p>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => setActiveTab('result')}
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  View Active Report
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: NOTIFICATIONS */}
        {activeSubTab === 'notifications' && (
          <div className="settings-form-section">
            <h4 className="settings-section-title">Clinical Advisories & Alerts</h4>
            <p className="settings-section-desc">
              Manage proactive alerts dispatched by the SkinGen engine.
            </p>

            <div className="settings-toggle-row">
              <div>
                <strong>Daily Environmental UV Advisories</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Receive prompt alerts when local UV index poses high phototype damage risk.
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#1b382b' }}
              />
            </div>

            <div className="settings-toggle-row">
              <div>
                <strong>Daily SPF 50+ Re-application Reminders</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Prompt for afternoon photoprotection log verification.
                </p>
              </div>
              <input
                type="checkbox"
                checked={spfReminders}
                onChange={(e) => setSpfReminders(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#1b382b' }}
              />
            </div>
          </div>
        )}

        {/* TAB 6: SECURITY & SESSION */}
        {activeSubTab === 'security' && (
          <div className="settings-form-section">
            <h4 className="settings-section-title">Account Security & Session</h4>
            <p className="settings-section-desc">
              Frontend demo mode security controls (Client-side simulation).
            </p>

            {demoPwdSuccess && (
              <div className="auth-alert-box success">
                <CheckCircle2 size={15} />
                <span>{demoPwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handleDemoPasswordChange} style={{ maxWidth: '440px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" placeholder="Enter your password" className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" placeholder="Enter new password" className="form-input" required />
              </div>
              <button type="submit" className="btn-secondary">
                Update Demo Password
              </button>
            </form>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#b91c1c', marginBottom: '6px' }}>
                End Current Clinical Session
              </h5>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Sign out of the SkinGen application and return to the login screen.
              </p>
              <button
                type="button"
                className="btn-danger-signout"
                onClick={logout}
              >
                <LogOut size={16} />
                <span>Sign Out of SkinGen</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 7: PRIVACY & DATA */}
        {activeSubTab === 'privacy' && (
          <div className="settings-form-section">
            <h4 className="settings-section-title">Data Storage & Medical Disclaimer</h4>
            <p className="settings-section-desc">
              Manage client-side stored records and clinical confidentiality terms.
            </p>

            <div style={{ padding: '16px', background: 'var(--bg-app)', borderRadius: '8px', marginBottom: '20px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Medical Disclaimer:
              </h5>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                SkinGen AI provides algorithmic risk indications based on dermatological guidelines. It is not an alternative to professional in-person histological diagnosis by a certified dermatologist.
              </p>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleResetLocalData}
              style={{ color: '#b91c1c' }}
            >
              <Trash2 size={15} style={{ marginRight: '6px' }} />
              Reset Local Assessment Storage
            </button>
          </div>
        )}

        {/* TAB 8: ABOUT */}
        {activeSubTab === 'about' && (
          <div className="settings-form-section">
            <h4 className="settings-section-title">About SkinGen AI System</h4>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '14px' }}>
              Version 1.0.0 (MERN Frontend Review Build). Precision Dermatology Platform built with React, Vite, and React Router.
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
              Backend connection: In development separately by teammate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
