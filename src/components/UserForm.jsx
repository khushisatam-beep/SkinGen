import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function UserForm() {
  const {
    user,
    setUser,
    currentAssessment,
    saveAssessment,
    triggerNotification,
    setActiveTab
  } = useApp();

  // 1. useState: Store form field values prefilled from global user profile
  const [formData, setFormData] = useState({
    name: user?.name || currentAssessment?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: user?.age || currentAssessment?.age || ''
  });

  // Keep form hydrated if user profile updates in context
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || currentAssessment?.name || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age || currentAssessment?.age || ''
      });
    }
  }, [user, currentAssessment]);

  // 2. useState: Store validation error messages for each field
  const [errors, setErrors] = useState({});

  // 3. useState: Store success message when validation passes
  const [successMessage, setSuccessMessage] = useState('');

  // Handle input changes dynamically using the input's "name" attribute
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear error message for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle form submission with preventDefault() and regex validation
  const handleSubmit = (e) => {
    e.preventDefault(); 

    const newErrors = {};

    // 1. Name validation: Only alphabets and spaces
    const nameRegex = /^[A-Za-z ]+$/;
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!nameRegex.test(formData.name.trim())) {
      newErrors.name = 'Name can only contain alphabets and spaces';
    }

    // 2. Email validation: Basic email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // 3. Phone Number validation: Exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    // 4. Age validation: Only numbers and between 1 and 100
    const ageRegex = /^[0-9]+$/;
    if (!formData.age.toString().trim()) {
      newErrors.age = 'Age is required';
    } else if (!ageRegex.test(formData.age.toString().trim())) {
      newErrors.age = 'Age must contain numbers only';
    } else {
      const ageNum = parseInt(formData.age, 10);
      if (ageNum < 1 || ageNum > 100) {
        newErrors.age = 'Age must be between 1 and 100';
      }
    }

    // If there are validation errors, display them below the fields
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSuccessMessage('');
    } else {
      // If all fields are valid, synchronize with global user state & assessment
      const parsedAge = parseInt(formData.age, 10);
      const cleanName = formData.name.trim();
      const cleanEmail = formData.email.trim();
      const cleanPhone = formData.phone.trim();

      const updatedUser = {
        ...user,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        age: parsedAge,
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
        console.error('Error persisting user form profile:', err);
      }

      if (currentAssessment) {
        saveAssessment({
          ...currentAssessment,
          name: cleanName,
          age: parsedAge
        });
      }

      setErrors({});
      setSuccessMessage('Patient clinical record updated and synchronized across all views!');
      triggerNotification('Clinical profile updated & synchronized successfully!');
    }
  };

  return (
    <div className="card-panel" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="card-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={22} color="#275941" />
          <h3>User Details & Clinical Profile</h3>
        </div>
        <button className="btn-secondary" onClick={() => setActiveTab('dashboard')}>
          <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Dashboard
        </button>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px' }}>
        Complete your patient profile for calibrated clinical assessments and hereditary risk records.
      </p>

      {/* Success Message Banner */}
      {successMessage && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '18px',
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Form with onSubmit */}
      <form onSubmit={handleSubmit}>
        {/* Name Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="user-field-name">Full Name</label>
          <input
            id="user-field-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Your Full Name"
            className="form-input"
            style={{ borderColor: errors.name ? '#ef4444' : undefined }}
          />
          {errors.name && (
            <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="user-field-email">Email Address</label>
          <input
            id="user-field-email"
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. name@example.com"
            className="form-input"
            style={{ borderColor: errors.email ? '#ef4444' : undefined }}
          />
          {errors.email && (
            <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone Number Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="user-field-phone">Phone Number</label>
          <input
            id="user-field-phone"
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. 9876543210"
            className="form-input"
            style={{ borderColor: errors.phone ? '#ef4444' : undefined }}
          />
          {errors.phone && (
            <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
              {errors.phone}
            </p>
          )}
        </div>

        {/* Age Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="user-field-age">Age (Years)</label>
          <input
            id="user-field-age"
            type="text"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="e.g. 25"
            className="form-input"
            style={{ borderColor: errors.age ? '#ef4444' : undefined }}
          />
          {errors.age && (
            <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
              {errors.age}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
        >
          Save Clinical Profile
        </button>

        {/* Navigation Link back to Home */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-forest)',
              fontSize: '13px',
              textDecoration: 'none',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </form>
    </div>
  );
}
