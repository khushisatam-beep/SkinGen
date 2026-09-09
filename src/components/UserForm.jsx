import React, { useState } from 'react';

/**
 * UserForm Component
 * Demonstrates:
 * 1. Form handling using React controlled inputs (useState & onChange)
 * 2. Regular expression (Regex) validation for inputs
 * 3. event.preventDefault() to prevent page reload on form submit
 */
export default function UserForm() {
  // 1. useState: Store form field values
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: ''
  });

  // 2. useState: Store validation error messages for each field
  const [errors, setErrors] = useState({});

  // 3. useState: Store success message when validation passes
  const [successMessage, setSuccessMessage] = useState('');

  // Handle input changes dynamically using the input's "name" attribute
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error message for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Handle form submission with preventDefault() and regex validation
  const handleSubmit = (e) => {
    // Prevent default browser behavior (page reload)
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
    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else if (!ageRegex.test(formData.age.trim())) {
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
      // If all fields are valid, show success message and clear errors
      setErrors({});
      setSuccessMessage('Form submitted successfully!');
    }
  };

  return (
    <div
      style={{
        maxWidth: '520px',
        margin: '20px auto',
        padding: '28px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        fontFamily: 'inherit'
      }}
    >
      <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
        User Details
      </h2>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '22px' }}>
        Please enter your details below.
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
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
              marginBottom: '6px'
            }}
          >
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              borderRadius: '6px',
              border: errors.name ? '1px solid #ef4444' : '1px solid #cbd5e1',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {errors.name && (
            <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Input */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
              marginBottom: '6px'
            }}
          >
            Email
          </label>
          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. user@example.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              borderRadius: '6px',
              border: errors.email ? '1px solid #ef4444' : '1px solid #cbd5e1',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {errors.email && (
            <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone Number Input */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
              marginBottom: '6px'
            }}
          >
            Phone Number
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter 10-digit mobile number"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              borderRadius: '6px',
              border: errors.phone ? '1px solid #ef4444' : '1px solid #cbd5e1',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {errors.phone && (
            <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
              {errors.phone}
            </p>
          )}
        </div>

        {/* Age Input */}
        <div style={{ marginBottom: '22px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
              marginBottom: '6px'
            }}
          >
            Age
          </label>
          <input
            type="text"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Enter age (1 - 100)"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              borderRadius: '6px',
              border: errors.age ? '1px solid #ef4444' : '1px solid #cbd5e1',
              outline: 'none',
              boxSizing: 'border-box'
            }}
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
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#275941',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          Submit
        </button>
      </form>
    </div>
  );
}
