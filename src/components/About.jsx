import React from 'react';

/**
 * About Component
 * Serves as the About page (route '/about').
 * Displays SkinGen platform information without academic references.
 */
export default function About() {
  return (
    <div
      style={{
        maxWidth: '750px',
        margin: '40px auto',
        padding: '32px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        fontFamily: 'inherit'
      }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#275941', marginBottom: '12px' }}>
        About SkinGen AI
      </h1>
      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
        <strong>SkinGen AI</strong> is an advanced Precision Dermatology platform designed to assist individuals and clinicians in tracking and assessing skin health metrics.
      </p>

      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
        Platform Overview
      </h2>
      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
        SkinGen provides automated evaluations that factor in environmental triggers such as UV exposure, lifestyle routines including hydration levels, and hereditary genetic risk markers. Our goal is to make preventive dermatological health insights clear, accessible, and actionable.
      </p>

      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
        Core Features
      </h2>
      <ul style={{ paddingLeft: '20px', color: '#475569', lineHeight: 1.8, fontSize: '14px', marginBottom: '16px' }}>
        <li>Precision Skin Assessment and personalized risk scoring</li>
        <li>Hereditary marker tracking and pedigree analysis</li>
        <li>Customized lifestyle and UV protection care plans</li>
        <li>Centralized health profile and historical report logs</li>
      </ul>
    </div>
  );
}
