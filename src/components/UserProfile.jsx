import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Edit3,
  Check,
  X,
  LogOut,
  Activity,
  Droplets,
  Sun,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function UserProfile() {
  const {
    user,
    setUser,
    currentAssessment,
    saveAssessment,
    setActiveTab,
    triggerNotification,
    logout
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: user?.age || currentAssessment?.age || '',
    gender: user?.gender || 'Female'
  });

  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state whenever global user or assessment data updates
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age || currentAssessment?.age || '',
        gender: user.gender || 'Female'
      });
    }
  }, [user, currentAssessment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      age: user?.age || currentAssessment?.age || '',
      gender: user?.gender || 'Female'
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const newErrors = {};

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();
    const cleanPhone = formData.phone.trim();

    if (!cleanName) {
      newErrors.name = 'Full name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (cleanPhone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = 'Phone number must be exactly 10 digits.';
      }
    }

    if (formData.age) {
      const ageNum = parseInt(formData.age, 10);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
        newErrors.age = 'Age must be between 1 and 100.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const parsedAge = formData.age ? parseInt(formData.age, 10) : user?.age || 24;

    const updatedUser = {
      ...user,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      age: parsedAge,
      gender: formData.gender,
      avatarInitial: cleanName.charAt(0).toUpperCase(),
      healthProfileComplete: 100
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

    if (currentAssessment && typeof saveAssessment === 'function') {
      saveAssessment({
        ...currentAssessment,
        name: cleanName,
        age: parsedAge
      });
    }

    setErrors({});
    setIsEditing(false);
    setSaveSuccess(true);
    triggerNotification('User profile synchronized successfully across all pages!');
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const displayName = user?.name ? user.name.trim() : 'User';
  const displayEmail = user?.email ? user.email.trim() : 'No email address registered';
  const avatarChar = user?.avatarInitial || (user?.name && user.name.trim() ? user.name.trim().charAt(0).toUpperCase() : 'U');

  // Check if skin assessment information exists
  const hasAssessment = currentAssessment && (currentAssessment.skinType || currentAssessment.score);
  const skinType = currentAssessment?.skinType || null;
  const score = currentAssessment?.score || null;
  const riskLevel = currentAssessment?.riskLevel || null;
  const waterIntake = currentAssessment?.waterIntake || null;
  const sunExposure = currentAssessment?.sunExposure !== undefined ? currentAssessment.sunExposure : null;

  return (
    <div className="user-profile-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner Navigation & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            User Profile
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Clinical account details, biometric parameters, and dermatological records
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-danger-signout"
            onClick={logout}
            title="End Session"
            style={{ padding: '8px 16px', fontSize: '12.5px' }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="auth-alert-box success" style={{ marginTop: 0 }}>
          <CheckCircle2 size={16} />
          <span>Profile changes saved and synchronized across header, dashboard, and settings!</span>
        </div>
      )}

      {/* 1. Profile Overview Hero Banner */}
      <div
        className="card-panel"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--accent-sage-light) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 32px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Big Avatar */}
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-dark)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 800,
                border: '3px solid var(--accent-green)',
                boxShadow: '0 4px 14px rgba(27, 56, 43, 0.25)',
                flexShrink: 0
              }}
            >
              {avatarChar}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {displayName}
                </h3>
                <span
                  style={{
                    backgroundColor: 'var(--accent-sage-light)',
                    color: 'var(--primary-forest)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ShieldCheck size={13} />
                  Verified Patient
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                {displayEmail}
              </p>
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '12px', color: 'var(--text-light)' }}>
                <span><strong>Health Profile:</strong> {user?.healthProfileComplete || 85}% Complete</span>
                <span>•</span>
                <span><strong>Patient ID:</strong> {user?.patientId || 'SKN-9428'}</span>
              </div>
            </div>
          </div>

          <div>
            {!isEditing ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsEditing(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Edit3 size={15} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <X size={15} />
                <span>Cancel Editing</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Personal Information + Skin Profile */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* 2. Personal Information Section */}
        <div className="card-panel">
          <div className="card-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--primary-forest)" />
              <h3>Personal Information</h3>
            </div>
            {!isEditing && (
              <button
                type="button"
                className="header-link"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            )}
          </div>

          {!isEditing ? (
            /* View Mode */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginTop: '8px' }}>
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-sage-light)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Full Name
                </span>
                <p style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                  {user?.name && user.name.trim() ? user.name.trim() : (
                    <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontWeight: 400 }}>Not provided</span>
                  )}
                </p>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-sage-light)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Email Address
                </span>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                  {user?.email && user.email.trim() ? user.email.trim() : (
                    <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontWeight: 400 }}>Not provided</span>
                  )}
                </p>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-sage-light)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Phone Number
                </span>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                  {user?.phone && user.phone.trim() ? user.phone.trim() : (
                    <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontWeight: 400 }}>Not recorded</span>
                  )}
                </p>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-sage-light)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Age
                </span>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                  {formData.age ? `${formData.age} years` : (
                    <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontWeight: 400 }}>Not recorded</span>
                  )}
                </p>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-sage-light)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Biological Sex
                </span>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                  {formData.gender || (
                    <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontWeight: 400 }}>Not specified</span>
                  )}
                </p>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-sage-light)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Record Status
                </span>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-forest)', margin: '4px 0 0 0' }}>
                  Active Clinical Profile
                </p>
              </div>
            </div>
          ) : (
            /* Edit Mode Form */
            <form onSubmit={handleSave} style={{ marginTop: '10px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="prof-name">Full Name *</label>
                <input
                  id="prof-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Your Full Name"
                  className="form-input"
                  style={{ borderColor: errors.name ? '#ef4444' : undefined }}
                  required
                />
                {errors.name && (
                  <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.name}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-email">Email Address *</label>
                <input
                  id="prof-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. name@example.com"
                  className="form-input"
                  style={{ borderColor: errors.email ? '#ef4444' : undefined }}
                  required
                />
                {errors.email && (
                  <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>
                )}
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="prof-phone">Phone Number</label>
                  <input
                    id="prof-phone"
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    className="form-input"
                    style={{ borderColor: errors.phone ? '#ef4444' : undefined }}
                  />
                  {errors.phone && (
                    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.phone}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prof-age">Age (years)</label>
                  <input
                    id="prof-age"
                    type="number"
                    min="1"
                    max="100"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="e.g. 25"
                    className="form-input"
                    style={{ borderColor: errors.age ? '#ef4444' : undefined }}
                  />
                  {errors.age && (
                    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.age}</p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-gender">Biological Sex</label>
                <select
                  id="prof-gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} />
                  <span>Save Changes</span>
                </button>
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 3. Skin Profile Section */}
        <div className="card-panel">
          <div className="card-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--primary-forest)" />
              <h3>Dermatological Skin Profile</h3>
            </div>
            {hasAssessment && (
              <button
                type="button"
                className="header-link"
                onClick={() => setActiveTab('assessment')}
              >
                Retake
              </button>
            )}
          </div>

          {hasAssessment ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Score & Risk Badge Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Barrier Health Score
                  </span>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                    {score !== null ? `${score} / 100` : 'Not scored'}
                  </div>
                </div>

                {riskLevel && (
                  <span
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: riskLevel === 'Low' ? '#dcfce7' : riskLevel === 'High' ? '#fee2e2' : '#fef3c7',
                      color: riskLevel === 'Low' ? '#15803d' : riskLevel === 'High' ? '#b91c1c' : '#b45309'
                    }}
                  >
                    {riskLevel} Risk
                  </span>
                )}
              </div>

              {/* Skin Attributes Table */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Classified Skin Type</span>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                    {skinType || 'Not specified'}
                  </p>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Daily Water Intake</span>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                    {waterIntake !== null ? `${waterIntake} L/day` : 'Not recorded'}
                  </p>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sun Exposure</span>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                    {sunExposure !== null ? `${sunExposure} hrs/day` : 'Not recorded'}
                  </p>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last Assessment</span>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                    {currentAssessment?.lastAssessmentDate || 'Recent'}
                  </p>
                </div>
              </div>

              {/* Skin Concerns / Regimen Focus */}
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', backgroundColor: 'var(--accent-sage-light)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-forest)', textTransform: 'uppercase' }}>
                  Target Clinical Focus
                </span>
                <p style={{ fontSize: '12.5px', color: 'var(--text-main)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  {currentAssessment?.concerns?.join(', ') || 'Barrier integrity, lipid balance, and broad-spectrum photoprotection.'}
                </p>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveTab('result')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                View Complete Regimen & Report
              </button>
            </div>
          ) : (
            /* Empty State */
            <div style={{ textAlign: 'center', padding: '36px 16px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-sage-light)',
                  color: 'var(--primary-forest)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px auto'
                }}
              >
                <Sparkles size={24} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                No Skin Assessment On Record
              </h4>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '320px', margin: '0 auto 18px auto', lineHeight: 1.45 }}>
                Complete the dermatological parameters to calculate your personal barrier score, risk category, and customized care plan.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setActiveTab('assessment')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Take Skin Assessment</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
